/* Shared teacher materials. School data and file access use existing approved-school permissions. */
window.MaterialHub={
 tab:'plans',selected:null,edit:null,search:'',busy:false,game:null,mediaUrl:null,
 data(){return store.materials=MaterialCore.clean(store.materials);},
 writable(permission='materials'){return PW.online&&PW.school&&!PW.busy&&!PW.blocked&&!this.busy&&PW.can(permission);},
 author(){return PW.user?.email||'Teacher';},
 button(action,label,attrs=''){return `<button class="btn" data-material="${action}" ${attrs}>${label}</button>`;},
 link(url,label){return `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;},
 classOptions(value,all=false){return `${all?'<option value="">All classes</option>':''}${Object.keys(CLASSES).map(c=>`<option value="${esc(c)}" ${c===value?'selected':''}>Class ${esc(c)}</option>`).join('')}`;},
 resources(){return this.data().resources.filter(r=>!r.archived&&(!r.classId||r.classId===ui.cur));},
 resourceCard(r){
  const icon={slides:'📊',video:'🎬',game:'🎮',board:'💬',worksheet:'📝',audio:'🎵',file:'📎',link:'🔗'}[r.kind]||'📎';
  return `<article class="material-card"><div class="material-meta"><span>${icon} ${esc(r.kind)}</span><span>${r.classId?'Class '+esc(r.classId):'All classes'}</span>${r.path?'<span>Private upload</span>':''}</div><h3>${esc(r.title)}</h3>${r.notes?`<p class="material-note">${esc(r.notes)}</p>`:''}<div class="form">${r.path?this.button('open-file','Open / download',`data-id="${esc(r.id)}"`):this.link(r.url,r.kind==='game'?'Play / host':'Open')}${r.url?this.button('resource-qr','QR code',`data-id="${esc(r.id)}"`):''}${MaterialCore.videoEmbed(r.url)?this.button('watch','Play video',`data-id="${esc(r.id)}"`):''}${this.button('archive-resource','Archive',`data-id="${esc(r.id)}"`)}</div><p class="note">${esc(r.filename||r.author)}</p></article>`;
 },
 planForm(){
  const p=this.data().plans.find(p=>p.id===this.edit)||{title:'',classId:ui.cur,date:LP.today(),duration:40,objective:'',notes:'',steps:[],resources:[]};
  return `<section class="panel"><h2>${this.edit?'Edit class plan':'Build a class plan'}</h2><form id="materialPlanForm" class="portal-form"><label for="planTitle">Lesson title</label><input id="planTitle" maxlength="120" required value="${esc(p.title)}" placeholder="e.g. Spookley: feelings and kindness"><div class="portal-columns"><div><label for="planClass">Class</label><select id="planClass">${this.classOptions(p.classId)}</select></div><div><label for="planDate">Lesson date</label><input id="planDate" type="date" value="${esc(p.date)}"></div><div><label for="planDuration">Minutes</label><input id="planDuration" type="number" min="5" max="180" value="${p.duration}" required></div></div><label for="planObjective">Learning goals</label><textarea id="planObjective" rows="3" maxlength="2000" placeholder="By the end, students can…">${esc(p.objective)}</textarea><label for="planSteps">Lesson sequence</label><textarea id="planSteps" rows="6" maxlength="14000" placeholder="5 | Warm up | Ask a question&#10;10 | Slides and story | Teach vocabulary&#10;15 | Game | Practice together&#10;10 | Exit ticket | Review learning">${esc(p.steps.map(s=>`${s.minutes} | ${s.title} | ${s.notes}`).join('\n'))}</textarea><p class="note">One activity per line: minutes | activity | instructions.</p><div class="form">${this.button('plan-template','Fill a free lesson structure')}</div><label for="planNotes">Preparation and teacher notes</label><textarea id="planNotes" rows="3" maxlength="4000">${esc(p.notes)}</textarea><h3>Attach materials</h3><div class="material-checklist">${this.data().resources.filter(r=>!r.archived&&(!r.classId||r.classId===p.classId)).map(r=>`<label class="portal-check"><input name="planResource" type="checkbox" value="${esc(r.id)}" ${p.resources.includes(r.id)?'checked':''}> ${esc(r.title)}</label>`).join('')||'<p>Add resources in the Library tab, then attach them here.</p>'}</div><button class="btn go" type="submit">Save class plan</button> ${this.edit?this.button('cancel-edit','Cancel'):''}</form></section>`;
 },
 planView(p){
  const d=this.data();
  return `<section class="panel">${this.button('back','← All class plans')}<div class="material-meta"><span>Class ${esc(p.classId)}</span><span>${esc(p.date||'Flexible date')}</span><span>${p.duration} min</span></div><h2>${esc(p.title)}</h2><p class="material-note">${esc(p.objective)}</p><div class="form">${this.button('present','Show on screen')} ${this.button('edit-plan','Edit plan',`data-id="${esc(p.id)}"`)} ${LP.nav('import','Import game results')}</div></section><div class="material-plan"><section class="panel"><h2>Lesson sequence</h2><ol class="material-steps">${p.steps.map(s=>`<li><b>${s.minutes} min · ${esc(s.title)}</b><p>${esc(s.notes)}</p></li>`).join('')||'<li>Add the lesson sequence in Edit plan.</li>'}</ol><h3>Teacher preparation</h3><p class="material-note">${esc(p.notes||'No preparation notes yet.')}</p></section><section class="panel"><h2>Everything for this lesson</h2><div class="material-resources">${p.resources.map(id=>d.resources.find(r=>r.id===id&&!r.archived)).filter(Boolean).map(r=>this.resourceCard(r)).join('')||'<p>Attach your slides, videos and games using Edit plan.</p>'}</div></section></div><section class="panel"><h2>Co-teacher suggestions</h2><p>Approved teachers in this school can read the plan, suggest changes and resolve suggestions. Use Refresh shared materials to see their latest saved work.</p>${d.suggestions.filter(s=>s.planId===p.id).map(s=>`<article class="material-suggestion ${s.resolved?'resolved':''}"><p class="material-note">${esc(s.body)}</p><p class="note">${esc(s.author)} · ${esc(s.date)} · ${s.resolved?'Resolved':'Open'}</p>${this.button('resolve',s.resolved?'Reopen':'Mark resolved',`data-id="${esc(s.id)}"`)}</article>`).join('')}<form id="materialSuggestionForm" class="portal-form"><label for="suggestionBody">Suggestion for this lesson</label><textarea id="suggestionBody" required maxlength="2000" rows="3" placeholder="What would you change or add?"></textarea><button class="btn go" type="submit">Add suggestion</button></form></section>`;
 },
 library(){
  const resources=this.resources().filter(r=>(r.title+' '+r.kind+' '+r.notes).toLowerCase().includes(this.search.toLowerCase()));
  return `<section class="panel"><h2>Class ${esc(ui.cur)} material library</h2><label for="materialSearch">Find a resource</label><div class="materials-controls"><input id="materialSearch" value="${esc(this.search)}" placeholder="Search slides, video, games…">${this.button('search','Search')}</div><div class="material-grid" style="margin-top:18px">${resources.map(r=>this.resourceCard(r)).join('')||'<p class="material-empty">Keep every useful link and file together here.</p>'}</div></section><section class="panel"><h2>Add a link or upload a file</h2><form id="materialResourceForm" class="portal-form"><label for="resourceTitle">Resource title</label><input id="resourceTitle" maxlength="120" required placeholder="e.g. Story slides, vocabulary game, video"><div class="portal-columns"><div><label for="resourceKind">Resource type</label><select id="resourceKind">${['slides','video','game','board','worksheet','audio','file','link'].map(k=>`<option value="${k}">${k[0].toUpperCase()+k.slice(1)}</option>`).join('')}</select></div><div><label for="resourceClass">Share with</label><select id="resourceClass">${this.classOptions(ui.cur,true)}</select></div></div><label for="resourceUrl">HTTPS link</label><input id="resourceUrl" type="url" maxlength="2000" placeholder="Paste a Canva, Google Slides, YouTube, game or Padlet link"><label for="resourceFile">Or upload PPT, PDF, worksheet, image or audio</label><input id="resourceFile" type="file" accept=".ppt,.pptx,.pdf,.docx,.png,.jpg,.jpeg,.webp,.mp3,.mp4,.txt,.csv"><p class="note">Uploads are private to approved teachers in this school. Maximum 25 MB per file. Link large videos. PPT files can be downloaded and opened in PowerPoint; use Canva or Google Slides links for web presentation.</p><label for="resourceNotes">How to use this material</label><textarea id="resourceNotes" maxlength="1500" rows="3"></textarea><button class="btn go" type="submit">Save resource online</button></form></section>`;
 },
 catalog(){
  const sites=[['⚡','Gimkit','Live and assignment games','https://www.gimkit.com/dashboard','https://www.gimkit.com/join','Read report; paste score rows (PDF is not imported)'],['🧩','Wordwall','Interactive screen games and assignments','https://wordwall.net/myactivities','https://wordwall.net/community','Export My Results; import results'],['💬','Padlet','Collaborative boards and exit tickets','https://padlet.com/dashboard','https://padlet.com','Teacher reviews participation'],['🟦','Blooket','Live quizzes and homework','https://dashboard.blooket.com','https://play.blooket.com','Import exported score table'],['🟣','Kahoot','Live quiz and review','https://create.kahoot.it','https://kahoot.it','Import exported score table'],['📝','Wayground','Live or self-paced practice','https://wayground.com','https://wayground.com/join','Import exported score table'],['🎯','Baamboozle','Whole-class team games','https://www.baamboozle.com/games','https://www.baamboozle.com/games','Award team points during play'],['🃏','Flippity','Quiz shows and flashcards','https://www.flippity.net','https://www.flippity.net','Award points during play'],['🔬','PhET','Interactive science and math','https://phet.colorado.edu','https://phet.colorado.edu','Teacher reviews learning'],['🎡','Wheel of Names','Names, words and prompts','https://wheelofnames.com','https://wheelofnames.com','Use classroom skill awards']];
  return `<section class="panel"><h2>A game for every teaching moment</h2><p>Host on the platform, save your activity link in the Library, and attach it to a class plan. Use the activity’s student join link for QR access; the host dashboard is for teachers.</p><div class="material-grid">${sites.map(s=>`<article class="material-card"><h3>${s[0]} ${s[1]}</h3><p>${s[2]}</p><div class="form">${this.link(s[3],'Teacher site')}${this.link(s[4],'Join / explore')}</div><p class="note">Points: ${s[5]}</p></article>`).join('')}</div></section><section class="panel"><h2>Game results → classroom points</h2><p>After an external game, upload a compatible CSV/Excel report or paste its results table. Gimkit PDF reports need their score rows copied into the table. ClassGrove matches seat numbers, calculates awards and saves the source in each student’s record after your review. Use names such as “07 Amy”. It does not read other websites in the background.</p>${LP.nav('import','Open results importer')} ${LP.nav('games','Show a game QR')} ${this.button('tab','Play a screen quiz', 'data-tab="screen"')}</section>`;
 },
 screen(){
  const quizzes=LP.data().lessons.filter(l=>l.classId===ui.cur&&l.kind==='quiz'&&l.questions.length);
  if(this.game&&this.game.classId!==ui.cur)this.game=null;
  if(this.game){const q=this.game.questions[this.game.index],answered=this.data().results.filter(r=>r.run===this.game.run);return `<section class="panel screen-game"><div class="form">${this.button('end-game','End screen quiz')}${this.button('present','Full screen')}</div><p class="note">${esc(this.game.title)} · Question ${this.game.index+1} / ${this.game.questions.length} · ${this.game.points} points for a correct answer</p><label for="screenSeat">Whose turn?</label><select id="screenSeat">${students(ui.cur).filter(s=>!C().absent[s.seat]).map(s=>`<option value="${s.seat}" ${s.seat===this.game.seat?'selected':''}>${s.seat} · ${esc(s.name)}</option>`).join('')}</select><h2>${esc(q.prompt)}</h2><div class="screen-choices">${q.choices.map((choice,i)=>`<button data-material="answer" data-choice="${i}" ${this.data().results.some(r=>r.key===this.game.run+':'+this.game.index+':'+this.game.seat)?'disabled':''}>${String.fromCharCode(65+i)} · ${esc(choice)}</button>`).join('')}</div><p class="screen-result" role="status">${esc(this.game.feedback||'Discuss, choose an answer, and earn points together.')}</p><div class="form">${this.button('next-question',this.game.index===this.game.questions.length-1?'Finish quiz':'Next question')}</div><p class="note">${answered.length} attempts · ${answered.reduce((n,r)=>n+r.points,0)} points awarded this game. Each seat has one attempt per question.</p></section>`;}
  return `<section class="panel"><h2>Play together on the classroom screen</h2><p>Choose a quiz from Lessons & assignments. Select the student’s seat, then tap their answer on the screen. Correct answers add points and a source record automatically. Absent students are excluded.</p>${quizzes.length?`<form id="screenGameForm" class="portal-form"><label for="screenQuiz">Class quiz</label><select id="screenQuiz">${quizzes.map(q=>`<option value="${esc(q.id)}">${esc(q.title)}</option>`).join('')}</select><label for="screenPoints">Points per correct answer</label><input id="screenPoints" type="number" min="0" max="10" value="2" required><button class="btn go" type="submit">Start screen quiz</button></form>`:`<p>Add a quiz with questions under Lessons & assignments to start.</p>${LP.nav('lessons','Create a quiz')}`}</section>`;
 },
 render(){
  const d=this.data(),plan=d.plans.find(p=>p.id===this.selected&&p.classId===ui.cur&&!p.archived);
  view.innerHTML=`<section class="material-hero"><span class="hero-icon" aria-hidden="true">🎒</span><div><small>READY FOR CLASS</small><h2>One lesson. Everything together.</h2><p>Plan · slides · videos · games · your teaching team</p></div></section><div class="material-tabs">${[['plans','📅 Class plans'],['library','📎 Library'],['platforms','🎮 Games & QR'],['screen','🖥️ Screen quiz']].map(([id,label])=>this.button('tab',label,`data-tab="${id}" aria-pressed="${this.tab===id}"`)).join('')}${this.button('refresh','↻ Refresh shared materials')}</div>${!PW.online?'<section class="panel"><p>Sign in and open your online school to save plans, upload files and collaborate with co-teachers.</p>'+LP.nav('account','Teacher sign in')+'</section>':''}${this.tab==='plans'?(plan?this.planView(plan):`<section class="panel"><h2>Class ${esc(ui.cur)} plans</h2><div class="material-grid">${d.plans.filter(p=>p.classId===ui.cur&&!p.archived).slice().reverse().map(p=>`<article class="material-card"><div class="material-meta">${esc(p.date||'Flexible date')} · ${p.duration} min</div><h3>${esc(p.title)}</h3><p>${esc(p.objective)}</p><p class="note">${p.resources.length} resources · ${d.suggestions.filter(s=>s.planId===p.id&&!s.resolved).length} open suggestions</p><div class="form">${this.button('open-plan','Open lesson',`data-id="${esc(p.id)}"`)}${this.button('edit-plan','Edit',`data-id="${esc(p.id)}"`)}</div></article>`).join('')||'<p>No class plans yet. Build your first lesson below.</p>'}</div></section>${this.planForm()}`):this.tab==='library'?this.library():this.tab==='platforms'?this.catalog():this.screen()}`;
  view.classList.toggle('material-busy',this.busy);
 },
 async action(b){
  const a=b.dataset.material;
  if(a==='tab'){this.tab=b.dataset.tab;this.selected=null;this.edit=null;this.render();return;}
  if(a==='search'){this.search=$('#materialSearch').value;this.render();return;}
  if(a==='back'){this.selected=null;this.render();return;}
  if(a==='open-plan'){this.selected=b.dataset.id;this.render();return;}
  if(a==='edit-plan'){this.edit=b.dataset.id;this.selected=null;this.render();return;}
  if(a==='cancel-edit'){this.edit=null;this.render();return;}
  if(a==='present'){if(!document.body.classList.contains('present'))togglePresent();return;}
  if(a==='plan-template'){const total=Math.max(5,Math.min(180,Number($('#planDuration').value)||40)),warm=Math.max(1,Math.round(total*.125)),teach=Math.max(1,Math.round(total*.25)),play=Math.max(1,Math.round(total*.375)),review=Math.max(1,total-warm-teach-play);$('#planSteps').value=`${warm} | Warm up | Recall prior learning and introduce the goal\n${teach} | Teach and model | Open the slides or video, then model an example\n${play} | Practice and play | Use a screen or iPad game; check student understanding\n${review} | Reflect and exit ticket | Review answers and share a short response`;return;}
  if(a==='refresh'){if(!PW.online||!PW.school)return;if(PW.dirty||PW.saving){toast('Save your current changes before refreshing.');return;}await PW.switchOnline(PW.school);ui.mode='materials';this.render();return;}
  const d=this.data(),r=d.resources.find(r=>r.id===b.dataset.id);
  if(a==='resource-qr'&&r?.url){openOverlay(`<div class="dlg"><h2>${esc(r.title)}</h2><div class="material-qr">${qrSvg(r.url)}</div><p>Scan to open this activity. Use your seat number for game results.</p>${this.link(r.url,'Open activity')}${this.button('close','Close')}</div>`,true);return;}
  if(a==='watch'&&r){const embed=MaterialCore.videoEmbed(r.url);if(embed)openOverlay(`<div class="dlg" style="width:min(960px,94vw)"><h2>${esc(r.title)}</h2><iframe class="material-frame" src="${esc(embed)}" title="${esc(r.title)}" allow="fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>${this.button('close','Close video')}</div>`,true);return;}
  if(a==='close'){closeOverlay();if(this.mediaUrl){URL.revokeObjectURL(this.mediaUrl);this.mediaUrl=null;}return;}
  if(a==='open-file'&&r?.path){
   if(!PW.online||!r.path.startsWith(PW.school+'/'))throw new Error('Open this resource in its own online school.');
   b.disabled=true;try{
    const school=PW.school,{data,error}=await PW.client.storage.from('pp-materials').download(r.path);if(error)throw error;
    if(!PW.online||PW.school!==school)throw new Error('Open this resource in its own online school.');
    const url=URL.createObjectURL(data);
    if(/\.(mp4|mp3)$/i.test(r.filename)){
     if(this.mediaUrl)URL.revokeObjectURL(this.mediaUrl);this.mediaUrl=url;
     const tag=/\.mp4$/i.test(r.filename)?'video':'audio';
     openOverlay(`<div class="dlg" style="width:min(960px,94vw)"><h2>${esc(r.title)}</h2><${tag} controls ${tag==='video'?'class="material-frame" playsinline':'style="width:100%"'} src="${esc(url)}"></${tag}>${this.button('close','Close player')}</div>`,true);
    }else{
     if(this.mediaUrl)URL.revokeObjectURL(this.mediaUrl);this.mediaUrl=url;
     openOverlay(`<div class="dlg"><h2>${esc(r.title)}</h2><p>Your private file is ready. Download it to open in its usual app.</p><a class="btn go" href="${esc(url)}" download="${esc(r.filename||r.title)}">Download file</a> ${this.button('close','Close')}</div>`,true);
    }
   }finally{b.disabled=false;}return;
  }
  if(!this.writable(['answer','next-question','end-game'].includes(a)?'activities':'materials'))throw new Error('Ask your administrator for permission, or resolve unsaved changes first.');
  if(a==='answer'&&!PW.can('points'))throw new Error('Ask your administrator for points permission.');
  if(a==='archive-resource'&&r){r.archived=true;save();this.render();toast('Resource archived. Its file is kept online.');return;}
  if(a==='resolve'){const s=d.suggestions.find(s=>s.id===b.dataset.id);if(s){s.resolved=!s.resolved;save();this.render();}return;}
  if(a==='end-game'){this.game=null;this.render();return;}
  if(a==='next-question'){if(!this.game)return;if(this.game.index>=this.game.questions.length-1)this.game=null;else{this.game.index++;this.game.feedback='';}this.render();return;}
  if(a==='answer'&&this.game){
   const selected=Number($('#screenSeat').value);if(!students(ui.cur).some(s=>s.seat===selected))throw new Error('Choose a student seat.');
   const result=MaterialCore.awardQuiz(C(),d.results,{run:this.game.run,question:this.game.index,seat:selected,choice:Number(b.dataset.choice),quiz:this.game.questions[this.game.index],points:this.game.points,date:LP.today(),classId:ui.cur,title:this.game.title});
   this.game.seat=selected;this.game.feedback=result.duplicate?'This seat already answered this question.':result.absent?'This student is marked absent.':result.correct?`Correct! +${result.points} points.`:'Good try. Discuss the answer and try the next question.';
   if(!result.duplicate&&!result.absent){save();renderShell();if(result.points)sfx.plus();}this.render();return;
  }
 },
 async submit(form){
  if(!this.writable(form.id==='screenGameForm'?'activities':'materials'))throw new Error('Sign in, open your school, and check your permissions with the administrator.');
  if(form.id==='screenGameForm'&&!PW.can('points'))throw new Error('Ask your administrator for points permission.');
  const d=this.data();
  if(form.id==='materialPlanForm'){
   if(d.plans.length>=200&&!this.edit)throw new Error('Class plan limit reached.');
   const old=d.plans.find(p=>p.id===this.edit),plan={id:old?.id||crypto.randomUUID(),classId:$('#planClass').value,title:$('#planTitle').value.trim(),date:$('#planDate').value,duration:Number($('#planDuration').value),objective:$('#planObjective').value,notes:$('#planNotes').value,steps:MaterialCore.parseSteps($('#planSteps').value),resources:[...form.querySelectorAll('[name=planResource]:checked')].map(el=>el.value),author:old?.author||this.author(),archived:false};
   if(!plan.title)throw new Error('Give your lesson a title.');if(old)Object.assign(old,plan);else d.plans.push(plan);this.edit=null;this.selected=plan.id;ui.cur=plan.classId;save();await PW.flush();render();if(PW.dirty)throw new Error('Plan is waiting to save. Use My account > Retry save before leaving.');toast('Class plan saved online.');return;
  }
  if(form.id==='materialSuggestionForm'){if(d.suggestions.length>=500)throw new Error('Suggestion limit reached.');d.suggestions.push({id:crypto.randomUUID(),planId:this.selected,body:$('#suggestionBody').value.trim(),author:this.author(),date:LP.today(),resolved:false});save();await PW.flush();this.render();if(PW.dirty)throw new Error('Suggestion is waiting to save. Use My account > Retry save before leaving.');toast('Suggestion saved for your teaching team.');return;}
  if(form.id==='screenGameForm'){const quiz=LP.data().lessons.find(q=>q.id===$('#screenQuiz').value&&q.classId===ui.cur&&q.kind==='quiz');if(!quiz?.questions.length)throw new Error('Choose a quiz with questions.');const present=students(ui.cur).filter(s=>!C().absent[s.seat]);if(!present.length)throw new Error('No present students are available.');this.game={run:crypto.randomUUID(),classId:ui.cur,title:quiz.title,questions:structuredClone(quiz.questions),points:Number($('#screenPoints').value),index:0,seat:present[0].seat,feedback:''};this.render();return;}
  if(form.id==='materialResourceForm'){
   if(d.resources.length>=400)throw new Error('Resource limit reached.');
   const school=PW.school,file=$('#resourceFile').files[0],url=MaterialCore.safeUrl($('#resourceUrl').value.trim());
   if(!file&&!url)throw new Error('Add an HTTPS link or choose a file.');if(file&&$('#resourceUrl').value.trim())throw new Error('Use one link or one file for each resource.');if(file){const problem=MaterialCore.fileError(file);if(problem)throw new Error(problem);}
   const resource={id:crypto.randomUUID(),classId:$('#resourceClass').value,title:$('#resourceTitle').value.trim(),kind:$('#resourceKind').value,notes:$('#resourceNotes').value,url,path:'',filename:file?.name||'',size:file?.size||0,author:this.author(),archived:false};
   if(!resource.title)throw new Error('Give the resource a title.');
   this.busy=true;form.classList.add('material-busy');
   try{
    if(file){resource.path=school+'/'+resource.id+'/'+file.name.replace(/[^A-Za-z0-9._-]/g,'_').slice(-180);const {error}=await PW.client.storage.from('pp-materials').upload(resource.path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(error)throw new Error('Upload failed. Check your school access, storage setup and available quota.');}
    if(!PW.online||PW.school!==school)throw new Error('The school changed before the upload finished.');
    // data() returns a fresh sanitized object, so use the latest object after the await.
    this.data().resources.push(resource);save();await PW.flush();if(PW.dirty)throw new Error('The file uploaded but its library entry has not saved. Use My account → Retry save before leaving.');toast('Resource saved in private online storage.');
   }finally{this.busy=false;form.classList.remove('material-busy');}
   this.render();return;
  }
 }
};
const MH=window.MaterialHub;
const materialSchoolSwitch=PW.switchOnline.bind(PW);
PW.switchOnline=async id=>{if(MH.busy){toast('Wait for the material upload to finish before switching schools.');PW.renderBar();return;}return materialSchoolSwitch(id);};
NAV[0].items.splice(1,0,['materials','🎒','Class materials','Plans, files, games and your teaching team']);
PAGES.materials={icon:'🎒',label:'Class materials',sub:'Everything ready for class'};
RENDER.materials=()=>MH.render();
const materialsApply=PW.applyStore.bind(PW);PW.applyStore=next=>{MH.selected=null;MH.edit=null;MH.game=null;MH.search='';materialsApply(next);};
document.addEventListener('click',e=>{const b=e.target.closest('[data-material]');if(b){e.preventDefault();MH.action(b).catch(error=>toast(error.message||'Could not complete that action.'));}},true);
document.addEventListener('change',e=>{if(e.target.id==='screenSeat'&&MH.game){MH.game.seat=Number(e.target.value);MH.game.feedback='';MH.render();}},true);
document.addEventListener('submit',async e=>{if(!['materialPlanForm','materialResourceForm','materialSuggestionForm','screenGameForm'].includes(e.target.id))return;e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]');button.disabled=true;try{await MH.submit(form);}catch(error){toast(error.message||'Could not save the material.');}finally{button.disabled=false;}},true);
// Keep a durable receipt for exact duplicate reports, independent of the shortened activity history.
const originalImport=applyImport;
let materialImportPending=false;
applyImport=async function(){
 if(!IMP||materialImportPending)return;
 const pending=IMP,school=PW.school,classId=ui.cur,valid=IMP.items.filter(i=>i.seat&&Number(i.pts)>0);
 if(!valid.length)return originalImport();
 materialImportPending=true;
 try{
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(MaterialCore.reportKey(classId,pending.game,LP.today(),valid)));
  if(IMP!==pending||PW.school!==school||ui.cur!==classId)return;
  const key=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),receipts=Array.isArray(store.gameImportReceipts)?store.gameImportReceipts:[];
  if(receipts.includes(key)){toast('This exact report was already awarded today. Use a distinct game-session name for a new round.');return;}
  receipts.push(key);store.gameImportReceipts=receipts.slice(-500);originalImport();
 }catch(error){toast('Could not verify this report. No points were added.');}
 finally{materialImportPending=false;}
};
