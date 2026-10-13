// Use custom Auth verification (legacy gateway JWT toggle OFF for ECC tokens).
// getUser and the database admin check below are mandatory. Service keys stay in secrets.
import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
const origin='https://shafiphyskia.github.io';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'METHOD_NOT_ALLOWED'});
 const authorization=req.headers.get('Authorization');
 if(!authorization?.startsWith('Bearer '))return reply(401,{error:'SIGN_IN_REQUIRED'});
 try{
  const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_ANON_KEY')||'';
  const caller=createClient(url,key,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});
  const {data:verified,error:verifyError}=await caller.auth.getUser();
  if(verifyError||!verified.user)return reply(401,{error:'SIGN_IN_REQUIRED'});
  const {data:admin,error:roleError}=await caller.rpc('pp_is_admin');
  if(roleError||admin!==true)return reply(403,{error:'ADMIN_REQUIRED'});
  if(Number(req.headers.get('content-length')||0)>4096)return reply(413,{error:'REQUEST_TOO_LARGE'});
  const raw=await req.text();if(raw.length>4096)return reply(413,{error:'REQUEST_TOO_LARGE'});
  const body=JSON.parse(raw),username=String(body.username||'').trim().toLowerCase(),password=body.password,school=body.school;
  if(!/^[a-z][a-z0-9._-]{2,31}$/.test(username)||typeof password!=='string'||password.length<12||password.length>128||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)||!/^[-a-f0-9]{36}$/i.test(school||''))return reply(400,{error:'INVALID_ACCOUNT_DETAILS'});
  const {data:schools,error:schoolError}=await caller.from('pp_schools').select('id').eq('id',school).single();
  if(schoolError||!schools)return reply(400,{error:'SCHOOL_NOT_FOUND'});
  const service=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',{auth:{persistSession:false}});
  const {data,error}=await service.auth.admin.createUser({email:username+'@teachers.point-party.invalid',password,email_confirm:true});
  if(error||!data.user)return reply(409,{error:'USERNAME_UNAVAILABLE_OR_ACCOUNT_REJECTED'});
  const {error:attachError}=await caller.rpc('pp_provision_teacher',{p_user:data.user.id,p_username:username,p_school:school});
  if(attachError){await service.auth.admin.deleteUser(data.user.id);return reply(409,{error:'ACCOUNT_SETUP_FAILED'});}
  return reply(201,{username});
 }catch{return reply(500,{error:'ACCOUNT_SERVICE_UNAVAILABLE'});}
});
