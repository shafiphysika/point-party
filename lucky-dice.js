(function(root){
 'use strict';
 function randomIndex(size,fill=a=>root.crypto.getRandomValues(a)){
  if(!Number.isInteger(size)||size<1||size>4294967296)throw new RangeError('A nonempty pool is required');
  const limit=Math.floor(4294967296/size)*size,word=new Uint32Array(1);
  do{fill(word);}while(word[0]>=limit);
  return word[0]%size;
 }
 const patterns=[[5],[1,9],[1,5,9],[1,3,7,9],[1,3,5,7,9],[1,3,4,6,7,9]];
 const EFFECTS=[
  {id:'wheel',label:'Name wheel',icon:'🎡',hint:'Spin the names in your selected class'},
  {id:'original',label:'Original',icon:'\u{1f3b2}',hint:'Classic 3D die with clatter and sparkle'},
  {id:'show',label:'Dice show',icon:'\u{1f31f}',hint:'Animated buddy and full-screen celebration'},
  {id:'machine',label:'Dice machine',icon:'\u{1f579}',hint:'Shake the chamber and reveal a lucky seat'},
  {id:'magic',label:'Magic wand',icon:'\u{1fa84}',hint:'A wand tap and a magical roll'}
 ];
 function resolveEffect(value){
  if(['buddy','cinema','surprise'].includes(value))return 'show';
  return EFFECTS.some(e=>e.id===value)?value:'show';
 }
 function preference(){try{return resolveEffect(root.localStorage.getItem('pointparty-dice-effect'));}catch{return 'show';}}
 function setPreference(value){try{root.localStorage.setItem('pointparty-dice-effect',resolveEffect(value));}catch{}}
 function wheelAngle(index,size){
  if(!Number.isInteger(size)||size<1||size>60||!Number.isInteger(index)||index<0||index>=size)throw new RangeError('Invalid wheel segment');
  return 2160-(index+.5)*360/size;
 }
 function wheelMarkup(pool,angle=0){
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!pool.length)return '<div class="name-wheel"><p>No learners are available. Check attendance.</p></div>';
  const colors=['#ff6b6b','#ffa94d','#ffd43b','#69db7c','#38d9a9','#4dabf7','#9775fa','#f783ac'],n=pool.length,R=176,ink='#1f2340';
  const point=(a,r=R)=>[200+r*Math.sin(a*Math.PI/180),200-r*Math.cos(a*Math.PI/180)].map(v=>v.toFixed(3)).join(' ');
  const colorAt=i=>colors[(i===n-1&&n>1&&i%colors.length===0)?3:i%colors.length];
  const ems=t=>Array.from(t).reduce((w,c)=>w+(/[\u2e80-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(c)?1:.62),0);
  const avail=122,fsArc=Math.min(22,2*Math.PI*118/n*.6);
  const bulbs=Math.max(16,Math.min(36,n*2));
  return `<div class="name-wheel"><div class="wheel-frame"><span class="wheel-pointer" aria-hidden="true"><svg viewBox="0 0 44 56" width="44" height="56"><path d="M5 5H39L22 51Z" fill="#ff3d6e" stroke="#1f2340" stroke-width="4" stroke-linejoin="round"/><path d="M13 10H25L19 27Z" fill="#fff" opacity=".5"/></svg></span><svg class="wheel-disc" viewBox="0 0 400 400" aria-label="Class name wheel" role="img" style="transform:rotate(${Number(angle)||0}deg)"><defs><radialGradient id="wheel-dome" cx="50%" cy="50%" r="50%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".22"/></radialGradient><linearGradient id="wheel-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3f73"/><stop offset="1" stop-color="#1f2340"/></linearGradient></defs><circle cx="200" cy="200" r="198" fill="url(#wheel-rim)"/>${pool.map((s,i)=>{
   const start=i*360/n,end=(i+1)*360/n,mid=(start+end)/2,full=Array.from(String(s.name)),name=full.length>10?full.slice(0,9).join('')+'\u2026':full.join('');
   const fs=Math.max(8,Math.min(fsArc,avail/(ems(name)+ems(String(s.seat))*.72+.4))).toFixed(1);
   const slice=n===1?`<circle cx="200" cy="200" r="${R}" fill="${colors[0]}"/>`:`<path d="M200 200 L${point(start)} A${R} ${R} 0 ${end-start>180?1:0} 1 ${point(end)} Z" fill="${colorAt(i)}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>`;
   const label=n===1?`<text x="200" y="120" text-anchor="middle" dominant-baseline="central"`:`<text transform="rotate(${(mid-90).toFixed(3)} 200 200)" x="${200+R-12}" y="200" text-anchor="end" dominant-baseline="central"`;
   return `<g>${slice}${label} class="wheel-label" font-size="${fs}" fill="#fff" stroke="${ink}" stroke-width="${(fs*.24).toFixed(2)}" stroke-linejoin="round" paint-order="stroke" font-weight="800"><title>${esc(s.seat+' · '+s.name)}</title><tspan font-size="${(fs*.72).toFixed(1)}" fill="#fff8d6">${esc(s.seat)}</tspan> ${esc(name)}</text></g>`;
  }).join('')}<circle cx="200" cy="200" r="${R}" fill="url(#wheel-dome)" pointer-events="none"/><circle cx="200" cy="200" r="${R}" fill="none" stroke="${ink}" stroke-width="4"/>${Array.from({length:bulbs},(_,i)=>`<circle cx="${point(i*360/bulbs,188).split(' ')[0]}" cy="${point(i*360/bulbs,188).split(' ')[1]}" r="4.2" fill="${i%2?'#fff':'#ffe066'}" stroke="${ink}" stroke-width="1.5"/>`).join('')}</svg><span class="wheel-gloss" aria-hidden="true"></span><span class="wheel-hub" aria-hidden="true">✦</span></div><details class="wheel-roster" open><summary>${n} names on this wheel · full names</summary><div>${pool.map(s=>`<span class="wheel-name">${esc(s.seat+' · '+s.name)}</span>`).join('')}</div></details></div>`;
 }
 function buddy(){
  return `<div class="dice-buddy clay-dice-buddy" aria-hidden="true"><div class="baby-talk">Let's roll!</div><img src="assets/clay-teacher.png" alt="" width="1312" height="1199" draggable="false"></div>`;
 }
 function markup(mode='show'){
  const character=mode==='magic'?'<div class="dice-magician"><div class="baby-talk">A touch of magic!</div><img src="dice-magician.png" alt="" width="1152" height="1408" draggable="false"><span class="wand-contact"></span></div>':mode==='original'?'<div class="original-caption"><span class="baby-talk">Ready to roll!</span></div>':mode==='machine'?'<div class="machine-side"><div class="baby-talk">Powering up!</div><span class="machine-lever">&#x1F579;</span></div>':buddy();
  return `<div class="dice-play-table mode-${mode}" aria-hidden="true">${character}<div class="lucky-dice-scene ${mode==='machine'?'machine-chamber':''}"><span class="dice-star star-one">✦</span><span class="dice-star star-two">✧</span><div class="dice-shadow"></div><div class="dice-hop"><div class="lucky-cube">${patterns.map((p,i)=>`<div class="dice-face face-${i+1}"><div class="dice-pips">${Array.from({length:9},(_,j)=>`<i class="${p.includes(j+1)?'pip':''}"></i>`).join('')}</div>${i===0?'<div class="dice-smile"><span></span><span></span><i></i></div><div class="dice-result"><b id="dice-number"></b><span id="dice-student"></span></div>':''}</div>`).join('')}</div><span class="dice-hand hand-left">✦</span><span class="dice-hand hand-right">✦</span></div></div></div>`;
 }
 function cinema(quiet,onAgain,mode='show'){
  const magic=mode==='magic',casting=magic&&!quiet;
  const dialog=document.createElement('dialog');dialog.className='dice-cinema '+(casting?'is-casting':'is-rolling')+(magic?' cinema-magic':mode==='machine'?' cinema-machine':'')+(quiet?' cinema-quiet':'');
  dialog.setAttribute('aria-label','Lucky dice show');
  dialog.innerHTML=`<button class="cinema-close" aria-label="Close dice show">✕</button><div class="cinema-aura" aria-hidden="true"></div><div class="cinema-floor" aria-hidden="true"></div><div class="cinema-sparks" aria-hidden="true">${Array.from({length:36},(_,i)=>`<i style="--x:${(i*37)%100}%;--delay:${(i%9)*.17}s;--turn:${i*43}deg"></i>`).join('')}</div><header class="cinema-heading"><p>${magic?'THE MAGIC DICE':mode==='machine'?'THE DICE MACHINE':'LUCKY DICE SHOW'}</p><h2 class="cinema-title" role="status" aria-live="polite">${casting?'Watch the wand…':"Let's roll!"}</h2><span class="cinema-subtitle">${casting?'One little tap. A whole lot of magic.':'A little bounce. A little luck.'}</span></header><div class="cinema-camera">${markup(mode).replace('id="dice-number"','id="cinema-number"').replace('id="dice-student"','id="cinema-student"')}</div><footer class="cinema-controls"><button class="cinema-again" hidden>Roll again 🎲</button><button class="cinema-back" hidden>Back to class</button><p class="cinema-wait">${casting?'The magician is waking the dice…':'Shaking up the luck…'}</p></footer>`;
  dialog.querySelector('.baby-talk').textContent=magic?'Abracadabra!':mode==='machine'?'Shake the chamber!':'Shake, shake!';
  let castTimer;
  const previousOverflow=document.body.style.overflow;
  const close=()=>{clearTimeout(castTimer);if(!dialog.isConnected)return;document.body.style.overflow=previousOverflow;dialog.close();dialog.remove();};
  dialog.querySelector('.cinema-close').addEventListener('click',close);
  dialog.querySelector('.cinema-back').addEventListener('click',close);
  dialog.querySelector('.cinema-again').addEventListener('click',()=>{close();onAgain();});
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  if(!quiet)dialog.addEventListener('pointermove',e=>{
   dialog.style.setProperty('--camera-x',((e.clientX/innerWidth-.5)*5)+'deg');
   dialog.style.setProperty('--camera-y',((e.clientY/innerHeight-.5)*-4)+'deg');
  },{passive:true});
  document.body.appendChild(dialog);document.body.style.overflow='hidden';dialog.showModal();
  if(casting)castTimer=setTimeout(()=>{
   if(!dialog.isConnected)return;dialog.classList.remove('is-casting');dialog.classList.add('is-rolling');
   dialog.querySelector('.cinema-title').textContent='Magic in motion!';dialog.querySelector('.cinema-wait').textContent='Rolling toward our lucky student…';
  },1250);
  return {close,finish(student){
   if(!dialog.isConnected)return;
   clearTimeout(castTimer);dialog.classList.remove('is-rolling','is-casting');dialog.classList.add('has-winner');
   dialog.querySelector('#cinema-number').textContent=student.seat;
   dialog.querySelector('#cinema-student').textContent=student.name;
   dialog.querySelector('.cinema-title').textContent=student.name;
   dialog.querySelector('.cinema-subtitle').textContent='Lucky student · Seat '+student.seat;
   dialog.querySelector('.baby-talk').textContent='Your turn!';
   dialog.querySelector('.cinema-wait').hidden=true;
   dialog.querySelectorAll('.cinema-controls button').forEach(b=>b.hidden=false);
   dialog.querySelector('.cinema-again').focus();
  }};
 }
 function sound(mode,tone){
  const notes=mode==='machine'?[130,175,220,260]:mode==='magic'?[523,784,1047,1568]:mode==='original'?[240,320,280,400]:[392,523,659,784];
  notes.forEach((f,i)=>tone(f,.10,mode==='machine'?'sawtooth':'triangle',i*.11,.06));
 }
 const api={sound,randomIndex,markup,cinema,EFFECTS,resolveEffect,preference,setPreference,wheelAngle,wheelMarkup};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LuckyDice=api;
})(typeof window==='undefined'?globalThis:window);
