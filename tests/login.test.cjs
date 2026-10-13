const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function loginHarness(){
 const events=[];
 const context=vm.createContext({window:{},saveLocal:()=>events.push('backup-device'),render:()=>events.push('render'),ui:{mode:'students'}});
 const source=fs.readFileSync('schools.js','utf8');
 vm.runInContext(source.slice(0,source.indexOf('const PW=')),context);
 const workspace=context.window.PartyWorkspace;
 workspace.originalLoadAccess=workspace.loadAccess;workspace.originalSwitchOnline=workspace.switchOnline;
 workspace.loadAccess=async()=>events.push('authorize');
 workspace.applyStore=()=>events.push('open-cloud');
 workspace.switchOnline=async(id)=>events.push('school:'+id);
 return {workspace,events,context};
}
test('email-link login verifies the user with the server before opening cloud data',async()=>{
 const {workspace,events}=loginHarness();
 workspace.client={auth:{getUser:async()=>({data:{user:{id:'owner',email:'owner@example.org'}}})}};
 workspace.admin=true;
 await workspace.enterOnline();
 assert.equal(workspace.online,true);
 assert.deepEqual(events,['authorize','backup-device','open-cloud','render']);
 assert.match(workspace.status,/administrator/);
});
test('rejected email-link sessions cannot replace the device workspace',async()=>{
 const {workspace,events}=loginHarness();
 workspace.client={auth:{getUser:async()=>({data:{},error:new Error('Invalid session')})}};
 await assert.rejects(workspace.enterOnline(),/Invalid session/);
 assert.equal(workspace.online,false);assert.deepEqual(events,[]);
});
test('database authorization failure preserves local classroom data',async()=>{
 const {workspace,events}=loginHarness();
 workspace.client={auth:{getUser:async()=>({data:{user:{id:'teacher'}}})}};
 workspace.loadAccess=async()=>{throw new Error('Database unavailable');};
 await assert.rejects(workspace.enterOnline(),/Database unavailable/);
 assert.equal(workspace.online,false);assert.deepEqual(events,[]);
});
test('family-only login opens the private portal without a teacher school',async()=>{
 const {workspace,events,context}=loginHarness();
 workspace.client={auth:{getUser:async()=>({data:{user:{id:'parent'}}})}};
 workspace.familyLinks=[{id:'child-link'}];
 await workspace.enterOnline();
 assert.equal(context.ui.mode,'family');assert.equal(workspace.school,null);
 assert.deepEqual(events,['authorize','backup-device','open-cloud','render']);
});

test('login reopens the remembered approved cloud school',async()=>{
 const {workspace,events,context}=loginHarness();
 context.window.sessionStorage={getItem:()=> 'school-two'};
 workspace.schools=[{id:'school-one'},{id:'school-two'}];
 workspace.client={auth:{getUser:async()=>({data:{user:{id:'owner'}}})}};
 await workspace.enterOnline();
 assert.equal(events.at(-1),'school:school-two');
});

test('device migration saves the roster online and rejects occupied schools',async()=>{
 const {workspace,events,context}=loginHarness();
 const payload={roster:{601:['Student']},classes:{601:{points:{1:3}}}};
 Object.assign(context,{localSchoolIndex:{schools:[{id:'default',name:'School'}]},localStorage:{getItem:()=>JSON.stringify(payload)},cleanRoster:r=>r,PartyCore:{sanitizeClass:c=>c},PortalCore:{clean:p=>p||{}}});
 workspace.online=true;workspace.admin=true;workspace.schools=[{id:'school',name:'School'}];
 let occupied=false,saved;
 workspace.client={from:()=>({select:()=>({eq:()=>({single:async()=>({data:{revision:2,data:occupied?payload:{}}})})})})};
 workspace.rpc=async(name,args)=>{saved={name,args};return 3;};
 await workspace.importDeviceSchool('default');
 assert.equal(saved.name,'pp_save_school');assert.equal(saved.args.p_revision,2);
 assert.equal(saved.args.p_data.classes[601].points[1],3);
 assert.equal(events.at(-1),'school:school');
 occupied=true;saved=null;
 await assert.rejects(workspace.importDeviceSchool('default'),/already has classes/);
 assert.equal(saved,null);
});

test('device migration rejects teachers before reading device data',async()=>{
 const {workspace}=loginHarness();workspace.online=true;workspace.admin=false;
 await assert.rejects(workspace.importDeviceSchool('default'),/ADMIN_REQUIRED/);
});

