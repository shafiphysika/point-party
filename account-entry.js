/* Account-first entry. Device copies are retained for admin recovery, never shown to guests. */
(()=>{
 const W=PartyWorkspace;
 const normalRender=render,normalAccount=RENDER.account,normalInit=W.init;
 const entry=document.createElement('main');entry.id='accountEntry';entry.hidden=true;document.body.append(entry);
 W.accountReady=false;W.passwordRequired=false;W.accountSetupReady=false;W.accountMessage='';
 function unlocked(){return W.online&&W.accountReady&&!W.passwordRequired;}
 function showEntry(){
  document.body.classList.add('account-locked');entry.hidden=false;
  document.querySelector('#view').replaceChildren();document.querySelector('#classList').replaceChildren();
  const change=W.passwordRequired;
  entry.innerHTML=`<section class="entry-art" aria-label="A happy learning garden"><a class="entry-brand" href="./">☆ Point Party</a><div class="entry-garden" aria-hidden="true"><span class="entry-sun">☀</span><span class="entry-book">📖</span><span class="entry-sprout">🌱</span><span class="entry-star">✦</span></div><h1>A little learning.<br>A lot of wonder.</h1><p>Your classes, growing pets and bright ideas—all in one school space.</p></section><section class="entry-panel"><div class="entry-form"><p class="entry-eyebrow">YOUR SCHOOL WORKSPACE</p><h2>${change?'Make this account yours':'Welcome, teacher'}</h2><p>${change?'Choose your own password before opening your school.':'Sign in with the account provided by your school administrator.'}</p><form id="schoolLoginForm">${change?`<label for="entryPassword">New password</label><input id="entryPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"><label for="entryConfirm">Confirm new password</label><input id="entryConfirm" type="password" required minlength="12" maxlength="128" autocomplete="new-password"><p class="entry-help">Use at least 12 characters, including a letter and a number.</p>`:`<label for="entryUsername">Username or admin email</label><input id="entryUsername" required autocomplete="username" maxlength="254" value="${esc(W.loginIdentity||'')}"><label for="entryPassword">Password</label><input id="entryPassword" type="password" required autocomplete="current-password" maxlength="128">`}<button class="btn go" type="submit" ${!W.client?'disabled':''}>${change?'Save my password & continue':W.client?'Sign in':'Connecting to school…'}</button></form><p id="entryMessage" role="status">${esc(W.accountMessage||W.status||'')}</p>${change?'<button class="btn" data-entry="signout">Sign out</button>':'<p class="entry-help">Need an account or password reset? Contact your administrator.</p><details><summary>Admin email recovery</summary><p>Use your verified owner email. Email delivery must be configured by the school.</p><form id="ownerRecoveryForm"><label for="ownerEmail">Owner email</label><input id="ownerEmail" type="email" required autocomplete="email"><button class="btn" type="submit">Send sign-in email</button></form></details>'}<button class="entry-retry" data-entry="retry">Retry connection</button></div></section>`;
 }
 render=function(){if(!unlocked()){showEntry();return;}entry.hidden=true;document.body.classList.remove('account-locked');normalRender();if(W.sourceAccessReady&&!W.can('materials')){document.querySelectorAll('[data-page="materials"]').forEach(b=>{b.disabled=true;b.title='Ask your administrator for shared materials access.';});if(ui.mode==='materials')view.innerHTML='<section class="panel"><h2>Shared materials access</h2><p>Your administrator has not enabled access to shared materials for this school.</p></section>';}};
 W.init=async function(){if(this.initializing)return;this.initializing=true;this.authSubscription?.unsubscribe();try{await normalInit.call(this);}finally{this.initializing=false;render();}};
 const originalAccess=W.loadAccess;
 W.loadAccess=async function(){await originalAccess.call(this);this.sourceAccessReady=false;try{this.sourceAccessReady=await this.rpc('pp_source_access_version')===1;}catch(error){if(!this.missingSetup(error))throw error;}};
 const originalOpen=W.openVerifiedSession;
 W.openVerifiedSession=async function(epoch){
  const {data,error}=await this.client.auth.getUser();if(error)throw error;
  if(!data.user)throw new Error('SIGN_IN_REQUIRED');
  if(epoch!==this.authEpoch)return;
  this.accountSetupReady=false;this.passwordRequired=false;this.accountReady=false;
  try{
   const account=await this.rpc('pp_account_status');
   if(epoch!==this.authEpoch)return;
   this.accountSetupReady=true;this.passwordRequired=account?.must_change_password===true;
   if(this.passwordRequired){this.user=data.user;this.online=true;this.accountMessage='';render();return;}
  }catch(error){if(!this.missingSetup(error))throw error;}
  await originalOpen.call(this,epoch);
  if(epoch!==this.authEpoch)return;
  this.accountReady=true;render();
 };
 const originalLeave=W.leaveOnline;
 W.leaveOnline=function(){this.accountReady=false;this.passwordRequired=false;this.accountMessage='';return originalLeave.call(this);};
 // Opening a school from the account page goes straight to its students.
 const originalSwitch=W.switchOnline;
 W.switchOnline=async function(id){await originalSwitch.call(this,id);if(this.school===id&&this.accountReady){ui.mode=Object.keys(CLASSES).length?'students':'setup';render();}};
 RENDER.account=function(){
  normalAccount();
  if(!unlocked())return;
  const section=document.createElement('section');section.className='panel';
  section.innerHTML=`<h2>Your password</h2><p>Choose a password you do not use elsewhere.</p><form id="changePasswordForm"><label for="accountPassword">New password</label><input id="accountPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="128"><label for="accountConfirm">Confirm password</label><input id="accountConfirm" type="password" autocomplete="new-password" required minlength="12" maxlength="128"><button class="btn" type="submit">Change password</button></form><p role="status" id="passwordMessage"></p>`;
  view.append(section);
  if(!W.admin)return;
  const admin=document.createElement('section');admin.className='panel';
  admin.innerHTML=`<h2>Create a co-teacher account</h2><p>Give the teacher their username and temporary password privately. They must change it at first sign-in. New teachers can award points; use the permission panel above to allow additional tools.</p>${W.accountSetupReady?`<form id="createTeacherForm"><label for="teacherUsername">Username</label><input id="teacherUsername" autocomplete="off" required pattern="[a-z][a-z0-9._-]{2,31}" maxlength="32" placeholder="e.g. teacher405"><label for="teacherTemporaryPassword">Temporary password</label><input id="teacherTemporaryPassword" type="password" autocomplete="new-password" required minlength="12" maxlength="128"><label for="teacherSchool">School</label><select id="teacherSchool" required>${W.schools.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select><button class="btn go" type="submit">Create teacher account</button></form>`:'<p>Account provisioning is awaiting the password-accounts migration and teacher-accounts server function.</p>'}<p id="teacherAccountMessage" role="status"></p>`;
  view.append(admin);
  const recovery=document.createElement('section');recovery.className='panel';
  recovery.innerHTML=`<h2>Recover classes saved in this browser</h2><p>Add missing classes to an existing online school. Existing online classes, points and learning records are kept.</p><label for="recoverDeviceSchool">Saved school</label><select id="recoverDeviceSchool">${localSchoolIndex.schools.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select><label for="recoverOnlineSchool">Online destination</label><select id="recoverOnlineSchool">${W.schools.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select><button class="btn" data-entry="recover">Review missing classes</button>`;
  view.append(recovery);
 };
 function passwordValue(first,second){const p=first.value;if(p!==second.value)throw new Error('Passwords do not match.');if(p.length<12||!/[A-Za-z]/.test(p)||!/[0-9]/.test(p))throw new Error('Use at least 12 characters with a letter and a number.');return p;}
 function message(error){if(/USERNAME_UNAVAILABLE/.test(error?.message||''))return 'That username is unavailable. Choose another username.';if(/ACCOUNT_SETUP_FAILED|ACCOUNT_SERVICE_UNAVAILABLE|Teacher account service/.test(error?.message||''))return 'Teacher account setup could not complete. Check the account service deployment and try again.';if(/Invalid login credentials/i.test(error?.message||''))return 'Username or password is incorrect. Check with your administrator.';return /Passwords|Use at least/.test(error?.message||'')?error.message:PortalCore.authError(error);}
 document.addEventListener('submit',async e=>{
  const form=e.target;if(!['schoolLoginForm','ownerRecoveryForm','changePasswordForm','createTeacherForm'].includes(form.id))return;
  e.preventDefault();const submit=form.querySelector('button[type="submit"]');submit.disabled=true;
  try{
   if(form.id==='schoolLoginForm'){
    if(W.passwordRequired){
     const p=passwordValue($('#entryPassword'),$('#entryConfirm'));
     const {error}=await W.client.auth.updateUser({password:p});if(error)throw error;
     $('#entryPassword').value='';$('#entryConfirm').value='';
     W.online=false;W.passwordRequired=false;await W.enterOnline();
    }else{
     W.loginIdentity=$('#entryUsername').value.trim();const email=AccountCore.loginEmail(W.loginIdentity);
     if(!email)throw new Error('Invalid login credentials');
     const {error}=await W.client.auth.signInWithPassword({email,password:$('#entryPassword').value});if(error)throw error;
     $('#entryPassword').value='';W.accountMessage='';await W.enterOnline();
    }
   }else if(form.id==='ownerRecoveryForm'){
    const {error}=await W.client.auth.signInWithOtp({email:$('#ownerEmail').value.trim(),options:{shouldCreateUser:false,emailRedirectTo:location.origin+location.pathname}});if(error)throw error;
    W.accountMessage='Check your email for the sign-in link.';render();
   }else if(form.id==='changePasswordForm'){
    const p=passwordValue($('#accountPassword'),$('#accountConfirm'));
    const {error}=await W.client.auth.updateUser({password:p});if(error)throw error;
    form.reset();$('#passwordMessage').textContent='Password changed.';
   }else{
    if(!W.admin||!W.accountSetupReady)throw new Error('ADMIN_REQUIRED');
    const p=$('#teacherTemporaryPassword').value;
    if(p.length<12||!/[A-Za-z]/.test(p)||!/[0-9]/.test(p))throw new Error('Use at least 12 characters with a letter and a number.');
    const {data,error}=await W.client.functions.invoke('teacher-accounts',{body:{username:$('#teacherUsername').value,password:p,school:$('#teacherSchool').value}});
    if(error||data?.error)throw new Error(data?.error||'Teacher account service unavailable. Ask the platform administrator to check deployment.');
    form.reset();await W.loadAccess();RENDER.account();$('#teacherAccountMessage').textContent='Account created for '+data.username+'. Share the temporary password privately.';
   }
  }catch(error){if(form.id==='schoolLoginForm'||form.id==='ownerRecoveryForm'){W.accountMessage=message(error);render();}else{const target=form.id==='changePasswordForm'?'#passwordMessage':'#teacherAccountMessage';$(target).textContent=message(error);}}
  finally{submit.disabled=false;}
 });
 document.addEventListener('click',async e=>{
  const action=e.target.closest('[data-entry]')?.dataset.entry;if(!action)return;
  if(action==='retry'){W.accountMessage='';await W.init();}
  if(action==='signout'){const {error}=await W.client.auth.signOut();if(error){W.accountMessage=message(error);render();}else W.leaveOnline();}
  if(action==='recover'){
   if(!W.online||!W.admin)return;
   if(W.busy||W.dirty||W.saving){toast('Save current changes first.');return;}
   try{
    const deviceId=$('#recoverDeviceSchool').value,school=$('#recoverOnlineSchool').value;
    const device=JSON.parse(localStorage.getItem(deviceId==='default'?'pointparty-v1':'pointparty-school-'+deviceId)||'{}');
    device.roster=cleanRoster(device.roster)||{};
    const {data,error}=await W.client.from('pp_school_state').select('data,revision').eq('school_id',school).single();if(error)throw error;
    const merged=AccountCore.mergeMissing(data.data,device);
    if(!merged.added.length){toast('No missing classes to add.');return;}
    askConfirm('Add classes '+merged.added.join(', ')+' to '+W.schools.find(s=>s.id===school).name+'? Existing online classes and records are kept.',async()=>{
     try{await W.rpc('pp_save_school',{p_school:school,p_revision:data.revision,p_data:merged.data});await W.switchOnline(school);toast('Missing classes saved online.');}catch(error){toast(message(error));}
    },'Add missing classes');
   }catch(error){toast(message(error));}
  }
 });
 // Guest clicks cannot reach legacy device mutations, imports or navigation.
 for(const type of ['click','change'])window.addEventListener(type,e=>{
  if(unlocked()){if(W.sourceAccessReady&&!W.can('materials')&&e.target.closest('[data-page="materials"]')){e.preventDefault();e.stopImmediatePropagation();toast('Ask your administrator for shared materials access.');}return;}if(entry.contains(e.target))return;
  e.preventDefault();e.stopImmediatePropagation();
 },true);
})();
