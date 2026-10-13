/* ClassGrove's five illustrated worlds. This module never writes classroom data. */
(()=>{
 const scenes={
  dashboard:['garden','A fresh day to grow','Little steps can lead to wonderful discoveries.','Grow a rainbow'],
  students:['garden','Every learner is a little wonder','Meet your class. Notice an effort. Celebrate a little win.','Wake the garden'],
  learning:['garden','Follow your curiosity','A question is the start of an adventure.','Grow a rainbow'],
  attendance:['garden','Our whole garden, together','Every arrival brings a little more sunshine.','Hello, sunshine'],
  family:['ocean','A little window into learning','Share the discoveries that make your child smile.','Make a splash'],
  progress:['ocean','Small ripples. Big journeys.','See how learning grows, one little step at a time.','Make a splash'],
  records:['ocean','A sea of little achievements','Every effort has a story worth remembering.','Send a bubble'],
  gradebook:['ocean','Discover what is growing','Look for progress, encourage practice, and cheer the next step.','Send a bubble'],
  teams:['space','Better together, beyond the stars','Teamwork gives every rocket a little more lift.','Launch a rocket'],
  timer:['space','Ready, steady, explore!','Make a little space for a big idea.','Launch a rocket'],
  games:['space','Your next mission awaits','Scan, join, and discover something new together.','Meet an astronaut'],
  import:['space','Bring your discoveries home','Turn your game results into a classroom celebration.','Launch a rocket'],
  fame:['carnival','Step into the celebration','Kindness, courage, and effort deserve a little spotlight.','Throw a party'],
  mystery:['carnival','A little mystery. A big smile.','Think together, then discover what is inside.','Pop a surprise'],
  picker:['carnival','Who will have the next adventure?','A bounce, a roll, and a little classroom magic.','Throw a party'],
  materials:['workshop','Ideas come to life here','Collect the little things that make a great lesson.','Spark an idea'],
  lessons:['workshop','Make something wonderful','A story, a question, a creation. What will you discover?','Spark an idea'],
  schools:['workshop','A home for every learning adventure','Bring your classrooms and teaching team together.','Spark an idea'],
  account:['workshop','The people behind the magic','A little teamwork makes a wonderful classroom.','Spark an idea'],
  setup:['workshop','Build your happy learning place','Get your classroom ready for its next adventure.','Spark an idea']
 };
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const isQuiet=()=>document.body.classList.contains('v-paused')||reduce.matches;
 // Motion follows the device preference; legacy manual pause no longer applies.
 document.body.classList.remove('v-paused');
 document.dispatchEvent(new Event('pointparty-motion-change'));
 function decorate(){
  if(!view.isConnected||!document.body)return;
  const [world,title,description,action]=scenes[ui.mode]||scenes.setup;
  document.body.dataset.world=world;
  if(view.querySelector('.world-trail'))return;
  const studying=['materials','lessons','gradebook','progress','records','learning'].includes(ui.mode);
  const kids=!['picker','timer','mystery','teams'].includes(ui.mode);
  const art=kids?(studying?'clay-kids-study.png':'clay-kids-play-clean.png'):'learning-world.png';
  const trail=document.createElement('section');trail.className='world-trail';trail.dataset.page=ui.mode;trail.setAttribute('aria-label','Classroom adventure');
  trail.innerHTML=`<div class="world-illustration"><div class="planet-stage"><span class="planet-orbit" aria-hidden="true"></span><img class="${kids?'world-kids':'world-globe'}" src="assets/${art}" alt="" width="${kids?1536:1339}" height="${kids?1024:1175}" decoding="async"></div></div><div class="world-copy"><small>CLASSGROVE · ${world==='workshop'?'IDEA WORKSHOP':world.toUpperCase()+' WORLD'}</small><h2>${title}</h2><p>${description}</p><div class="world-controls"><button type="button" class="world-play" data-world="play">${kids?'Hurrah!':action} <span aria-hidden="true">✦</span></button><span class="world-message" role="status"></span></div></div><div class="world-scenery" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;
  view.prepend(trail);
 }
 new MutationObserver(decorate).observe(view,{childList:true});
 // Also decorate synchronous renders so keyboard and page tests see the same interface.
 Object.keys(RENDER).forEach(page=>{const previous=RENDER[page];RENDER[page]=function(){previous();decorate();};});
 const previousHub=MH.render.bind(MH);MH.render=function(){previousHub();decorate();};
 document.addEventListener('click',e=>{
  const control=e.target.closest('[data-world]');
  if(control?.dataset.world!=='play')return;
  const trail=control.closest('.world-trail'),message=trail.querySelector('.world-message');
  message.textContent='Hurrah! '+{garden:'A little kindness helps everyone bloom.',ocean:'Keep exploring. There is so much to discover!',space:'Mission kindness: ready for takeoff!',carnival:'Hooray for trying something new!',workshop:'Your next bright idea is waiting.'}[document.body.dataset.world];
  if(isQuiet()||trail.classList.contains('world-cheer'))return;
  trail.classList.add('world-cheer');
  const particles=document.createElement('div');particles.className='world-particles';particles.setAttribute('aria-hidden','true');
  const tokens={garden:['✿','❀','✦'],ocean:['○','◦','○'],space:['✦','★','✧'],carnival:['●','✦','◆'],workshop:['✦','◆','✧']}[document.body.dataset.world];
  particles.innerHTML=Array.from({length:12},(_,i)=>`<b style="--n:${i};--flight:${(i%5-2)*28}px">${tokens[i%3]}</b>`).join('');trail.appendChild(particles);
  setTimeout(()=>{trail.classList.remove('world-cheer');particles.remove();},1600);
 });
 // A bounded, visual-only camera tilt. It never touches school records.
 let tiltFrame=0,tiltTarget=null,tiltX=0,tiltY=0;
 document.addEventListener('pointermove',e=>{
  const trail=e.target.closest?.('.world-trail');
  if(!trail||reduce.matches||e.pointerType==='touch')return;
  const rect=trail.getBoundingClientRect();tiltTarget=trail;
  tiltX=Math.max(-8,Math.min(8,(e.clientX-rect.left)/Math.max(1,rect.width)*16-8));
  tiltY=Math.max(-5,Math.min(5,5-(e.clientY-rect.top)/Math.max(1,rect.height)*10));
  if(tiltFrame)return;
  tiltFrame=requestAnimationFrame(()=>{tiltFrame=0;if(!tiltTarget?.isConnected)return;tiltTarget.style.setProperty('--scene-x',tiltX+'deg');tiltTarget.style.setProperty('--scene-y',tiltY+'deg');});
 });
 document.addEventListener('pointerout',e=>{const trail=e.target.closest?.('.world-trail');if(trail&&!trail.contains(e.relatedTarget)){tiltTarget=null;trail.style.removeProperty('--scene-x');trail.style.removeProperty('--scene-y');}});
 document.addEventListener('visibilitychange',()=>document.body.classList.toggle('world-background',document.hidden));
 reduce.addEventListener?.('change',()=>document.querySelectorAll('.world-particles').forEach(el=>el.remove()));
 decorate();
})();
