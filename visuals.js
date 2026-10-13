/* Decorative illustration layer. Classroom data and actions remain in their existing modules. */
(()=>{
 const drawings={
  learning:'<path d="M10 35c0-18 12-26 29-26 0 18-10 30-25 30m0-4L32 17"/>',
  dashboard:'<path d="m9 23 15-13 15 13v16H28V28h-8v11H9Z"/>',
  materials:'<rect x="12" y="13" width="25" height="29" rx="7"/><path d="M19 14v-3a6 6 0 0 1 12 0v3M17 27h15M17 34h15"/>',
  lessons:'<path d="M24 13c-6-5-12-4-17-3v27c6-2 11-1 17 3 6-4 11-5 17-3V10c-5-1-11-2-17 3Zm0 0v27"/>',
  attendance:'<rect x="8" y="11" width="32" height="30" rx="6"/><path d="M16 7v8M32 7v8M8 21h32m-23 9 5 5 10-10"/>',
  gradebook:'<path d="M11 8h23l5 5v29H11ZM18 19h13M18 26h13m-13 8 3 3 7-7"/>',
  progress:'<path d="M9 9v31h32M15 31l8-9 7 4 10-15M33 11h7v7"/>',
  family:'<circle cx="17" cy="16" r="6"/><circle cx="33" cy="18" r="5"/><path d="M5 39v-5a12 12 0 0 1 24 0v5m0-12a10 10 0 0 1 14 9v3"/>',
  students:'<path d="M35 23c0 10-5 17-11 17S13 33 13 23s5-17 11-17 11 7 11 17Z"/><path d="m14 25 6-4 5 6 7-6"/>',
  fame:'<path d="m24 5 6 12 13 2-10 10 3 14-12-7-12 7 3-14L5 19l13-2Z"/>',
  records:'<rect x="11" y="9" width="27" height="34" rx="5"/><rect x="18" y="5" width="13" height="8" rx="3"/><path d="M18 23h13M18 31h13"/>',
  teams:'<path d="M14 7h20v13a10 10 0 0 1-20 0ZM14 12H7v5a9 9 0 0 0 9 9m18-14h7v5a9 9 0 0 1-9 9M24 30v10m-8 1h16"/>',
  mystery:'<path d="M8 20h32v22H8ZM6 13h36v8H6Zm18 0v29"/><path d="M24 13C8 15 10-1 19 6l5 7c16 2 14-14 5-7Z"/>',
  pick:'<rect x="9" y="9" width="30" height="30" rx="8"/><circle cx="17" cy="17" r="2"/><circle cx="31" cy="31" r="2"/><circle cx="24" cy="24" r="2"/>',
  timer:'<circle cx="24" cy="27" r="15"/><path d="M24 19v9l7 4M19 5h10M24 5v7m12 1 4-4"/>',
  games:'<rect x="6" y="6" width="13" height="13" rx="2"/><rect x="29" y="6" width="13" height="13" rx="2"/><rect x="6" y="29" width="13" height="13" rx="2"/><path d="M29 29h7v7h6v6H29ZM25 9v10M9 24h10"/>',
  import:'<path d="M24 6v24m-9-9 9 9 9-9M8 32v10h32V32"/>',
  schools:'<path d="M7 42V20h34v22M5 20l19-13 19 13M19 42V30h10v12M12 26h2m20 0h2M24 7V3h11l-3 5H24"/>',
  account:'<rect x="10" y="21" width="28" height="22" rx="5"/><path d="M16 21V13a8 8 0 0 1 16 0v8M24 30v6"/>',
  setup:'<path d="m24 6 5 7 8 1 1 8 5 5-5 6-1 7-8 1-5 6-5-6-8-1-1-7-5-6 5-5 1-8 8-1Z"/><circle cx="24" cy="26" r="7"/>',
  video:'<rect x="6" y="11" width="36" height="27" rx="7"/><path d="m21 18 12 7-12 7Z"/>',
  game:'<path d="M15 15h18c7 0 11 21 5 23-4 1-7-6-10-6h-8c-3 0-6 7-10 6-6-2-2-23 5-23Z"/><path d="M15 20v10m-5-5h10m11-2h1m4 5h1"/>',
  board:'<path d="M7 9h34v25H21l-9 8v-8H7ZM14 18h20M14 25h14"/>',
  file:'<path d="M12 6h17l9 9v27H12Zm17 0v10h9M19 25h12M19 32h12"/>',
  refresh:'<path d="M39 21A15 15 0 0 0 13 13l-6 6m0-11v11h11m-9 8a15 15 0 0 0 26 8l6-6m0 11V29H30"/>',
  screen:'<rect x="6" y="8" width="36" height="26" rx="5"/><path d="M24 34v8m-10 0h20m-14-25 12 6-12 6Z"/>',
  link:'<path d="m20 16 5-5a9 9 0 0 1 13 13l-5 5m-5 3-5 5a9 9 0 0 1-13-13l5-5m3 11 12-12"/>'
 };
 const colors=['#ffd166','#70dcc2','#bba6ff','#ff9baf','#85c9ff'];
 function icon(name){const keys=Object.keys(drawings),n=keys.indexOf(name);return `<svg class="v-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="1" y="1" width="46" height="46" rx="15" fill="${colors[(n<0?0:n)%colors.length]}"/><g fill="none" stroke="#30295d" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${drawings[name]||drawings.link}</g></svg>`;}
 const buddy=`<svg class="v-buddy" viewBox="0 0 160 160" aria-hidden="true" focusable="false"><ellipse cx="80" cy="147" rx="37" ry="6" fill="#312668" opacity=".12"/><g class="buddy-float"><path d="m52 104-17 14 7 11 23-15m43-10 17 14-7 11-23-15" fill="#ffd166" stroke="#30295d" stroke-width="3"/><rect x="53" y="93" width="54" height="47" rx="21" fill="#fff" stroke="#30295d" stroke-width="3"/><path d="M63 135v9m34-9v9" stroke="#30295d" stroke-width="9" stroke-linecap="round"/><circle cx="80" cy="65" r="42" fill="#70dcc2" stroke="#30295d" stroke-width="3"/><rect x="45" y="44" width="70" height="47" rx="23" fill="#fff5db" stroke="#30295d" stroke-width="3"/><g class="buddy-eyes" fill="#30295d"><ellipse cx="66" cy="62" rx="3" ry="5"/><ellipse cx="94" cy="62" rx="3" ry="5"/></g><circle cx="57" cy="72" r="5" fill="#ffb6ba"/><circle cx="103" cy="72" r="5" fill="#ffb6ba"/><path d="M72 73q8 9 16 0" fill="none" stroke="#30295d" stroke-width="3" stroke-linecap="round"/><path d="m80 104 3 6 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z" fill="#bba6ff"/><path d="M57 35q10-8 21-8" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/></g><g class="buddy-star" fill="#ffd166" stroke="#30295d" stroke-width="2"><path d="m133 24 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z"/></g><circle cx="21" cy="51" r="5" fill="#ff9baf"/><circle cx="135" cy="106" r="6" fill="#bba6ff"/></svg>`;
 NAV.forEach(group=>group.items.forEach(item=>{item[1]=icon(item[0]);if(PAGES[item[0]])PAGES[item[0]].icon=item[1];}));
 const shell=renderShell;renderShell=function(){shell();document.querySelector('.brand .logo').innerHTML=`<svg class="grove-mark" viewBox="0 0 48 48" aria-hidden="true"><path d="M7 28q9-3 17 2 8-5 17-2v13q-9-2-17 2-8-4-17-2Z" fill="#fffaf0" stroke="#bc9c70" stroke-width="2"/><path d="M24 30v12" stroke="#bc9c70" stroke-width="2"/><g class="grove-leaves"><path d="M24 30V19" stroke="#4b946b" stroke-width="3" stroke-linecap="round"/><path d="M24 24C10 25 9 13 12 11c10 0 13 7 12 13Z" fill="#87caa0"/><path d="M24 19c0-11 8-14 12-12 2 8-4 13-12 12Z" fill="#58ad87"/><circle cx="18" cy="19" r="1.2" fill="#31594d"/><circle cx="22" cy="20" r="1.2" fill="#31594d"/><path d="M18 22q2 2 4 0" fill="none" stroke="#31594d" stroke-width="1.2"/></g><path class="grove-star" d="m39 7 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5-.5Z" fill="#f9b85b"/></svg>`;};
 const movingBuddy=buddy.replace('<path d="m52 104-17 14 7 11 23-15m43-10 17 14-7 11-23-15"','<path d="m52 104-17 14 7 11 23-15"').replace('<rect x="53" y="93"','<path class="buddy-wave" d="m108 104 17 14-7 11-23-15" fill="#ffd166" stroke="#30295d" stroke-width="3"/><rect x="53" y="93"');
 let paused=false;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 document.addEventListener('pointparty-motion-change',()=>{paused=document.body.classList.contains('v-paused');document.querySelectorAll('[data-visual=pause]').forEach(b=>{b.textContent=paused?'Resume animation':'Pause animation';b.setAttribute('aria-pressed',String(paused));});});
 function sparkle(x,y){
  if(paused||reduced()||document.querySelectorAll('.v-spark').length>32)return;
  for(let i=0;i<8;i++){const star=document.createElement('span'),angle=i*Math.PI/4;star.className='v-spark';star.setAttribute('aria-hidden','true');star.textContent=i%2?'✦':'●';star.style.cssText=`left:${x}px;top:${y}px;color:${colors[i%colors.length]};--dx:${Math.cos(angle)*65}px;--dy:${Math.sin(angle)*65-18}px`;document.body.appendChild(star);setTimeout(()=>star.remove(),900);}
 }
 const decorate=()=>{
  document.querySelectorAll('.hero-icon,.party-mascot').forEach(el=>{el.innerHTML=movingBuddy;});
  document.querySelectorAll('.material-hero,.party-banner').forEach(hero=>{
   if(hero.querySelector('.v-play-controls'))return;
   const sky=document.createElement('div');sky.className='v-sky';sky.setAttribute('aria-hidden','true');
   sky.innerHTML=Array.from({length:7},(_,i)=>`<span class="v-orbit" style="--i:${i};--x:${8+i*13}%;--y:${i%2?75:18}%">${i%3?'✦':'○'}</span>`).join('');hero.prepend(sky);
   const controls=document.createElement('div');controls.className='v-play-controls';
   controls.innerHTML=`<button type="button" class="v-fun-button" data-visual="dance">Let's dance! <span aria-hidden="true">✦</span></button>`;
   hero.querySelector('.hero-icon,.party-mascot').nextElementSibling.appendChild(controls);
  });
  document.querySelectorAll('.material-meta>span:first-child').forEach(el=>{const kind=el.textContent.trim().split(/\s+/).pop();if(['slides','video','game','board','worksheet','audio','file','link'].includes(kind))el.innerHTML=icon({slides:'lessons',worksheet:'file',audio:'video'}[kind]||kind)+' '+kind;});
  document.querySelectorAll('.material-grid .material-card h3').forEach(el=>{const text=el.textContent.trim(),platform=text.replace(/^[^A-Za-z]+/,'');if(['Gimkit','Wordwall','Padlet','Blooket','Kahoot','Wayground','Baamboozle','Flippity','PhET','Wheel of Names'].includes(platform)){const badge=document.createElement('span');badge.className='v-platform';badge.setAttribute('aria-hidden','true');badge.textContent=platform[0];el.replaceChildren(badge,document.createTextNode(platform));}});
 };
 const button=MH.button.bind(MH);
 MH.button=(action,label,attrs='')=>{const match=action==='tab'?attrs.match(/data-tab="([^"]+)"/):null,key=match?{plans:'attendance',library:'materials',platforms:'game',screen:'screen'}[match[1]]:{refresh:'refresh','resource-qr':'games',watch:'video',present:'screen','open-file':'import','plan-template':'fame'}[action];return button(action,key?icon(key)+' '+label.replace(/^[^A-Za-z]+/,''):label,attrs);};
 Object.keys(RENDER).forEach(page=>{const original=RENDER[page];RENDER[page]=function(){original();decorate();};});
 // Material tab actions call the hub directly, outside the page renderer.
 const materialsRender=MH.render.bind(MH);MH.render=function(){materialsRender();decorate();};
 document.addEventListener('click',e=>{
  const fun=e.target.closest('[data-visual]');
  if(fun){
   e.preventDefault();

   if(paused||reduced()){toast('Your device has reduced motion enabled. Your buddy is ready to cheer!');return;}
   const hero=fun.closest('.material-hero,.party-banner');if(hero.classList.contains('v-dancing'))return;
   hero.classList.add('v-dancing');setTimeout(()=>hero.classList.remove('v-dancing'),1800);
   const rect=hero.querySelector('.v-buddy').getBoundingClientRect();sparkle(rect.x+rect.width/2,rect.y+rect.height/2);return;
  }
  const button=e.target.closest('.btn,.skill,.material-tabs button');
  if(button&&!button.disabled){const rect=button.getBoundingClientRect();sparkle(e.clientX||rect.x+rect.width/2,e.clientY||rect.y+rect.height/2);}
 },true);
})();
