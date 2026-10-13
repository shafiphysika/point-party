/* School workspaces. Online authorization always comes from database policies. */
window.PartyWorkspace={
 online:false,client:null,user:null,admin:false,schools:[],members:[],invites:[],familyLinks:[],
 school:null,revision:0,dirty:false,saving:false,blocked:false,timer:null,busy:false,status:'',permissionsReady:false,accessNotice:'',authEpoch:0,entering:null,
 missingSetup(error){return /^(PGRST202|PGRST204|PGRST205|42P01|42703)$/.test(error?.code||'');},
 can(key,school=this.school){
  if(!['points','activities','materials','roster','invite'].includes(key))return false;
  if(!this.online)return true;
  if(!school||this.busy||this.blocked)return false;
  if(this.admin)return true;
  return this.permissionsReady&&this.members.some(m=>m.school_id===school&&m.user_id===this.user?.id&&m.status==='approved'&&m.permissions?.[key]===true);
 },
 bindAuth(){
  this.authSubscription=this.client.auth.onAuthStateChange((event,session)=>{
   // Supabase callbacks must return before another auth/database request starts.
   if(event==='SIGNED_OUT'){this.authActor=null;this.accountReady=false;this.authEpoch++;if(this.online)this.leaveOnline();return;}
   if(!['SIGNED_IN','INITIAL_SESSION'].includes(event)||!session?.user)return;
   if(this.authActor!==session.user.id){this.authActor=session.user.id;this.authEpoch++;this.accountReady=false;}
   const epoch=this.authEpoch;
   setTimeout(async()=>{
    if(epoch!==this.authEpoch||(this.online&&this.user?.id===session.user.id))return;
    if(this.entering){try{await this.entering;}catch{}}
    if(epoch!==this.authEpoch)return;
    if(this.online)this.leaveOnline();
    try{await this.enterOnline();}
    catch(error){this.status=PortalCore.authError(error);ui.mode='account';render();}
   },0);
  }).data.subscription;
 },
 configured(){const c=window.POINT_PARTY_CONFIG;return !!(c&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(c.supabaseUrl)&&c.supabasePublishableKey);},
 async init(){
  if(!this.configured())return;
  try{
   const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
   const cfg=window.POINT_PARTY_CONFIG;
   this.client=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:true,storage:window.sessionStorage,detectSessionInUrl:true,autoRefreshToken:true}});
   this.bindAuth();
   const {data,error}=await this.client.auth.getSession();if(error)throw error;
   if(data.session){await this.enterOnline();return;}
   if(ui.mode==='account')RENDER.account();
  }catch(error){this.status=this.client?PortalCore.authError(error):'Login service could not load. Check your connection and try reloading.';ui.mode='account';render();}
 },
 async enterOnline(){
  if(this.online)return;
  if(this.entering)return this.entering;
  const epoch=this.authEpoch;
  this.entering=this.openVerifiedSession(epoch);
  try{return await this.entering;}finally{this.entering=null;}
 },
 async openVerifiedSession(epoch){
  const {data,error}=await this.client.auth.getUser();if(error)throw error;
  if(!data.user)throw new Error('VERIFIED_EMAIL_REQUIRED');
  if(epoch!==this.authEpoch)return;
  this.user=data.user;await this.loadAccess();if(epoch!==this.authEpoch)return;saveLocal();this.online=true;this.school=null;this.applyStore({});
  this.status=this.admin?'Signed in as global administrator.':this.familyLinks.length?'Signed in. Open your student and parent portal.':'Signed in. School access requires an approved invitation.';
  ui.mode=this.familyLinks.length&&!this.schools.length?'family':this.admin?'schools':'account';render();
  const remembered=window.sessionStorage?.getItem('pointparty-online-school');
  if(this.schools.some(s=>s.id===remembered))await this.switchOnline(remembered);
  else if(this.schools.length===1)await this.switchOnline(this.schools[0].id);
 },
 renderBar(){
  const list=this.online?this.schools:localSchoolIndex.schools,active=this.online?this.school:localSchoolIndex.active;
  $('#schoolbar').innerHTML=`<label for="schoolSelect">🏫 School</label><select id="schoolSelect" ${this.busy||this.saving||this.blocked?'disabled':''}>${!active?'<option value="">Choose an approved school</option>':''}${list.map(s=>`<option value="${esc(s.id)}" ${s.id===active?'selected':''}>${esc(s.name)}</option>`).join('')}</select><span class="school-note">${this.online?(this.admin?'Global admin · all schools':'Co-teacher · approved schools only'):'Device workspace · online accounts available in Teacher & admin'}</span><button class="btn account-btn" data-party="account">${this.online?'🔐 My account':'🔐 Teacher & admin'}</button>`;
 },
 applyStore(next){
  closeOverlay();undoStack=[];IMP=null;editCls=null;rolling=false;
  store=next&&typeof next==='object'?next:{};
  if(window.PortalCore)store.portal=PortalCore.clean(store.portal);
  CLASSES=cleanRoster(store.roster)||{};store.roster=CLASSES;
  store.classes=Object.fromEntries(Object.keys(CLASSES).map(id=>[id,PartyCore.sanitizeClass(store.classes?.[id])]));
  store.links=Array.isArray(store.links)?store.links.filter(l=>l&&typeof l.url==='string'&&/^https?:\/\//i.test(l.url)).slice(0,100).map((l,i)=>({id:String(l.id||i).replace(/[^a-zA-Z0-9_-]/g,''),name:String(l.name||l.url).slice(0,60),url:l.url,cls:CLASSES[l.cls]?l.cls:''})):[];
  Object.assign(ui,{cur:Object.keys(CLASSES)[0]||null,mode:'students',sound:true},store.ui||{});
  if(!CLASSES[ui.cur])ui.cur=Object.keys(CLASSES)[0]||null;
  if(!PAGES[ui.mode])ui.mode='students';store.ui=ui;
  if(this.online&&!this.school)ui.mode='account';
 },
 switchLocal(id){
  if(this.online||!localSchoolIndex.schools.some(s=>s.id===id))return;
  if(rolling){toast('Finish the lucky pick before switching schools.');this.renderBar();return;}
  saveLocal();localSchoolIndex.active=id;localStorage.setItem('pointparty-schools',JSON.stringify(localSchoolIndex));
  KEY=id==='default'?'pointparty-v1':'pointparty-school-'+id;
  let next={};try{next=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
  this.applyStore(next);render();
 },
 async rpc(name,args={}){const {data,error}=await this.client.rpc(name,args);if(error)throw error;return data;},
 async loadAccess(){
  this.accessNotice='';
  try{await this.rpc('pp_claim_owner');}catch(error){if(!this.missingSetup(error))throw error;this.accessNotice='Owner bootstrap is awaiting the platform migration. ';}
  await this.rpc('pp_accept_invitations');
  let familyReady=true;
  try{await this.rpc('pp_accept_family');}catch(error){if(!this.missingSetup(error))throw error;familyReady=false;this.accessNotice+='Student and family access is awaiting the platform migration. ';}
  const admin=await this.rpc('pp_is_admin');
  let permissionsReady=false;
  try{permissionsReady=await this.rpc('pp_permissions_version')===1;}catch(error){if(!this.missingSetup(error))throw error;}
  const results=await Promise.all([
   this.client.from('pp_schools').select('id,name').order('name'),
   this.client.from('pp_memberships').select('id,school_id,user_id,email,status'+(permissionsReady?',permissions':'')).order('email'),
   this.client.from('pp_invitations').select('id,school_id,email,expires_at,redeemed_at').order('expires_at',{ascending:false}),
   familyReady?this.client.from('pp_family_links').select('id,school_id,class_id,seat,user_id,email,kind,active').eq('user_id',this.user.id).eq('active',true):Promise.resolve({data:[]})
  ]);
  if(results[3].error&&this.missingSetup(results[3].error)){results[3]={data:[]};this.accessNotice+='Student and family access is awaiting the platform migration. ';}
  results.forEach(r=>{if(r.error)throw r.error;});
  this.admin=admin;this.permissionsReady=permissionsReady;
  if(!permissionsReady)this.accessNotice+='Teacher editing permissions are awaiting permissions.sql. Teacher changes are disabled until the administrator applies it.';
  [this.schools,this.members,this.invites,this.familyLinks]=results.map(r=>r.data);
 },
 async switchOnline(id){
  if(!this.online||!this.schools.some(s=>s.id===id)||this.busy)return;
  if(rolling){toast('Finish the lucky pick before switching schools.');this.renderBar();return;}
  if(this.saving){toast('Wait for the school save to finish.');this.renderBar();return;}
  if(this.dirty){await this.flush();if(this.dirty){toast('Save or download your unsaved work before switching schools.');this.renderBar();return;}}
  const epoch=this.authEpoch,actor=this.user?.id;
  const current=()=>epoch===this.authEpoch&&this.online&&actor===this.user?.id;
  this.busy=true;this.renderBar();
  try{
   const {data,error}=this.sourceAccessReady?{data:await this.rpc('pp_open_school',{p_school:id})}:await this.client.from('pp_school_state').select('data,revision').eq('school_id',id).single();if(error)throw error;
   if(!current())return;
   this.school=id;this.revision=data.revision;this.blocked=false;this.dirty=false;this.applyStore(data.data);window.sessionStorage?.setItem('pointparty-online-school',id);render();
   this.setStatus('School loaded · saved online');
  }catch{if(current())toast('This school could not be opened. Check your approved access and connection.');}
  finally{if(current()){this.busy=false;this.renderBar();}}
 },
 setStatus(text){const el=$('#sync');el.className='sync'+(!this.dirty&&this.online?' ok':'');el.querySelector('span').textContent=text;},
 queueSave(){
  if(!this.online||!this.school||this.busy||this.blocked)return;
  this.dirty=true;clearTimeout(this.timer);this.timer=setTimeout(()=>this.flush(),700);this.setStatus('Unsaved changes · saving soon');
 },
 async flush(){
  if(!this.online||!this.school||!this.dirty||this.blocked)return;
  if(this.saving){this.timer=setTimeout(()=>this.flush(),400);return;}
  const epoch=this.authEpoch,school=this.school;
  const current=()=>epoch===this.authEpoch&&this.online&&school===this.school;
  this.saving=true;this.dirty=false;this.setStatus('Saving school…');this.renderBar();
  const payload=JSON.parse(JSON.stringify(store));
  try{const revision=await this.rpc('pp_save_school',{p_school:school,p_revision:this.revision,p_data:payload});if(!current())return;this.revision=revision;this.setStatus(this.dirty?'More changes waiting…':'Saved online');}
  catch(error){
   if(!current())return;
   this.dirty=true;
   if(error.message&&error.message.includes('SCHOOL_CONFLICT')){this.blocked=true;this.status='Another teacher saved this school. Download a backup of your changes, then reload the school before continuing.';toast(this.status);}
   else{this.status=PortalCore.authError(error)+' Retry from My account, or download a backup before leaving.';toast(this.status);}
   this.setStatus('Unsaved changes · open My account');this.renderBar();
  }finally{if(current()){this.saving=false;this.renderBar();if(this.dirty&&!this.blocked&& !this.status)this.timer=setTimeout(()=>this.flush(),700);}}
 },
 async importDeviceSchool(id){
  if(!this.online||!this.admin)throw new Error('ADMIN_REQUIRED');
  if(this.busy||this.saving||this.dirty)throw new Error('Save the current school before restoring another school.');
  const device=localSchoolIndex.schools.find(s=>s.id===id);if(!device)throw new Error('Saved school not found.');
  const payload=JSON.parse(localStorage.getItem(id==='default'?'pointparty-v1':'pointparty-school-'+id)||'{}');
  const roster=cleanRoster(payload.roster);if(!roster)throw new Error('This saved school has no classes to restore.');
  payload.roster=roster;
  payload.classes=Object.fromEntries(Object.keys(roster).map(k=>[k,PartyCore.sanitizeClass(payload.classes?.[k])]));
  payload.portal=PortalCore.clean(payload.portal);payload.ui={cur:Object.keys(roster)[0],mode:'overview',sound:true};
  let school=this.schools.find(s=>s.name===device.name);
  if(!school){const schoolId=await this.rpc('pp_create_school',{p_name:device.name});await this.loadAccess();school=this.schools.find(s=>s.id===schoolId);}
  if(!school)throw new Error('School could not be created.');
  const {data,error}=await this.client.from('pp_school_state').select('data,revision').eq('school_id',school.id).single();if(error)throw error;
  if(Object.keys(data.data?.roster||{}).length)throw new Error('This online school already has classes. Open it to review them; restoring will not overwrite them.');
  await this.rpc('pp_save_school',{p_school:school.id,p_revision:data.revision,p_data:payload});
  await this.switchOnline(school.id);this.status='Saved device school restored online.';
 },
 leaveOnline(){
  clearTimeout(this.timer);this.busy=false;this.saving=false;this.online=false;this.user=null;this.school=null;this.admin=false;this.dirty=false;this.blocked=false;this.status='';this.familyLinks=[];this.members=[];this.schools=[];this.invites=[];this.permissionsReady=false;this.accessNotice='';
  if(window.Portal)Portal.clearFamily();window.sessionStorage?.removeItem('pointparty-online-school');
  let next={};try{next=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
  this.applyStore(next);ui.mode='account';render();setSync('local');
 },
 async action(button){
  const a=button.dataset.party;
  if(a==='account'){ui.mode='account';render();return;}
  if(a==='openlocal'){this.switchLocal(button.dataset.id);return;}
  if(a==='newlocal'){
   const name=$('#localSchoolName').value.trim();if(!name){toast('Name your school first.');return;}
   const id=crypto.randomUUID();localSchoolIndex.schools.push({id,name:name.slice(0,60)});this.switchLocal(id);ui.mode='schools';render();return;
  }
  if(a==='renamelocal'){
   const name=$('#localSchoolName').value.trim();if(!name){toast('Type a school name first.');return;}
   localSchoolIndex.schools.find(s=>s.id===localSchoolIndex.active).name=name.slice(0,60);
   localStorage.setItem('pointparty-schools',JSON.stringify(localSchoolIndex));render();return;
  }
  if(a==='openonline'){await this.switchOnline(button.dataset.id);return;}
  if(a==='importdevice'){
   if(!this.online||!this.admin)return;
   const device=localSchoolIndex.schools.find(s=>s.id===button.dataset.id);if(!device)return;
   askConfirm(`Restore ${device.name} with its saved classes, students, points and lessons into your private online school? The device copy remains saved. Existing online classes will not be overwritten.`,async()=>{try{await this.importDeviceSchool(device.id);render();}catch(error){toast(PortalCore.authError(error));}},'Restore saved school');return;
  }
  if(a==='retrysave'){this.status='';await this.flush();RENDER.account();return;}
  if(a==='reloadschool'){
   askConfirm('Reload the saved school? Download a backup first; your unsaved changes will be replaced.',()=>{this.dirty=false;this.blocked=false;this.switchOnline(this.school);},'Reload school');return;
  }
  if(a==='signout'){
   if(this.dirty||this.saving){toast('Your school is saving or has unsaved changes. Save or download a backup first.');return;}
   const {error}=await this.client.auth.signOut();if(error){toast(PortalCore.authError(error));return;}if(this.online)this.leaveOnline();return;
  }
  if(!this.client){toast(this.configured()?'Login is still loading. Try again shortly.':'Online accounts will open once the school service is connected.');return;}
  button.disabled=true;
  try{
   if(a==='sendcode'){
    if(this.codeSentAt&&Date.now()-this.codeSentAt<60000){toast('Please wait a minute before requesting another code.');return;}
    const input=$('#loginEmail');if(!input.reportValidity())return;
    this.email=input.value.trim().toLowerCase();
    const {error}=await this.client.auth.signInWithOtp({email:this.email,options:{shouldCreateUser:true,emailRedirectTo:location.origin+location.pathname}});if(error)throw error;
    this.codeSentAt=Date.now();
    this.status='Check your inbox and spam folder. Open the sign-in link in the email, or enter its code below if one is included.';RENDER.account();
   }
   if(a==='verifycode'){
    const token=$('#loginCode').value.trim();if(!/^\d{6,10}$/.test(token)){toast('Enter the code from your email.');return;}
    const {data,error}=await this.client.auth.verifyOtp({email:this.email,token,type:'email'});if(error)throw error;
    await this.enterOnline();
   }
   if(a==='refreshaccess'){await this.loadAccess();this.status='Access updated.';RENDER.account();this.renderBar();}
   if(a==='createschool'){
    const name=$('#onlineSchoolName').value.trim();if(!name){toast('Name the new school.');return;}
    await this.rpc('pp_create_school',{p_name:name});await this.loadAccess();RENDER.schools();this.renderBar();
   }
   if(a==='invite'){
    const input=$('#inviteEmail');if(!input.reportValidity())return;
    const school=$('#inviteSchool').value;
    if(!this.can('invite',school))throw new Error('PERMISSION_INVITE_REQUIRED');
    await this.rpc('pp_invite',{p_school:school,p_email:input.value.trim().toLowerCase()});await this.loadAccess();this.status='Invitation created. Share the sign-in instructions below with your co-teacher.';RENDER.account();
   }
   if(a==='approve'||a==='reject'||a==='revoke'){
    await this.rpc('pp_review_member',{p_member:button.dataset.id,p_status:a==='approve'?'approved':a==='reject'?'rejected':'revoked'});
    await this.loadAccess();this.status='Teacher access updated.';RENDER.account();
   }
   if(a==='savepermissions'){
    if(!this.admin||!this.permissionsReady)throw new Error('ADMIN_REQUIRED');
    const row=button.closest('[data-permission-member]'),permissions=Object.fromEntries(['points','activities','materials','roster','invite'].map(key=>[key,row.querySelector(`[name="${key}"]`).checked]));
    await this.rpc('pp_set_member_permissions',{p_member:button.dataset.id,p_permissions:permissions});
    await this.loadAccess();this.status='School permissions saved. The teacher can refresh approvals to see the change.';RENDER.account();
   }
  }catch(error){this.status=window.PortalCore?PortalCore.authError(error):'That action could not be completed. Check your connection and try again.';if(ui.mode==='account')RENDER.account();else toast(this.status);}
  finally{button.disabled=false;}
 }
};
const PW=window.PartyWorkspace;
RENDER.schools=()=>{
 const list=PW.online?PW.schools:localSchoolIndex.schools;
 view.innerHTML=`<section class="party-banner"><span class="party-mascot" aria-hidden="true">🏫</span><div><small>A home for every school</small><h2>One school. Its own adventure.</h2><p>Keep classes, pets, points, teams, and records together in their school.</p></div></section><section class="panel"><h2>${PW.online?(PW.admin?'All schools':'My approved schools'):'Schools on this device'}</h2><p class="lead">${PW.online?'Only approved co-teachers can open their assigned schools. The global admin can open every school.':'Device workspaces keep your schools organized. Sign in for private school access and co-teacher sharing.'}</p><div class="school-grid">${list.map(s=>`<article class="school-card"><span class="role-pill">${PW.online?'Online school':'Device workspace'}</span><h3 style="margin-top:12px">${esc(s.name)}</h3><p>Classes · growing pets · learning skills</p><button class="btn go" data-party="${PW.online?'openonline':'openlocal'}" data-id="${esc(s.id)}">Open school →</button></article>`).join('')||'<p>No approved schools yet. Check My account for invitations.</p>'}</div></section>${PW.online?(PW.admin?`<section class="panel"><h2>Add a school</h2><div class="form"><input id="onlineSchoolName" maxlength="60" aria-label="New school name" placeholder="School name"><button class="btn go" data-party="createschool">Create school</button></div></section>`:''):`<section class="panel"><h2>Organize your schools</h2><label for="localSchoolName">School name</label><div class="form"><input id="localSchoolName" maxlength="60" placeholder="e.g. Riverside Elementary"><button class="btn go" data-party="newlocal">＋ Add school</button><button class="btn" data-party="renamelocal">Rename current school</button></div></section>`}`;
 if(PW.online&&PW.admin)view.innerHTML+=`<section class="panel"><h2>Restore schools saved on this device</h2><p class="lead">Bring your existing classes, students, points and lessons into your private online school. Your device copies remain saved.</p><div class="school-grid">${localSchoolIndex.schools.map(s=>`<article class="school-card"><h3>${esc(s.name)}</h3><button class="btn go" data-party="importdevice" data-id="${esc(s.id)}">Restore saved school</button></article>`).join('')}</div></section>`;
};
RENDER.account=()=>{
 const connected=PW.configured(),schoolName=id=>(PW.schools.find(s=>s.id===id)||{}).name||'School';
 const accountLabel=email=>String(email||'').endsWith('@teachers.point-party.invalid')?String(email).split('@')[0]:email;
 const login=`<div class="login-grid"><div><h2>Teacher sign in</h2><p class="lead">Use the secure email link to sign in. If your email includes a code, you can enter it here.</p><label for="loginEmail">School email</label><input id="loginEmail" type="email" required autocomplete="email" value="${esc(PW.email||'')}" placeholder="teacher@school.edu" ${!connected?'disabled':''}><button class="btn go" data-party="sendcode" ${!connected?'disabled':''}>Send sign-in email</button>${PW.email?'<label for="loginCode">Email code (if included)</label><input id="loginCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10"><button class="btn dark" data-party="verifycode">Verify & sign in</button>':''}</div><div><span class="role-pill">🔑 Admin space</span><h2 style="margin:12px 0">A whole-school view</h2><p>Admins use the same verified email sign-in. Your approved role opens school management and teacher approvals.</p><div class="journey"><span>1. Invitation</span><span>2. Email sign-in</span><span>3. Admin approval</span><span>4. School access</span></div><p class="note">Co-teachers see their approved schools. Only the global admin can access every school.</p></div></div>`;
 let online='';
 if(PW.online){
  online=`<h2>${PW.admin?'🛡️ Global admin space':'🍎 Co-teacher space'}</h2><p class="account-status">${esc(accountLabel(PW.user.email))} · <b>${PW.admin?'Global admin':'Co-teacher'}</b></p><div class="form"><button class="btn" data-party="refreshaccess">↻ Refresh approvals</button><button class="btn" data-act="nav" data-page="schools">🏫 My schools</button><button class="btn" data-party="signout">Sign out</button></div>${PW.dirty?`<p class="account-status">${esc(PW.status||'There are unsaved changes.')}</p><div class="form"><button class="btn" data-act="backup">Download unsaved backup</button>${PW.blocked?'<button class="btn" data-party="reloadschool">Reload saved school</button>':'<button class="btn go" data-party="retrysave">Retry save</button>'}</div>`:''}`;
  online+=`<h3 style="margin-top:24px">${PW.admin?'Teacher approvals':'My access requests'}</h3><div class="tablewrap"><table><thead><tr><th>Email</th><th>School</th><th>Status</th>${PW.admin?'<th>Action</th>':''}</tr></thead><tbody>${PW.members.map(m=>`<tr><td>${esc(accountLabel(m.email))}</td><td>${esc(schoolName(m.school_id))}</td><td>${esc(m.status)}</td>${PW.admin?`<td>${m.status==='pending'?`<button class="btn go" data-party="approve" data-id="${m.id}">Approve</button> <button class="btn" data-party="reject" data-id="${m.id}">Reject</button>`:m.status==='approved'?`<button class="btn" data-party="revoke" data-id="${m.id}">Revoke</button>`:''}</td>`:''}</tr>`).join('')||`<tr><td colspan="4">No access requests yet.</td></tr>`}</tbody></table></div>`;
  const inviteSchools=PW.schools.filter(s=>PW.can('invite',s.id));
  if(inviteSchools.length)online+=`<h3 style="margin-top:24px">Invite a co-teacher</h3><p class="note">Create an invitation for their email. They sign in, then wait for global admin approval.</p><div class="form"><select id="inviteSchool" aria-label="Invitation school">${inviteSchools.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><input id="inviteEmail" type="email" required placeholder="Co-teacher email" aria-label="Co-teacher email"><button class="btn go" data-party="invite">Create invitation</button></div><p class="note">Share: Open ClassGrove → Teacher & admin → sign in with your invited email → wait for admin approval. Invitations expire after 7 days. Creating an invitation does not send an email.</p><div class="tablewrap"><table><thead><tr><th>Invited email</th><th>School</th><th>Invitation</th></tr></thead><tbody>${PW.invites.map(i=>`<tr><td>${esc(i.email)}</td><td>${esc(schoolName(i.school_id))}</td><td>${i.redeemed_at?'Accepted · check approval':new Date(i.expires_at)<new Date()?'Expired':'Waiting for sign-in'}</td></tr>`).join('')}</tbody></table></div>`;
  if(PW.admin)online+=`<section aria-label="Teacher permissions"><h3 style="margin-top:24px">Teacher permission panel</h3><p>Set permissions separately for each teacher and school. Approval opens school access; these settings control their tools. Materials permission also allows reading and downloading shared resources. New teachers can award points. Enable additional tools here.</p>${!PW.permissionsReady?'<p class="account-status">Permission controls need the permissions.sql database migration. Apply it, then refresh approvals.</p>':`<div class="tablewrap"><table><thead><tr><th>Teacher / school</th><th>Points</th><th>Activities & grades</th><th>Materials access &amp; editing</th><th>Roster & attendance</th><th>Invitations</th><th>Save</th></tr></thead><tbody>${PW.members.map(m=>`<tr data-permission-member="${esc(m.id)}"><td>${esc(accountLabel(m.email))}<br>${esc(schoolName(m.school_id))}<br><small>${esc(m.status)}</small></td>${['points','activities','materials','roster','invite'].map(key=>`<td><input type="checkbox" name="${key}" aria-label="Allow ${key} for ${esc(accountLabel(m.email))} at ${esc(schoolName(m.school_id))}" ${m.permissions?.[key]===true?'checked':''}></td>`).join('')}<td><button class="btn go" data-party="savepermissions" data-id="${esc(m.id)}">Save permissions</button></td></tr>`).join('')||'<tr><td colspan="7">Invite a teacher to begin.</td></tr>'}</tbody></table></div>`}</section>`;
  if(!PW.admin&&PW.school)online+=`<h3>My permissions in ${esc(schoolName(PW.school))}</h3><p>${['points','activities','materials','roster','invite'].map(key=>`${esc(key)}: ${PW.can(key)?'allowed':'ask your administrator'}`).join(' · ')}</p>`;
 }
 view.innerHTML=`<section class="party-banner"><span class="party-mascot" aria-hidden="true">🦉</span><div><small>Teachers make the magic</small><h2>Your school team, together.</h2><p>Invite your teaching partner. Celebrate the little wins together.</p></div></section><section class="panel">${!connected?'<p class="account-status"><b>Online accounts are awaiting setup.</b> School sharing, email sign-in, and admin approvals will become available when the online service is connected. Your device classes and points remain available.</p>':''}${PW.status&&!PW.dirty?`<p class="account-status" role="status">${esc(PW.status)}</p>`:''}${PW.online&&PW.accessNotice?`<p class="account-status" role="status">${esc(PW.accessNotice)}</p>`:''}${PW.online?online:login}</section>`;
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-party]');if(b){PW.action(b).catch(()=>toast('Could not complete that action.'));}
},true);
document.addEventListener('click',e=>{
 if(!PW.online)return;
 const b=e.target.closest('[data-act]');if(!b)return;
 const safe=['nav','sound','present','backup','closeov','noop','confirmyes'];
 if((!PW.school||PW.busy||PW.blocked)&&!safe.includes(b.dataset.act)){e.stopImmediatePropagation();toast('Open an approved school, or resolve unsaved changes in My account.');}
},true);
document.addEventListener('change',e=>{
 if(e.target.id==='schoolSelect'){(PW.online?PW.switchOnline(e.target.value):Promise.resolve(PW.switchLocal(e.target.value))).catch(()=>toast('School could not be opened.'));}
 if(PW.online&&(!PW.school||PW.busy||PW.blocked)&&e.target.id==='bfile'){e.stopImmediatePropagation();toast('Open an approved school before loading a backup.');}
},true);
window.addEventListener('beforeunload',e=>{if(PW.online&&PW.dirty){e.preventDefault();e.returnValue='';}});
