const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
function site(reduced=true,accountEntry=false){
 const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'http://localhost/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,ctx=dom.getInternalVMContext();
 w.matchMedia=()=>({matches:reduced,addEventListener(){}});w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 for(const script of w.document.querySelectorAll('script')){
  if(script.src){const file=script.getAttribute('src').split('?')[0];if(/^https?:/.test(file)||(!accountEntry&&file==='account-entry.js'))continue;vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});}
  else if(script.textContent.includes('PartyWorkspace.init()'))vm.runInContext('render();',ctx);
  else vm.runInContext(script.textContent,ctx,{filename:'index-inline.js'});
 }
 return {dom,w,ctx,run:s=>vm.runInContext(s,ctx)};
}
test('full site opens the learning hub before any class has been added',()=>{
 const h=site();try{
  h.w.document.querySelector('[data-act="nav"][data-page="learning"]').click();
  assert.equal(h.w.document.querySelector('#pageTitle').textContent,'Learning adventures');
  assert.ok(h.w.document.querySelector('[data-learning="tab"][data-tab="numbers"]'));
 }finally{h.w.close();}
});
test('full site keeps the Original dice visible and consolidates legacy show choices',()=>{
 const h=site();try{
  h.run(`CLASSES={'101':{names:['Test learner']}};store.roster=CLASSES;store.classes={};ui.cur='101';ui.mode='picker';LuckyDice.setPreference('original');render();`);
  assert.equal(h.w.document.querySelectorAll('.dice-effects button').length,4);
  assert.ok(h.w.document.querySelector('.effect-original .dice-face.face-6'));
  h.w.document.querySelector('[data-act="diceeffect"][data-v="machine"]').click();
  assert.ok(h.w.document.querySelector('.machine-chamber'));
  assert.equal(h.run(`LuckyDice.resolveEffect('surprise')`),'show');
 }finally{h.w.close();}
});
test('a restricted co-teacher cannot start an activity or mutate student points without permission',()=>{
 const h=site();try{
  h.run(`CLASSES={'101':{names:['Test learner']}};store.roster=CLASSES;store.classes={};ui.cur='101';ui.mode='students';PW.online=true;PW.school='school';PW.user={id:'teacher'};PW.admin=false;PW.permissionsReady=true;PW.members=[{school_id:'school',user_id:'teacher',status:'approved',permissions:{points:false,activities:false}}];render();`);
  h.w.document.querySelector('[data-act="nav"][data-page="picker"]').click();assert.equal(h.run('ui.mode'),'students');
  h.w.document.querySelector('[data-act="stu"]').click();assert.equal(h.run('C().pts[1]||0'),0);
  assert.match(h.w.document.querySelector('#toast').textContent,/points permission/);
 }finally{h.w.close();}
});
test('every page gets one unique adventure ribbon and re-rendering never changes classroom data',()=>{
 const h=site();try{
  h.run(`CLASSES={'101':{names:['Test learner']}};store.roster=CLASSES;store.classes={};ui.cur='101';C();`);
  const titles=new Set(),worlds=new Set();
  for(const page of h.run('Object.keys(RENDER)')){
   h.run(`ui.mode=${JSON.stringify(page)};render();`);
   assert.equal(h.w.document.querySelectorAll('.world-trail').length,1,page);
   assert.equal(h.w.document.querySelector('.world-trail').dataset.page,page);
   titles.add(h.w.document.querySelector('.world-copy h2').textContent);worlds.add(h.w.document.body.dataset.world);
   const before=h.run('JSON.stringify(store)');
   h.run('render();');assert.equal(h.w.document.querySelectorAll('.world-trail').length,1);
   h.w.document.querySelector('[data-world="play"]').click();
   assert.equal(h.run('JSON.stringify(store)'),before,page);
  }
  assert.equal(worlds.size,5);assert.equal(titles.size,20);
 }finally{h.w.close();}
});
test('motion preference survives page changes and reduced motion gives a quiet cheer',()=>{
 const h=site();try{
  h.run(`ui.mode='learning';render();`);
  h.w.document.querySelector('[data-world="motion"]').click();
  assert.equal(h.w.localStorage.getItem('pointparty-motion'),'paused');
  h.w.document.querySelector('[data-act="nav"][data-page="account"]').click();
  assert.equal(h.w.document.querySelector('[data-world="motion"]').getAttribute('aria-pressed'),'true');
  h.w.document.querySelector('[data-world="play"]').click();
  assert.ok(h.w.document.querySelector('.world-message').textContent.length>0);
  assert.equal(h.w.document.querySelector('.world-particles'),null);
  h.w.document.querySelector('[data-world="motion"]').click();
  h.w.document.querySelector('[data-world="play"]').click();
  assert.equal(h.w.document.querySelector('.world-particles'),null); // matchMedia requests reduced motion.
 }finally{h.w.close();}
});
test('mascot celebration is bounded and direct learning tab renders retain the world controls',async()=>{
 const h=site(false);try{
  h.run(`ui.mode='learning';render();`);
  h.w.document.querySelector('[data-world="play"]').click();h.w.document.querySelector('[data-world="play"]').click();
  assert.equal(h.w.document.querySelectorAll('.world-particles').length,1);
  assert.equal(h.w.document.querySelectorAll('.world-particles b').length,12);
  h.w.document.querySelector('[data-world="motion"]').click();assert.equal(h.w.document.querySelector('.world-particles'),null);
  h.w.document.querySelector('[data-learning="tab"][data-tab="numbers"]').click();
  await Promise.resolve();
  assert.equal(h.w.document.querySelectorAll('.world-trail').length,1);
  assert.equal(h.w.document.querySelector('[data-world="motion"]').getAttribute('aria-pressed'),'true');
  assert.ok(h.w.document.querySelector('[data-learning="start"]'));
 }finally{h.w.close();}
});