test('auth events defer server calls until the Supabase callback returns',async()=>{
 const {workspace,context}=loginHarness();let callback,opened=0;const pending=[];
 context.setTimeout=fn=>pending.push(fn);context.clearTimeout=()=>{};
 workspace.client={auth:{onAuthStateChange:fn=>{callback=fn;return {data:{subscription:{}}};}}};
 workspace.enterOnline=async()=>{opened++;workspace.online=true;workspace.user={id:'teacher'};};
 workspace.bindAuth();
 assert.equal(callback('SIGNED_IN',{user:{id:'teacher'}}),undefined);
 assert.equal(opened,0);await pending.shift()();assert.equal(opened,1);
 callback('TOKEN_REFRESHED',{user:{id:'teacher'}});assert.equal(opened,1);
});

test('missing optional family migration does not prevent teacher access',async()=>{
 const {workspace,context}=loginHarness();workspace.loadAccess=workspace.originalLoadAccess;
 context.PortalCore=require('../portal-core.js');workspace.user={id:'teacher'};
 workspace.rpc=async name=>{if(name==='pp_accept_family')throw {code:'PGRST202',message:'missing function'};return name==='pp_is_admin'?false:undefined;};
 workspace.client={from:table=>({select:()=>({order:async()=>({data:table==='pp_schools'?[{id:'school'}]:[{id:'member',school_id:'school',user_id:'teacher',status:'approved',permissions:{points:true}}]})})})};
 await workspace.loadAccess();assert.equal(workspace.schools[0].id,'school');assert.equal(workspace.familyLinks.length,0);assert.match(workspace.accessNotice,/family/i);
});

test('permissions fail closed for missing setup, other schools, pending and revoked members',()=>{
 const {workspace}=loginHarness();workspace.online=true;workspace.school='a';workspace.user={id:'teacher'};
 workspace.members=[{school_id:'a',user_id:'teacher',status:'approved',permissions:{points:true,activities:false}}];workspace.permissionsReady=true;
 assert.equal(workspace.can('points'),true);assert.equal(workspace.can('activities'),false);
 workspace.school='b';assert.equal(workspace.can('points'),false);workspace.school='a';
 workspace.members[0].status='pending';assert.equal(workspace.can('points'),false);workspace.members[0].status='revoked';assert.equal(workspace.can('points'),false);
 workspace.members[0].status='approved';workspace.permissionsReady=false;assert.equal(workspace.can('points'),false);
 workspace.admin=true;assert.equal(workspace.can('roster'),true);workspace.online=false;assert.equal(workspace.can('activities'),true);
});

test('concurrent OTP and auth event entry authorizes once and keeps the active school',async()=>{
 const {workspace,events}=loginHarness();let release;const gate=new Promise(r=>release=r);
 workspace.client={auth:{getUser:async()=>{await gate;return {data:{user:{id:'teacher'}}};}}};
 const first=workspace.enterOnline(),second=workspace.enterOnline();release();await Promise.all([first,second]);
 assert.equal(events.filter(x=>x==='authorize').length,1);
 workspace.school='active';await workspace.enterOnline();assert.equal(workspace.school,'active');
});

test('a same-account auth callback waiting for entry cannot clear the freshly opened school',async()=>{
 const {workspace,context}=loginHarness();let callback,release,cleared=0,opened=0;const pending=[];
 context.setTimeout=fn=>pending.push(fn);
 workspace.client={auth:{onAuthStateChange:fn=>{callback=fn;return {data:{subscription:{}}};}}};
 workspace.entering=new Promise(resolve=>release=resolve);
 workspace.leaveOnline=()=>{cleared++;workspace.online=false;workspace.school=null;};
 workspace.enterOnline=async()=>{opened++;};
 workspace.bindAuth();callback('INITIAL_SESSION',{user:{id:'teacher'}});
 const deferred=pending.shift()();
 workspace.online=true;workspace.user={id:'teacher'};workspace.school='remembered-school';release();await deferred;
 assert.equal(cleared,0);assert.equal(opened,0);assert.equal(workspace.school,'remembered-school');
});

test('queued sign-in cannot reopen a workspace after sign-out',async()=>{
 const {workspace,context}=loginHarness();let callback,opened=0;const pending=[];
 context.setTimeout=fn=>pending.push(fn);workspace.client={auth:{onAuthStateChange:fn=>{callback=fn;return {data:{subscription:{}}};}}};
 workspace.enterOnline=async()=>opened++;workspace.bindAuth();
 callback('SIGNED_IN',{user:{id:'teacher'}});callback('SIGNED_OUT',null);await pending.shift()();assert.equal(opened,0);
});

