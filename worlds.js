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
  schools:['workshop','A home for every learning adventure','Bring your classrooms and teaching team together.','Wake the robot'],
  account:['workshop','The people behind the magic','A little teamwork makes a wonderful classroom.','Wake the robot'],
  setup:['workshop','Build your happy learning place','Get your classroom ready for its next adventure.','Spark an idea']
 };
 const faces='<g class="world-eyes" fill="#243d4b"><ellipse cx="68" cy="75" rx="4" ry="6"/><ellipse cx="98" cy="75" rx="4" ry="6"/></g><path d="M74 91q10 12 20 0" fill="none"/><circle cx="56" cy="88" r="6" fill="#ffadad" stroke="none"/><circle cx="110" cy="88" r="6" fill="#ffadad" stroke="none"/>';
 const drawings={
  garden:`<path class="world-prop" d="M132 43q-22-30 0-35 22 5 0 35Zm0 0v22" fill="#4aaf73"/><g class="world-friend"><ellipse cx="83" cy="132" rx="45" ry="20" fill="#53b880"/><circle cx="59" cy="49" r="19" fill="#82dba5"/><circle cx="107" cy="49" r="19" fill="#82dba5"/><rect x="37" y="48" width="92" height="76" rx="36" fill="#82dba5"/>${faces}<path d="M48 123l-14 15m86-15 14 15" stroke-width="9"/></g><path d="M24 58v28m-10-14h20" stroke="#f4af44" stroke-width="5"/>`,
  ocean:`<g class="world-prop" fill="none" stroke="#59a9c8"><circle cx="137" cy="23" r="9"/><circle cx="25" cy="47" r="6"/><circle cx="132" cy="63" r="5"/></g><g class="world-friend"><path d="M38 89C1 95 5 64 19 65q2 18 22 5" fill="#5cb9ce"/><path d="M35 74c3-47 108-48 101 16-3 40-103 48-108 6Z" fill="#82d0df"/>${faces}<path class="world-wing" d="M98 106q19 20 24 1" fill="#5cb9ce"/><path d="M81 38q-9-25-18-14m18 14q0-32 14-27" fill="none" stroke="#5cb9ce"/></g><path d="M17 141q17-12 34 0t34 0t34 0t34 0" fill="none" stroke="#59a9c8"/>`,
  space:`<path class="world-prop" d="m135 14 4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1Z" fill="#ffcc69"/><g class="world-friend"><path d="m53 115-13 23 13 2 10-20m48-5 13 23-13 2-10-20" fill="#6885c4"/><rect x="48" y="95" width="68" height="36" rx="17" fill="#fff"/><path class="world-wing" d="M118 98q29-12 14-29" fill="none" stroke-width="13"/><circle cx="83" cy="72" r="48" fill="#fff"/><rect x="43" y="48" width="80" height="54" rx="25" fill="#bedfff"/>${faces}<rect x="72" y="109" width="21" height="12" rx="4" fill="#ffc76d" stroke="none"/></g><path d="M15 118q-17-42 13-61" fill="none" stroke="#6885c4" stroke-dasharray="4 7"/>`,
  carnival:`<g class="world-prop"><path d="M134 57v68" fill="none"/><ellipse cx="134" cy="32" rx="17" ry="23" fill="#ff9aa6"/></g><g class="world-friend"><path d="M44 49 36 24l29 12m38 0 29-12-8 27" fill="#fff4cb"/><rect x="34" y="41" width="96" height="81" rx="34" fill="#ffdc80"/>${faces}<path d="m60 120-13 18m59-18 13 18" stroke-width="10"/><path d="m65 39 18-28 18 28Z" fill="#c9b1ee"/><circle cx="83" cy="10" r="6" fill="#ff9aa6" stroke="none"/><path d="m69 121 14-7 14 7-14 7Z" fill="#fd9eaa"/></g><path d="m17 71 8 3m-9 29 7-4m115 37 8 3" stroke="#b29adb" stroke-width="5"/>`,
  workshop:`<g class="world-prop"><path d="M133 55v-8m-8-10q-5-17 9-17t9 17l-4 9h-10Z" fill="#ffd36e"/></g><g class="world-friend"><path d="M62 127v13m43-13v13" stroke-width="12"/><rect x="49" y="96" width="68" height="38" rx="15" fill="#79c9be"/><path class="world-wing" d="M116 108q26-8 19-28" fill="none" stroke-width="12"/><rect x="34" y="39" width="98" height="69" rx="23" fill="#a6ded6"/><rect x="45" y="51" width="76" height="47" rx="17" fill="#fff4d4"/>${faces}<path d="M83 39V25"/><circle cx="83" cy="19" r="7" fill="#ffd36e"/><path d="m73 116 10-6 10 6-10 6Z" fill="#ffc76d" stroke="none"/></g><path d="m22 117-9 18 15 1 7-19Z" fill="#c5b1eb"/>`
 };
 const svg=world=>`<svg viewBox="0 0 170 160" aria-hidden="true" focusable="false"><ellipse cx="84" cy="150" rx="50" ry="5" fill="#243d4b" opacity=".09"/><g stroke="#243d4b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawings[world]}</g></svg>`;
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
  const trail=document.createElement('section');trail.className='world-trail';trail.dataset.page=ui.mode;trail.setAttribute('aria-label','Classroom adventure');
  trail.innerHTML=`<div class="world-illustration">${svg(world)}</div><div class="world-copy"><small>CLASSGROVE · ${world==='workshop'?'IDEA WORKSHOP':world.toUpperCase()+' WORLD'}</small><h2>${title}</h2><p>${description}</p><div class="world-controls"><button type="button" class="world-play" data-world="play">${action} <span aria-hidden="true">✦</span></button><span class="world-message" role="status"></span></div></div><div class="world-scenery" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;
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
  message.textContent={garden:'A little kindness helps everyone bloom.',ocean:'Keep exploring. There is so much to discover!',space:'Mission kindness: ready for takeoff!',carnival:'Hooray for trying something new!',workshop:'Your next bright idea is waiting.'}[document.body.dataset.world];
  if(isQuiet()||trail.classList.contains('world-cheer'))return;
  trail.classList.add('world-cheer');
  const particles=document.createElement('div');particles.className='world-particles';particles.setAttribute('aria-hidden','true');
  const tokens={garden:['✿','❀','✦'],ocean:['○','◦','○'],space:['✦','★','✧'],carnival:['●','✦','◆'],workshop:['✦','◆','✧']}[document.body.dataset.world];
  particles.innerHTML=Array.from({length:12},(_,i)=>`<b style="--n:${i};--flight:${(i%5-2)*28}px">${tokens[i%3]}</b>`).join('');trail.appendChild(particles);
  setTimeout(()=>{trail.classList.remove('world-cheer');particles.remove();},1600);
 });
 document.addEventListener('visibilitychange',()=>document.body.classList.toggle('world-background',document.hidden));
 reduce.addEventListener?.('change',()=>document.querySelectorAll('.world-particles').forEach(el=>el.remove()));
 decorate();
})();