test('compact navigation keeps all classes and every page reachable, with a direct add shortcut',()=>{
 const h=site();try{
  h.run(`CLASSES=Object.fromEntries(Array.from({length:8},(_,i)=>[String(401+i),{names:['Learner']} ]));store.roster=CLASSES;ui.cur='404';ui.mode='students';render();`);
  assert.deepEqual(Array.from(h.w.document.querySelectorAll('#classList [data-id]'),b=>b.dataset.id),['401','402','403','404','405','406','407','408']);
  assert.equal(h.w.document.querySelectorAll('#classList .pill').length,0);
  assert.equal(h.w.document.querySelectorAll('#classList .tch').length,0);
  assert.equal(h.w.document.querySelector('.skill-grid').parentElement.hidden,true);
  h.w.document.querySelector('[data-act="smode"][data-v="skill"]').click();
  assert.equal(h.w.document.querySelector('.skill-grid').parentElement.hidden,false);
  for(const page of h.run('Object.keys(PAGES)'))assert.ok(h.w.document.querySelector(`#navList [data-page="${page}"]`),page);
  h.w.document.querySelector('.class-heading [data-layout="add"]').click();
  assert.equal(h.run('ui.mode'),'setup');assert.equal(h.w.document.activeElement.id,'cid');
 }finally{h.w.close();}
});
test('another tab adding classes updates the visible list without changing the selected class',()=>{
 const h=site();try{
  h.run(`CLASSES={'401':{names:['Learner']}};store.roster=CLASSES;ui.cur='401';ui.mode='students';saveLocal();render();`);
  const next=h.run('JSON.parse(JSON.stringify(store))');next.roster['404']={names:['New learner']};next.roster['405']={names:['Another learner']};
  h.w.localStorage.setItem(h.run('KEY'),JSON.stringify(next));
  h.w.dispatchEvent(new h.w.StorageEvent('storage',{key:h.run('KEY'),newValue:JSON.stringify(next)}));
  assert.equal(h.w.document.querySelectorAll('#classList .cbtn').length,3);assert.equal(h.run('ui.cur'),'401');
  h.w.document.querySelector('#navList [data-page="materials"]').click();
  assert.ok(JSON.parse(h.w.localStorage.getItem(h.run('KEY'))).roster['405']);
 }finally{h.w.close();}
});
test('missed tab events and drafts cannot overwrite newer saved classroom data',()=>{
 const h=site();try{
  h.run(`CLASSES={'401':{names:['Learner']}};store.roster=CLASSES;ui.cur='401';ui.mode='students';saveLocal();render();`);
  const next=h.run('JSON.parse(JSON.stringify(store))');next.roster['404']={names:['New learner']};
  h.w.localStorage.setItem(h.run('KEY'),JSON.stringify(next));
  h.w.document.querySelector('#navList [data-page="materials"]').click();
  assert.equal(h.run('ui.mode'),'students');assert.ok(h.run(`CLASSES['404']`));
  h.w.document.querySelector('.class-heading [data-layout="add"]').click();
  h.w.document.querySelector('#cid').value='405';h.w.document.querySelector('#cnames').value='Draft learner';
  const newer=h.run('JSON.parse(JSON.stringify(store))');newer.roster['406']={names:['External learner']};
  h.w.localStorage.setItem(h.run('KEY'),JSON.stringify(newer));
  h.w.document.querySelector('[data-act="savecls"]').click();
  assert.equal(h.w.document.querySelector('#cnames').value,'Draft learner');assert.ok(!h.run(`CLASSES['405']`));
  assert.ok(JSON.parse(h.w.localStorage.getItem(h.run('KEY'))).roster['406']);
  h.run('PW.online=true;');h.w.dispatchEvent(new h.w.StorageEvent('storage',{key:h.run('KEY')}));
  assert.equal(h.w.document.querySelector('#cnames').value,'Draft learner');
 }finally{h.w.close();}
});


