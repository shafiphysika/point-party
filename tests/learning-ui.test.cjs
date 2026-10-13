const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');
function harness(){
 const dom=new JSDOM('<main id="view"></main>',{url:'http://localhost/',runScripts:'outside-only'}),w=dom.window;
 const messages=[];let starts=0,terminated=0;
 Object.assign(w,{NAV:[{items:[]}],PAGES:{},RENDER:{},ui:{mode:'learning'},view:w.document.querySelector('main'),$:s=>w.document.querySelector(s),esc:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),sfx:{plus(){}},toast:t=>messages.push(t),togglePresent(){w.document.body.classList.add('present');},Worker:class{constructor(){starts++;}postMessage(p){messages.push(p);}terminate(){terminated++;}}});
 for(const file of ['learning-core.js','learning.js'])w.eval(fs.readFileSync(file,'utf8'));
 w.RENDER.learning();
 const click=a=>w.document.querySelector(`[data-learning="${a}"]`).click();
 return {dom,w,click,messages,starts:()=>starts,terminated:()=>terminated};
}
test('number quest gives feedback, locks each answer and advances without changing school points',()=>{
 const h=harness();try{
  h.w.document.querySelector('[data-tab="numbers"]').click();h.click('start');
  const heading=h.w.document.querySelector('.learning-quest h2').textContent,nums=heading.match(/\d+/g).map(Number),answer=nums[0]+nums[1];
  h.w.document.querySelector(`[data-learning="answer"][data-value="${answer}"]`).click();
  assert.match(h.w.document.querySelector('.learning-feedback').textContent,/You did it/);
  assert.ok([...h.w.document.querySelectorAll('[data-learning="answer"]')].every(b=>b.disabled));
  h.click('next');assert.ok([...h.w.document.querySelectorAll('[data-learning="answer"]')].every(b=>!b.disabled));
  h.click('hint');assert.match(h.w.document.querySelector('.learning-feedback').textContent,/count/);
 }finally{h.dom.window.close();}
});
test('teacher prompt builder preserves topic and grade without starting a model download',()=>{
 const h=harness();try{
  h.w.document.querySelector('[data-tab="ai"]').click();h.w.document.querySelector('#helperTopic').value='plants';h.w.document.querySelector('#helperGrade').value='4';
  h.w.document.querySelector('#teacherHelperForm').dispatchEvent(new h.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(h.starts(),0);assert.match(h.w.document.querySelector('.helper-answer').textContent,/plants/);assert.match(h.w.document.querySelector('.helper-answer').textContent,/Grade 4/);
  assert.equal(h.w.document.querySelectorAll('a[href="https://aistudio.google.com/"]').length,1);
 }finally{h.dom.window.close();}
});

test('all supplied friends remain selectable without a manual motion toggle',()=>{
 const h=harness();try{
  const select=h.w.document.querySelector('#learningFriend');assert.equal(select.options.length,5);select.value='snow';select.dispatchEvent(new h.w.Event('change',{bubbles:true}));
  assert.match(h.w.document.querySelector('.learning-friend img').getAttribute('src'),/snow-friend/);
  assert.equal(h.w.document.querySelector('[data-learning="motion"]'),null);
 }finally{h.dom.window.close();}
});
test('dice show displays the exact winner as text, exposes controls, and cleans up the dialog',()=>{
 const dom=new JSDOM('<button id="roll">Roll</button>',{runScripts:'outside-only'}),w=dom.window;
 w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
 try{
  w.eval(fs.readFileSync('lucky-dice.js','utf8'));const show=w.LuckyDice.cinema(true,()=>{},'machine');
  assert.equal(w.document.body.style.overflow,'hidden');assert.ok(w.document.querySelector('.machine-chamber'));
  show.finish({seat:26,name:'<b>Student</b>'});assert.equal(w.document.querySelector('#cinema-student').textContent,'<b>Student</b>');assert.equal(w.document.querySelector('#cinema-student b'),null);
  assert.equal(w.document.querySelector('.cinema-again').hidden,false);show.close();assert.equal(w.document.querySelector('dialog'),null);assert.equal(w.document.body.style.overflow,'');
 }finally{w.close();}
});
