const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function handler({isAdmin=true,verified=true,attachError=false,createError=false}={}){
 let serve;const calls=[];
 const caller={auth:{getUser:async()=>({data:{user:verified?{id:'admin'}:null}})},rpc:async(name,args)=>{
  calls.push(name);return name==='pp_is_admin'?{data:isAdmin}:{error:attachError?new Error('failed'):null};
 },from:()=>({select:()=>({eq:()=>({single:async()=>({data:{id:'school'}})})})})};
 const service={auth:{admin:{createUser:async args=>{calls.push({create:args});return createError?{error:new Error('duplicate')}:{data:{user:{id:'teacher'}}};},deleteUser:async id=>calls.push({rollback:id})}}};
 const context=vm.createContext({Request,Response,JSON,Number,String,Deno:{env:{get:k=>k},serve:fn=>serve=fn},createClient:(url,key)=>key==='SUPABASE_SERVICE_ROLE_KEY'?service:caller});
 vm.runInContext(fs.readFileSync('supabase/teacher-accounts.ts','utf8').replace(/^import .*;\r?\n/m,''),context);
 const request=(body={},token=true)=>new Request('https://test.invalid',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer verified-session'}:{})},body:JSON.stringify(body)});
 return {serve,calls,request};
}
test('account service rejects missing authentication and non-admin users before account creation',async()=>{
 for(const options of [{verified:false},{isAdmin:false}]){const h=handler(options);assert.ok((await h.serve(h.request())).status>=401);assert.equal(h.calls.some(c=>c.create),false);}
 const h=handler();assert.equal((await h.serve(h.request({},false))).status,401);
});
test('account service validates passwords and usernames before using its privileged client',async()=>{
 const h=handler();for(const body of [{username:'bad username',password:'LongPassword123',school:'00000000-0000-0000-0000-000000000001'},{username:'teacher405',password:'short',school:'00000000-0000-0000-0000-000000000001'}])assert.equal((await h.serve(h.request(body))).status,400);
 assert.equal(h.calls.some(c=>c.create),false);
});
test('account creation attaches an approved minimal teacher account and never returns its password',async()=>{
 const h=handler(),body={username:'teacher405',password:'TemporaryTest123',school:'00000000-0000-0000-0000-000000000001'};
 const result=await h.serve(h.request(body));assert.equal(result.status,201);
 assert.deepEqual(await result.json(),{username:'teacher405'});
 assert.equal(h.calls.find(c=>c.create).create.email,'teacher405@teachers.point-party.invalid');
 assert.ok(h.calls.includes('pp_provision_teacher'));
});
test('failed membership setup rolls back only the newly-created account',async()=>{
 const h=handler({attachError:true});const result=await h.serve(h.request({username:'teacher405',password:'TemporaryTest123',school:'00000000-0000-0000-0000-000000000001'}));
 assert.equal(result.status,409);assert.equal(h.calls.find(c=>c.rollback).rollback,'teacher');
 const duplicate=handler({createError:true});assert.equal((await duplicate.serve(duplicate.request({username:'teacher405',password:'TemporaryTest123',school:'00000000-0000-0000-0000-000000000001'}))).status,409);assert.equal(duplicate.calls.some(c=>c.rollback),false);
});

test('family account service validates child and role, then uses the private family provisioner',async()=>{
 const h=handler(),base={username:'parent405',password:'TemporaryTest123',school:'00000000-0000-0000-0000-000000000001'};
 for(const fields of [{kind:'admin'},{kind:'parent',classId:'405',seat:0},{kind:'student',classId:'405',seat:1.5}])assert.equal((await h.serve(h.request({...base,...fields}))).status,400);
 assert.equal(h.calls.some(c=>c.create),false);
 const result=await h.serve(h.request({...base,kind:'parent',classId:'405',seat:1}));assert.equal(result.status,201);assert.ok(h.calls.includes('pp_provision_family'));assert.ok(!h.calls.includes('pp_provision_teacher'));
});