test('account-first entry hides device students and only unlocks a verified school',()=>{
 const h=site(true,true);try{
  assert.equal(h.w.document.body.classList.contains('account-locked'),true);
  assert.equal(h.w.document.querySelector('#classList').textContent,'');
  assert.equal(h.w.document.querySelector('#view').textContent,'');
  assert.ok(h.w.document.querySelector('#schoolLoginForm'));
  h.run(`CLASSES={'405':{names:['Private learner']}};store.roster=CLASSES;ui.cur='405';ui.mode='students';render();`);
  assert.doesNotMatch(h.w.document.body.textContent,/Private learner/);
  h.run(`PW.online=true;PW.accountReady=true;PW.passwordRequired=true;render();`);
  assert.ok(h.w.document.querySelector('#entryConfirm'));
  assert.equal(h.w.document.querySelector('#view').textContent,'');
  h.run(`PW.passwordRequired=false;PW.school='school';render();`);
  assert.equal(h.w.document.body.classList.contains('account-locked'),false);
  assert.match(h.w.document.querySelector('#view').textContent,/Private learner/);
  h.run(`PW.leaveOnline();`);
  assert.equal(h.w.document.querySelector('#view').textContent,'');
 }finally{h.w.close();}
});


test('denied material access disables navigation and hides a previously opened resource view',()=>{
 const h=site(true,true);try{
  h.run(`PW.online=true;PW.accountReady=true;PW.sourceAccessReady=true;PW.permissionsReady=true;PW.school='school';PW.user={id:'teacher'};PW.members=[{school_id:'school',user_id:'teacher',status:'approved',permissions:{points:true,materials:false}}];CLASSES={'405':{names:['Learner']}};store.roster=CLASSES;ui.cur='405';ui.mode='materials';render();`);
  const materials=h.w.document.querySelector('[data-page="materials"]');
  assert.equal(materials.disabled,true);
  assert.match(h.w.document.querySelector('#view').textContent,/has not enabled access/);
  h.run(`PW.admin=true;render();`);
  assert.equal(h.w.document.querySelector('[data-page="materials"]').disabled,false);
  assert.ok(h.w.document.querySelector('[data-material="tab"]'));
 }finally{h.w.close();}
});
