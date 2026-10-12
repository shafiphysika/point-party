const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Account=require('../account-core.js');
const {PGlite}=require('@electric-sql/pglite');
test('username login preserves owner email and rejects invalid identifiers',()=>{
 assert.equal(Account.loginEmail(' Teacher405 '),'teacher405@teachers.point-party.invalid');
 assert.equal(Account.loginEmail('Admin@Example.org'),'admin@example.org');
 assert.equal(Account.loginEmail('x'),null);assert.equal(Account.loginEmail('foo bar'),null);
});
test('missing-class recovery preserves existing online classes and all learning data',()=>{
 const cloud={roster:{401:{names:['Existing']}},classes:{401:{pts:{1:9}}},portal:{lessons:['keep']},materials:{resources:['keep']}};
 const device={roster:{401:{names:['Different']},404:{names:['New']}},classes:{401:{pts:{}},404:{pts:{1:2}}}};
 const result=Account.mergeMissing(cloud,device);
 assert.deepEqual(result.added,['404']);assert.equal(result.data.roster[401].names[0],'Existing');
 assert.equal(result.data.classes[401].pts[1],9);assert.equal(result.data.classes[404].pts[1],2);
 assert.deepEqual(result.data.portal,cloud.portal);assert.deepEqual(result.data.materials,cloud.materials);
 assert.equal(cloud.roster[404],undefined);assert.deepEqual(Account.mergeMissing(result.data,device).added,[]);
});
test('temporary passwords block school reads and writes until Auth changes the password',async()=>{
 const db=new PGlite(),admin='00000000-0000-0000-0000-000000000001',teacher='00000000-0000-0000-0000-000000000002';
 try{
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth,storage to authenticated;grant execute on function auth.uid() to authenticated;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
   alter table storage.objects enable row level security;grant select,insert on storage.objects to authenticated;`);
  for(const name of ['schema','platform','materials','permissions','password-accounts'])await db.exec(fs.readFileSync('supabase/'+name+'.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/password-accounts.sql','utf8'));
  await db.query('insert into auth.users values($1,$2,now(),$3),($4,$5,now(),$6)',[admin,'shafiphysika@gmail.com','hashA',teacher,'teacher405@teachers.point-party.invalid','hashB']);
  const as=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
  await as(admin);await db.query('select pp_claim_owner()');const school=(await db.query("select pp_create_school('School') id")).rows[0].id;
  await db.query('select pp_provision_teacher($1,$2,$3)',[teacher,'teacher405',school]);
  await db.query('select pp_save_school($1,0,$2)',[school,{roster:{405:{names:['Private']}}}]);
  await as(teacher);
  assert.equal((await db.query('select pp_account_status() state')).rows[0].state.must_change_password,true);
  assert.equal((await db.query('select * from pp_school_state')).rows.length,0);
  await assert.rejects(db.query('select pp_save_school($1,1,$2)',[school,{}]),/SCHOOL_ACCESS_REQUIRED/);
  await assert.rejects(db.query('update pp_teacher_accounts set must_change_password=false'),/permission denied/);
  await assert.rejects(db.query('select pp_provision_teacher($1,$2,$3)',[teacher,'another',school]),/ADMIN_REQUIRED/);
  await db.exec('reset role');await db.query('update auth.users set encrypted_password=$1 where id=$2',['newAuthHash',teacher]);
  await as(teacher);
  assert.equal((await db.query('select pp_account_status() state')).rows[0].state.must_change_password,false);
  assert.equal((await db.query('select * from pp_school_state')).rows.length,1);
  assert.equal((await db.query("select pp_can_school($1,'points') allowed",[school])).rows[0].allowed,true);
  assert.equal((await db.query("select pp_can_school($1,'roster') allowed",[school])).rows[0].allowed,false);
  await as(admin);
  const member=(await db.query('select id from pp_memberships')).rows[0].id;
  await db.query("select pp_review_member($1,'revoked')",[member]);await as(teacher);
  assert.equal((await db.query('select * from pp_school_state')).rows.length,0);
 }finally{await db.close();}
});
