/* Class scope complements school/tool permissions; the server projects and checks data. */
(()=>{
 const W=PartyWorkspace;
 const schoolName=id=>W.schools.find(s=>s.id===id)?.name||'School';
 const accountLabel=email=>String(email||'').replace('@teachers.point-party.invalid','');
 W.classAccessReady=false;W.classChoices={};
 const load=W.loadAccess;
 W.loadAccess=async function(){
  await load.call(this);this.classAccessReady=false;this.classChoices={};
  try{this.classAccessReady=await this.rpc('pp_class_access_version')===1;}catch(error){if(!this.missingSetup(error))throw error;}
  if(!this.classAccessReady)return;
  const {data,error}=await this.client.from('pp_memberships').select('id,class_ids');if(error)throw error;
  const scopes=new Map(data.map(m=>[m.id,m.class_ids]));this.members.forEach(m=>{m.class_ids=scopes.get(m.id);});
  if(this.admin)this.classChoices=await this.rpc('pp_school_classes');
 };
 W.canClass=function(id=ui.cur,school=this.school){
  if(!this.online||this.admin)return true;
  const member=this.members.find(m=>m.school_id===school&&m.user_id===this.user?.id&&m.status==='approved');
  return !!member&&(member.class_ids===null||(!this.classAccessReady&&member.class_ids===undefined)||Array.isArray(member.class_ids)&&member.class_ids.includes(id));
 };
 const can=W.can;W.can=function(key,school=this.school){return can.call(this,key,school)&&(!ui.cur||school!==this.school||this.canClass(ui.cur,school));};
 const account=RENDER.account;
 RENDER.account=function(){
  account();if(!W.online)return;
  const panel=document.createElement('section');panel.className='panel class-access-panel';panel.setAttribute('aria-label','Class permissions');
  if(W.admin){
   panel.innerHTML=`<h2>Classes each teacher can open</h2><p class="lead">Choose all classes or just the class numbers you allow. School approval and tool permissions still apply. No classes selected means no student records.</p>${!W.classAccessReady?'<p>Class permissions are awaiting the database update. Existing school access remains unchanged.</p>':W.members.map(m=>{
    const ids=W.classChoices[m.school_id]||[],all=m.class_ids===null;
    return `<fieldset class="class-access-card" data-class-member="${esc(m.id)}"><legend>${esc(accountLabel(m.email))} · ${esc(schoolName(m.school_id))}</legend><label><input type="checkbox" name="allClasses" ${all?'checked':''}> All classes, including future classes</label><div class="class-choice-grid">${ids.map(id=>`<label><input type="checkbox" name="allowedClass" value="${esc(id)}" ${all||m.class_ids?.includes(id)?'checked':''} ${all?'disabled':''}> ${esc(id)}</label>`).join('')||'<p>Add classes to this school first.</p>'}</div><p class="class-scope-summary">${all?'All classes':`${m.class_ids?.length||0} selected: ${(m.class_ids||[]).map(esc).join(', ')||'none'}`}</p><button class="btn go" type="button" data-class-access="save" data-id="${esc(m.id)}">Save class access</button><span role="status"></span></fieldset>`;
   }).join('')||'<p>Create or invite a teacher to choose their classes.</p>'}`;
  }else{
   panel.innerHTML='<h2>My allowed classes</h2>'+W.members.filter(m=>m.user_id===W.user?.id&&m.status==='approved').map(m=>`<p><b>${esc(schoolName(m.school_id))}</b>: ${m.class_ids===null?'All classes':esc((m.class_ids||[]).join(', ')||'No classes assigned')}</p>`).join('');
  }
  view.insertBefore(panel,view.querySelector('.panel'));
 };
 document.addEventListener('change',e=>{
  const card=e.target.closest('[data-class-member]');if(!card)return;
  const all=card.querySelector('[name=allClasses]').checked,boxes=card.querySelectorAll('[name=allowedClass]');boxes.forEach(b=>{b.disabled=all;if(e.target.name==='allClasses')b.checked=all;});
  card.querySelector('.class-scope-summary').textContent=all?'All classes':`${Array.from(boxes).filter(b=>b.checked).length} selected: ${Array.from(boxes).filter(b=>b.checked).map(b=>b.value).join(', ')||'none'}`;
 });
 document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-class-access=save]');if(!b)return;
  const card=b.closest('[data-class-member]'),status=card.querySelector('[role=status]');
  if(!W.online||!W.admin||!W.classAccessReady)return;
  if(W.dirty||W.saving){status.textContent='Save classroom changes first.';return;}
  const ids=card.querySelector('[name=allClasses]').checked?null:Array.from(card.querySelectorAll('[name=allowedClass]:checked')).map(x=>x.value);
  b.disabled=true;
  try{await W.rpc('pp_set_member_classes',{p_member:b.dataset.id,p_classes:ids});await W.loadAccess();if(W.school){const id=W.school;await W.switchOnline(id);}ui.mode='account';render();toast('Class access saved. The teacher should reload their school.');}
  catch(error){status.textContent=PortalCore.authError(error);}finally{b.disabled=false;}
 });
})();
