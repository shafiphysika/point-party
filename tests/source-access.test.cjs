const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite'),Party=require('../party-core.js'),Portal=require('../portal-core.js'),Materials=require('../materials-core.js');
test('denied materials are hidden by server projection and file policies while point saves preserve them',async()=>{
 const db=new PGlite(),admin='00000000-0000-0000-0000-000000000001',teacher='00000000-0000-0000-0000-000000000002';
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth,storage to authenticated;grant execute on function auth.uid() to authenticated;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
   alter table storage.objects enable row level security;grant select,insert on storage.objects to authenticated;`);
  for(const name of ['schema','platform','materials','permissions','password-accounts','source-access'])await db.exec(fs.readFileSync('supabase/'+name+'.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/source-access.sql','utf8'));
  await db.query('insert into auth.users values($1,$2,now(),$3),($4,$5,now(),$6)',[admin,'shafiphysika@gmail.com','hashA',teacher,'teacher@example.org','hashB']);
  const as=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
  await as(admin);await db.query('select pp_claim_owner()');const school=(await db.query("select pp_create_school('School') id")).rows[0].id;
  const data={roster:{405:{names:['Learner']}},classes:{405:Party.sanitizeClass({})},portal:Portal.clean({}),materials:Materials.clean({resources:[{id:'private',title:'Restricted worksheet',url:'https://example.org/private',classId:'405'}]}),links:[]};
  await db.query('select pp_save_school($1,0,$2)',[school,data]);
  await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['pp-materials',school+'/00000000-0000-0000-0000-000000000003/work.pdf']);
  await db.query('select pp_invite($1,$2)',[school,'teacher@example.org']);await as(teacher);await db.query('select pp_accept_invitations()');const member=(await db.query('select id from pp_memberships')).rows[0].id;
  await as(admin);await db.query("select pp_review_member($1,'approved')",[member]);await as(teacher);
  assert.equal((await db.query('select * from pp_school_state')).rows.length,0);
  assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  const projected=(await db.query('select pp_open_school($1) school',[school])).rows[0].school;
  assert.equal(projected.data.materials.resources,undefined);assert.doesNotMatch(JSON.stringify(projected),/Restricted worksheet|example.org\/private/);
  projected.data.materials=Materials.clean(projected.data.materials);projected.data.classes[405].pts[1]=2;
  await db.query('select pp_save_school($1,$2,$3)',[school,projected.revision,projected.data]);
  const bad=JSON.parse(JSON.stringify(projected.data));bad.materials.resources=data.materials.resources.map(r=>({...r,title:'Tampered'}));
  await assert.rejects(db.query('select pp_save_school($1,2,$2)',[school,bad]),/PERMISSION_MATERIALS_REQUIRED/);
  await as(admin);const saved=(await db.query('select data from pp_school_state')).rows[0].data;
  assert.equal(saved.classes[405].pts[1],2);assert.equal(saved.materials.resources[0].title,'Restricted worksheet');
  await db.query('select pp_set_member_permissions($1,$2)',[member,{points:true,materials:true}]);await as(teacher);
  assert.equal((await db.query('select pp_open_school($1) school',[school])).rows[0].school.data.materials.resources[0].title,'Restricted worksheet');
  assert.equal((await db.query('select * from storage.objects')).rows.length,1);
  await as(admin);await db.query("select pp_review_member($1,'revoked')",[member]);await as(teacher);
  await assert.rejects(db.query('select pp_open_school($1)',[school]),/SCHOOL_ACCESS_REQUIRED/);
 }finally{await db.close();}
});
