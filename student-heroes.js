/* Original storybook avatars. Achievements are derived from saved classroom records. */
(()=>{
 const colors=['#42a781','#ef9f43','#d7759b','#52aab6','#a082c4','#d97a56'];
 function avatar(seat,classId){
  const seed=Array.from(String(classId)).reduce((n,c)=>n+c.charCodeAt(0),Number(seat)),i=seed%6;
  const skin=['#f3bd91','#a96c45','#e9a875','#ce905c','#f5c9a7','#875238'][i],hair=['#493529','#30282b','#ac542c','#292c33','#6c4633','#362720'][i],color=colors[i];
  return `<svg class="hero-avatar" viewBox="0 0 160 180" aria-hidden="true" focusable="false"><ellipse cx="80" cy="167" rx="42" ry="7" fill="#4d705f22"/><g class="hero-fly" style="--hero-delay:-${i*.4}s"><path class="hero-cape" d="M60 79 Q22 93 16 147 Q46 131 64 156 L100 139 Q129 147 146 133 Q126 94 99 80Z" fill="${color}" opacity=".85"/><path d="M63 125 L61 154 L73 155 L82 129 M87 126 L91 153 L103 151 L99 123" fill="${color}" stroke="#344a4933" stroke-width="3"/><path d="M60 150 L75 151 L74 160 L54 160 Q51 156 60 150 M90 150 L104 147 L110 157 L91 160Z" fill="#354c50"/><path d="M60 83 Q77 74 99 82 L105 128 Q80 139 56 126Z" fill="${color}" stroke="#fff8" stroke-width="3"/><path d="M60 86 L38 106 L31 99 M99 87 L118 68 L125 55" fill="none" stroke="${skin}" stroke-width="12" stroke-linecap="round"/><circle cx="126" cy="53" r="9" fill="${skin}"/><path d="M78 91 L83 101 L94 102 L86 110 L88 121 L78 115 L68 121 L70 110 L62 102 L73 101Z" fill="#ffe394"/><circle cx="79" cy="51" r="31" fill="${hair}"/>${i%2?`<circle cx="51" cy="41" r="14" fill="${hair}"/><circle cx="107" cy="40" r="14" fill="${hair}"/>`:''}<ellipse cx="80" cy="57" rx="27" ry="29" fill="${skin}"/><path d="M52 47 Q54 16 80 22 Q113 21 109 48 Q94 44 90 33 Q75 49 52 47" fill="${hair}"/><ellipse cx="69" cy="57" rx="4" ry="5" fill="#2c292c"/><ellipse cx="92" cy="57" rx="4" ry="5" fill="#2c292c"/><circle cx="70" cy="55" r="1.2" fill="#fff"/><circle cx="93" cy="55" r="1.2" fill="#fff"/><path d="M71 70 Q81 80 92 68" fill="#fff" stroke="#823f35" stroke-width="2" stroke-linejoin="round"/><ellipse cx="60" cy="68" rx="5" ry="3" fill="#e18e83" opacity=".6"/></g><g class="hero-spark" fill="#e6b74f"><path d="M23 47 l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><path d="M133 100 l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></g></svg>`;
 }
 function identity(c,seat){
  const points=Math.max(0,Number(c.pts[seat])||0),records=c.log[seat]||[],journey=GroveRewards.progress(points);
  const skills=PartyCore.SKILLS.map(s=>({...s,count:records.filter(r=>r.p>0&&r.g===s.icon+' '+s.name).length}));
  return {points,journey,skills,title:journey.earned.at(-1)?.name||'Hero in training'};
 }
 window.GroveHeroes={avatar,identity};
 const card=cardHTML;cardHTML=function(s,c){const h=identity(c,s.seat);return card(s,c).replace('<span class="pet">',`${avatar(s.seat,ui.cur)}<span class="hero-rank">${esc(h.title)}</span><span class="pet">`);};
 const originalTap=tapStudent;tapStudent=function(seat){originalTap(seat);const el=view.querySelector('.card[data-seat="'+seat+'"] .hero-rank');if(el)el.textContent=identity(C(),seat).title;};
 const originalSpot=spotlight;spotlight=function(seat,head,auto){
  originalSpot(seat,head,auto);const overlay=document.querySelector('#overlay');if(overlay.hidden)return;
  const h=identity(C(),seat),panel=document.createElement('section');panel.className='hero-passport';panel.dataset.act='noop';
  panel.innerHTML=`<div class="hero-actions"><span>${esc(head||'Every effort is a superpower')}</span><button class="btn" type="button" data-act="closeov">Close profile ✕</button></div><div class="passport-heading">${avatar(seat,ui.cur)}<div><small>CLASS ${esc(ui.cur)} · SEAT ${seat} · HERO PASSPORT</small><h2>${esc(nameMap(ui.cur)[seat])}</h2><p>${esc(h.title)} · ${h.journey.earned.length} treasure milestones</p><strong class="hero-points">${h.points} points · ${stage(h.points)} companion</strong><button class="btn" type="button" data-hero-cheer>Celebrate my effort ✦</button><p class="hero-message" role="status" aria-live="polite"></p></div></div><h3>My learning superpowers</h3><p>Every skill can grow. Recognitions below come from your recent saved skill records.</p><div class="hero-skills">${h.skills.map(s=>`<div class="hero-skill ${s.count?'earned':''}"><span aria-hidden="true">${s.icon}</span><b>${esc(s.name)}</b><small>${s.count?s.count+' recognition'+(s.count===1?'':'s'):'Try: '+esc(s.hint)}</small></div>`).join('')}</div><p class="hero-next">${h.journey.next?'Next treasure: '+esc(h.journey.next.name)+' · '+(h.journey.next.points-h.points)+' more points':'Your treasure trail is complete. Keep sharing your superpowers!'}</p>`;
  // Replace the old oversized spotlight with one compact passport. Keep the
  // existing, permission-checked award button and the real treasure collection.
  const award=overlay.querySelector('[data-act=spplus]'),collection=overlay.querySelector('.personal-rewards');
  if(award)panel.appendChild(award);
  overlay.replaceChildren(panel,collection);collection.dataset.act='noop';
  if(!auto)panel.querySelector('[data-act=closeov]').focus({preventScroll:true});
 };
 document.addEventListener('click',e=>{const b=e.target.closest('[data-hero-cheer]');if(!b)return;const panel=b.closest('.hero-passport');panel.classList.remove('hero-cheering');void panel.offsetWidth;panel.classList.add('hero-cheering');panel.querySelector('.hero-message').textContent='Hurrah! Your effort makes our classroom brighter.';if(ui.sound)sfx.cheer();setTimeout(()=>panel.classList.remove('hero-cheering'),1600);});
})();