test('network and access failures in family setup are not disguised as a missing migration',async()=>{
 const {workspace}=loginHarness();workspace.loadAccess=workspace.originalLoadAccess;workspace.user={id:'teacher'};
 workspace.rpc=async name=>{if(name==='pp_accept_family')throw {code:'42501',message:'permission denied'};};
 await assert.rejects(workspace.loadAccess(),error=>error.code==='42501');assert.equal(workspace.online,false);
});

test('only the global admin sees the permission editing panel',()=>{
 const {workspace,context}=loginHarness();workspace.online=true;workspace.permissionsReady=true;workspace.user={id:'teacher',email:'teacher@example.org'};
 workspace.members=[{id:'member',school_id:'a',user_id:'teacher',email:'teacher@example.org',status:'approved',permissions:{points:true}}];
 workspace.schools=[{id:'a',name:'School A'}];workspace.configured=()=>true;
 context.RENDER={};context.view={innerHTML:''};context.esc=v=>String(v);const source=fs.readFileSync('schools.js','utf8');
 vm.runInContext('const PW=window.PartyWorkspace;'+source.slice(source.indexOf('RENDER.account=()=>'),source.indexOf("document.addEventListener('click'")),context);
 context.RENDER.account();assert.doesNotMatch(context.view.innerHTML,/data-party="savepermissions"/);
 workspace.admin=true;context.RENDER.account();assert.match(context.view.innerHTML,/data-party="savepermissions"/);assert.match(context.view.innerHTML,/Allow activities/);
 workspace.permissionsReady=false;context.RENDER.account();assert.doesNotMatch(context.view.innerHTML,/data-party="savepermissions"/);assert.match(context.view.innerHTML,/permissions.sql database migration/);
});

test('a different signed-in account waits for old entry to finish, then clears the old workspace',async()=>{
 const {workspace,context}=loginHarness();let callback,release,opened=0,cleared=0;const pending=[];
 context.setTimeout=fn=>pending.push(fn);workspace.client={auth:{onAuthStateChange:fn=>{callback=fn;return {data:{subscription:{}}};}}};
 workspace.online=true;workspace.user={id:'owner'};workspace.entering=new Promise(resolve=>release=resolve);
 workspace.leaveOnline=()=>{cleared++;workspace.online=false;workspace.user=null;};
 workspace.enterOnline=async()=>{opened++;workspace.online=true;workspace.user={id:'teacher'};};
 workspace.bindAuth();callback('INITIAL_SESSION',{user:{id:'owner'}});callback('SIGNED_IN',{user:{id:'teacher'}});
 await pending[0]();const next=pending[1]();assert.equal(opened,0);release();await next;
 assert.equal(opened,1);assert.ok(cleared>=1);assert.equal(workspace.user.id,'teacher');
});

test('a school read from the previous account cannot replace the new account school',async()=>{
 const {workspace,context,events}=loginHarness();let release;
 context.rolling=false;workspace.online=true;workspace.user={id:'owner'};workspace.schools=[{id:'old-school'}];workspace.sourceAccessReady=true;
 workspace.renderBar=()=>{};workspace.setStatus=()=>{};workspace.rpc=()=>new Promise(resolve=>release=resolve);
 const old=workspace.originalSwitchOnline('old-school');workspace.authEpoch++;workspace.user={id:'teacher'};workspace.school='new-school';workspace.busy=true;
 release({data:{roster:{}},revision:99});await old;
 assert.equal(workspace.school,'new-school');assert.equal(workspace.busy,true);assert.equal(events.includes('open-cloud'),false);
});

test('a save response from the previous account cannot alter the new account revision or save flag',async()=>{
 const {workspace,context}=loginHarness();let release;
 context.store={roster:{}};context.setTimeout=()=>0;
 workspace.online=true;workspace.school='old-school';workspace.dirty=true;workspace.renderBar=()=>{};workspace.setStatus=()=>{};
 workspace.rpc=()=>new Promise(resolve=>release=resolve);
 const old=workspace.flush();workspace.authEpoch++;workspace.school='new-school';workspace.revision=7;workspace.saving=true;
 release(99);await old;
 assert.equal(workspace.revision,7);assert.equal(workspace.saving,true);
});
