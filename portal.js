/* Learning workspace and private family portal. Permissions live in PostgreSQL. */
window.Portal={
 editLesson:null,lessonView:null,attendanceDate:null,assessment:null,progressSeat:null,
 family:null,familyStatus:'',familyRequest:0,submissions:[],links:[],loading:false,
 data(){return store.portal=PortalCore.clean(store.portal);},
 today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;},
 writable(){return !PW.online||(PW.school&&!PW.busy&&!PW.blocked);},
 clearFamily(){this.family=null;this.familyStatus='';this.familyRequest++;this.submissions=[];this.links=[];},
 reset(){this.editLesson=null;this.lessonView=null;this.assessment=null;this.progressSeat=null;this.submissions=[];this.links=[];},
 button(a,label,attrs=''){return `<button class="btn" data-portal="${a}" ${attrs}>${label}</button>`;},
 nav(page,label){return `<button class="btn" data-act="nav" data-page="${page}">${label}</button>`;},
 classSelect(id,label){return `<label for="${id}">${label}</label><select id="${id}">${Object.keys(CLASSES).map(c=>`<option ${c===ui.cur?'selected':''} value="${esc(c)}">Class ${esc(c)}</option>`).join('')}</select>`;},
 lessonForm(){
  const l=this.data().lessons.find(l=>l.id===this.editLesson)||{title:'',body:'',subject:'English',url:'',kind:'lesson',due:'',published:false,questions:[]};
  return `<section class="panel"><h2>${this.editLesson?'Edit material':'Prepare a lesson or assignment'}</h2><form id="lessonForm" class="portal-form">
  <label for="lessonTitle">Title</label><input id="lessonTitle" required maxlength="120" value="${esc(l.title)}" placeholder="e.g. Spookley story and feelings">
  <div class="portal-columns"><div><label for="lessonSubject">Subject</label><input id="lessonSubject" maxlength="60" value="${esc(l.subject)}"></div><div><label for="lessonKind">Material type</label><select id="lessonKind">${['lesson','assignment','quiz'].map(k=>`<option value="${k}" ${l.kind===k?'selected':''}>${k[0].toUpperCase()+k.slice(1)}</option>`).join('')}</select></div></div>
  <label for="lessonBody">Lecture notes or instructions</label><textarea id="lessonBody" maxlength="8000" rows="6">${esc(l.body)}</textarea>
  <label for="lessonUrl">Resource or game link (HTTPS)</label><input id="lessonUrl" type="url" maxlength="2000" value="${esc(l.url)}" placeholder="https://…">
  <label for="lessonDue">Due date (optional)</label><input id="lessonDue" type="date" value="${esc(l.due)}">
  <details ${l.kind==='quiz'?'open':''}><summary>Quiz questions</summary><p>One question per line. Separate the question, choices and correct choice number with |.</p><p class="note">Example: What color is a pumpkin? | Orange | Blue | 1</p><textarea id="lessonQuestions" aria-label="Quiz questions" rows="5" maxlength="20000">${esc(l.questions.map(q=>[q.prompt,...q.choices,q.answer+1].join(' | ')).join('\n'))}</textarea></details>
  <label class="portal-check"><input id="lessonPublished" type="checkbox" ${l.published?'checked':''}> Publish for linked students and parents</label><p class="note">Drafts are private to teachers. Published material is shared after the school is saved online.</p>
  <div class="form"><button class="btn go" type="submit">Save material</button>${this.editLesson?this.button('cancel-lesson','Cancel edit'):''}</div></form></section>`;
 },
 lessonCard(l,family=false){
  const resource=PortalCore.safeUrl(l.url);
  const submitted=family?this.family.submissions.find(s=>s.lesson_id===l.id):null;
  return `<article class="lesson-item"><div class="portal-item-head"><span class="role-pill">${esc(l.kind||'lesson')} · ${esc(l.subject||'Class learning')}</span>${!family?`<span>${l.published?'Published':'Draft'}</span>`:''}</div><h3>${esc(l.title)}</h3>${l.due?`<p class="note">Due ${esc(l.due)}</p>`:''}<p class="portal-text">${esc(l.body)}</p>${resource?`<a class="btn" href="${esc(resource)}" target="_blank" rel="noopener noreferrer">Open resource ↗</a>`:''}
  ${!family?`<div class="form">${this.button('view-lesson','Present lesson',`data-id="${esc(l.id)}"`)}${this.button('edit-lesson','Edit',`data-id="${esc(l.id)}"`)}${this.button('publish-lesson',l.published?'Return to draft':'Publish',`data-id="${esc(l.id)}"`)}</div>`:submitted?`<p class="account-status">Submitted ${esc(new Date(submitted.submitted_at).toLocaleDateString())} · ${submitted.score===null?'Awaiting teacher review':`${esc(submitted.score)} / ${esc(submitted.maximum)}`}</p>${submitted.feedback?`<p class="portal-text">Teacher feedback: ${esc(submitted.feedback)}</p>`:''}`:this.family.kind==='student'&&['assignment','quiz'].includes(l.kind)?`<form class="portal-submit" data-lesson="${esc(l.id)}">${l.kind==='assignment'?'<label>My work<textarea name="body" required maxlength="8000" rows="4"></textarea></label>':(l.questions||[]).map((q,i)=>`<fieldset><legend>${i+1}. ${esc(q.prompt)}</legend>${q.choices.map((c,j)=>`<label class="portal-choice"><input type="radio" name="q${i}" value="${j}" required> ${esc(c)}</label>`).join('')}</fieldset>`).join('')}<button class="btn go" type="submit">${l.kind==='quiz'?'Submit quiz':'Submit work'}</button></form>`:''}</article>`;
 },
 async loadFamily(id){
  const request=++this.familyRequest;this.family=null;this.familyStatus='Loading your linked child…';RENDER.family();
  try{const data=await PW.rpc('pp_family_feed',{p_link:id});if(request!==this.familyRequest||!PW.online)return;this.family=data;this.familyStatus='';}
  catch(error){if(request!==this.familyRequest)return;this.familyStatus=PortalCore.authError(error);}
  if(ui.mode==='family')RENDER.family();
 },
 async loadTeacher(){
  if(!PW.online||!PW.school)return;
  const school=PW.school;this.loading=true;
  try{const results=await Promise.all([PW.client.from('pp_family_links').select('id,class_id,seat,email,kind,active').eq('school_id',school),PW.client.from('pp_submissions').select('id,class_id,seat,lesson_id,body,score,maximum,feedback,submitted_at').eq('school_id',school).order('submitted_at',{ascending:false})]);results.forEach(r=>{if(r.error)throw r.error;});if(PW.school!==school)return;[this.links,this.submissions]=results.map(r=>r.data);}
  catch(error){toast(PortalCore.authError(error));}finally{this.loading=false;}
  if(['family','progress','gradebook'].includes(ui.mode))RENDER[ui.mode]();
 },
 async action(b){
  const action=b.dataset.portal;
  if(action==='refresh-family'){await PW.loadAccess();if(this.family)await this.loadFamily(this.family.id);else RENDER.family();return;}
  if(action==='load-teacher'){await this.loadTeacher();return;}
  if(action==='view-lesson'){this.lessonView=b.dataset.id;RENDER.lessons();return;}
  if(action==='back-lessons'){this.lessonView=null;RENDER.lessons();return;}
  if(action==='reveal-answer'){const el=$('#quizAnswer'+b.dataset.index);if(el)el.hidden=false;return;}
  if(action==='export-progress'){await this.exportProgress();return;}
  if(!this.writable())throw new Error('SCHOOL_ACCESS_REQUIRED');
  const permission=['invite-family','revoke-family'].includes(action)?'invite':action==='all-present'?'roster':'activities';
  if(!PW.can(permission))throw new Error('PERMISSION_'+permission.toUpperCase()+'_REQUIRED');
  const p=this.data();
  if(action==='edit-lesson'){this.editLesson=b.dataset.id;this.lessonView=null;RENDER.lessons();$('#lessonTitle').focus();return;}
  if(action==='cancel-lesson'){this.editLesson=null;RENDER.lessons();return;}
  if(action==='publish-lesson'){const l=p.lessons.find(l=>l.id===b.dataset.id);if(l)l.published=!l.published;save();RENDER.lessons();return;}
  if(action==='all-present'){const d=this.attendanceDate||this.today();((p.attendance[d]??={})[ui.cur]??={});for(const s of students(ui.cur))p.attendance[d][ui.cur][s.seat]='present';save();RENDER.attendance();return;}
  if(action==='invite-family'){
   if(!PW.online||!PW.school)throw new Error('SCHOOL_ACCESS_REQUIRED');if(PW.dirty){await PW.flush();if(PW.dirty)throw new Error('SCHOOL_CONFLICT');}
   const input=$('#familyEmail');if(!input.reportValidity())return;
   await PW.rpc('pp_invite_family',{p_school:PW.school,p_class:ui.cur,p_seat:Number($('#familySeat').value),p_email:input.value.trim().toLowerCase(),p_kind:$('#familyKind').value});toast('Access invitation recorded. Share the site and invited email sign-in instructions.');await this.loadTeacher();return;
  }
  if(action==='revoke-family'){await PW.rpc('pp_revoke_family',{p_link:b.dataset.id});await this.loadTeacher();toast('Linked access revoked.');return;}
  if(action==='review-work'){
   const form=b.closest('.work-review'),score=form.querySelector('[name=score]'),maximum=form.querySelector('[name=maximum]');if(!score.reportValidity()||!maximum.reportValidity())return;
   await PW.rpc('pp_review_work',{p_submission:b.dataset.id,p_score:Number(score.value),p_maximum:Number(maximum.value),p_feedback:form.querySelector('[name=feedback]').value});toast('Feedback saved.');await this.loadTeacher();return;
  }
 },
 async exportProgress(){
  const p=this.data(),rows=[['Seat','Student','Points','Grade percent','Graded assessments','Present','Absent','Late','Excused']];
  for(const s of students(ui.cur)){const r=PortalCore.progress(p,ui.cur,s.seat);rows.push([s.seat,s.name,C().pts[s.seat]||0,r.grades.percentage??'',r.grades.graded,r.attendance.present,r.attendance.absent,r.attendance.late,r.attendance.excused]);}
  const cell=v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')+'"';
  await saveFile('class-'+ui.cur+'-progress.csv','\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n'),'text/csv');
 }
};
const LP=window.Portal;
store.portal=PortalCore.clean(store.portal);
const learningPages=[['dashboard','🏠','Overview','Your teaching day'],['lessons','📚','Lessons & assignments','Prepare, publish and present'],['attendance','📅','Attendance','A record for every learning day'],['gradebook','📝','Gradebook','Assessments, work and feedback'],['progress','📈','Progress','Learning over time'],['family','👨‍👩‍👧','Student & parent portal','Private linked-child access']];
NAV.unshift({group:'Teaching & learning',items:learningPages});
learningPages.forEach(i=>PAGES[i[0]]={icon:i[1],label:i[2],sub:i[3]});
const originalApply=PW.applyStore.bind(PW);PW.applyStore=next=>{LP.reset();originalApply(next);};

RENDER.dashboard=()=>{
 const p=LP.data(),all=Object.keys(CLASSES),todayDate=LP.today(),day=p.attendance[todayDate]||{};
 view.innerHTML=`<section class="party-banner"><span class="party-mascot" aria-hidden="true">🌤️</span><div><small>Your teaching day</small><h2>Ready for a little discovery?</h2><p>${esc(todayDate)} · ${PW.online?'Shared school workspace':'Saved on this device'}</p></div></section><div class="portal-stats"><div><b>${all.length}</b><span>Classes</span></div><div><b>${all.reduce((n,c)=>n+students(c).length,0)}</b><span>Students</span></div><div><b>${p.lessons.filter(l=>l.published).length}</b><span>Published materials</span></div><div><b>${Object.values(day).reduce((n,c)=>n+Object.keys(c).length,0)}</b><span>Attendance recorded today</span></div></div><section class="panel"><h2>Class ${esc(ui.cur)}</h2><div class="form">${LP.nav('lessons','📚 Prepare a lesson')}${LP.nav('attendance','📅 Take attendance')}${LP.nav('progress','📈 Review progress')}${LP.nav('teams','🏆 Play a team game')}</div><h3>Class learning</h3>${p.lessons.filter(l=>l.classId===ui.cur).slice(-5).reverse().map(l=>`<p><b>${esc(l.title)}</b> · ${esc(l.kind)} · ${l.published?'Published':'Draft'}${l.due?' · Due '+esc(l.due):''}</p>`).join('')||'<p>No materials yet. Add your first lesson or assignment.</p>'}</section><section class="panel"><h2>Class announcement</h2><form id="announcementForm" class="portal-form"><label for="announcementTitle">Title</label><input id="announcementTitle" required maxlength="120"><label for="announcementBody">Message to students and families</label><textarea id="announcementBody" required maxlength="4000" rows="3"></textarea><button class="btn go" type="submit">Post announcement</button></form>${p.announcements.filter(a=>a.classId===ui.cur).slice(-5).reverse().map(a=>`<article class="lesson-item"><h3>${esc(a.title)}</h3><p class="portal-text">${esc(a.body)}</p><small>${esc(a.date)}</small></article>`).join('')}</section>`;
};
RENDER.lessons=()=>{
 const p=LP.data(),current=p.lessons.find(l=>l.id===LP.lessonView&&l.classId===ui.cur);
 if(current){view.innerHTML=`<section class="panel lecture-view">${LP.button('back-lessons','← All materials')}<h2>${esc(current.title)}</h2><p class="portal-text">${esc(current.body)}</p>${current.url?`<a class="btn go" href="${esc(current.url)}" target="_blank" rel="noopener noreferrer">Open teaching resource ↗</a>`:''}${current.questions.map((q,i)=>`<article class="lesson-item"><h3>${i+1}. ${esc(q.prompt)}</h3><ol>${q.choices.map(c=>`<li>${esc(c)}</li>`).join('')}</ol>${LP.button('reveal-answer','Show answer',`data-index="${i}"`)}<p id="quizAnswer${i}" hidden>Answer: ${q.answer+1}. ${esc(q.choices[q.answer])}</p></article>`).join('')}</section>`;return;}
 view.innerHTML=`<section class="panel"><h2>Materials for class ${esc(ui.cur)}</h2><p>Use lecture notes, a resource link, written assignments, or quizzes. Your existing teams, lucky pick and mystery boxes are ready under Play.</p>${p.lessons.filter(l=>l.classId===ui.cur).slice().reverse().map(l=>LP.lessonCard(l)).join('')||'<p>No lessons yet. Prepare one below.</p>'}</section>${LP.lessonForm()}`;
};
RENDER.attendance=()=>{
 const p=LP.data(),date=LP.attendanceDate||LP.today(),day=p.attendance[date]?.[ui.cur]||{};
 view.innerHTML=`<section class="panel"><h2>Daily attendance · Class ${esc(ui.cur)}</h2><div class="form"><label for="attendanceDate">Date</label><input id="attendanceDate" type="date" value="${date}">${LP.button('all-present','Mark everyone present')}</div><p class="note">Unmarked seats stay unrecorded. Daily attendance is separate from the temporary absent toggle on the point board.</p><div class="tablewrap"><table><thead><tr><th>Seat</th><th>Student</th><th>Attendance</th></tr></thead><tbody>${students(ui.cur).map(s=>`<tr><td>${s.seat}</td><td>${esc(s.name)}</td><td><select data-attendance="${s.seat}" aria-label="Attendance for seat ${s.seat}"><option value="">Not recorded</option>${['present','absent','late','excused'].map(v=>`<option value="${v}" ${day[s.seat]===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div></section>`;
};
RENDER.gradebook=()=>{
 const p=LP.data(),list=p.assessments.filter(a=>a.classId===ui.cur),a=list.find(a=>a.id===LP.assessment)||list.at(-1);
 view.innerHTML=`<section class="panel"><h2>Class assessments</h2><form id="assessmentForm" class="portal-form"><div class="portal-columns"><div><label for="assessmentTitle">Assessment title</label><input id="assessmentTitle" required maxlength="120" placeholder="e.g. Reading Unit 1"></div><div><label for="assessmentMaximum">Maximum score</label><input id="assessmentMaximum" type="number" min="1" max="10000" value="100" required></div><div><label for="assessmentDate">Assessment date</label><input id="assessmentDate" type="date" value="${LP.today()}"></div></div><button class="btn go" type="submit">Add assessment</button></form>${a?`<label for="assessmentSelect">Assessment</label><select id="assessmentSelect">${list.map(x=>`<option value="${esc(x.id)}" ${x.id===a.id?'selected':''}>${esc(x.title)} · /${x.maximum}</option>`).join('')}</select><p class="note">Blank means not graded. Zero is included in the average. Scores save as you leave each field.</p><div class="tablewrap"><table><thead><tr><th>Seat</th><th>Student</th><th>Score / ${a.maximum}</th><th>Feedback</th></tr></thead><tbody>${students(ui.cur).map(s=>{const g=p.scores[a.id]?.[s.seat];return `<tr><td>${s.seat}</td><td>${esc(s.name)}</td><td><input class="score-input" data-grade="${esc(a.id)}" data-seat="${s.seat}" type="number" min="0" max="${a.maximum}" step="0.01" value="${g?.score??''}" aria-label="Score for seat ${s.seat}"></td><td><input data-feedback="${esc(a.id)}" data-seat="${s.seat}" maxlength="1000" value="${esc(g?.feedback||'')}" aria-label="Feedback for seat ${s.seat}"></td></tr>`;}).join('')}</tbody></table></div>`:'<p>No assessments yet.</p>'}</section><section class="panel"><h2>Submitted student work</h2>${PW.online?`${LP.button('load-teacher','Refresh submissions')}${LP.submissions.filter(s=>s.class_id===ui.cur).map(s=>`<article class="lesson-item"><h3>${esc(CLASSES[ui.cur]?.names[s.seat-1]||'Seat '+s.seat)} · ${esc(p.lessons.find(l=>l.id===s.lesson_id)?.title||'Material')}</h3><p class="portal-text">${esc(s.body||'Quiz attempt')}</p><p>${esc(s.score??'Not graded')} / ${esc(s.maximum??'—')}</p><div class="work-review form"><input name="score" type="number" min="0" max="10000" step="0.01" required value="${s.score??''}" aria-label="Submission score"><input name="maximum" type="number" min="1" max="10000" required value="${s.maximum??100}" aria-label="Submission maximum"><input name="feedback" maxlength="1000" value="${esc(s.feedback)}" aria-label="Submission feedback">${LP.button('review-work','Save feedback',`data-id="${s.id}"`)}</div></article>`).join('')||'<p>Refresh to load work for this class.</p>'}`:'<p>Student submissions are available after you connect online accounts and invite students.</p>'}</section>`;
};
RENDER.progress=()=>{
 const p=LP.data(),arr=students(ui.cur),s=arr.find(s=>s.seat===LP.progressSeat)||arr[0];
 view.innerHTML=`<section class="panel"><h2>Class ${esc(ui.cur)} progress</h2><p class="note">Assessment average = points earned ÷ possible points for graded assessments. Classroom reward points are separate.</p>${LP.button('export-progress','Download progress CSV')}<div class="tablewrap"><table><thead><tr><th>Seat</th><th>Student</th><th>Reward points</th><th>Assessment average</th><th>Present / recorded days</th><th>Absent</th><th>Late</th></tr></thead><tbody>${arr.map(s=>{const r=PortalCore.progress(p,ui.cur,s.seat);return `<tr><td>${s.seat}</td><td>${esc(s.name)}</td><td>${C().pts[s.seat]||0}</td><td>${r.grades.percentage===null?'Not graded':r.grades.percentage+'%'}</td><td>${r.attendance.present} / ${r.attendance.total}</td><td>${r.attendance.absent}</td><td>${r.attendance.late}</td></tr>`;}).join('')}</tbody></table></div></section>${s?`<section class="panel"><h2>Student detail</h2><label for="progressSeat">Student</label><select id="progressSeat">${arr.map(x=>`<option value="${x.seat}" ${x.seat===s.seat?'selected':''}>${x.seat} ${esc(x.name)}</option>`).join('')}</select><h3>Assessments and feedback</h3>${p.assessments.filter(a=>a.classId===ui.cur).map(a=>{const g=p.scores[a.id]?.[s.seat];return `<p><b>${esc(a.title)}</b> · ${g?.score??'Not graded'} / ${a.maximum}${g?.feedback?`<br>${esc(g.feedback)}`:''}</p>`;}).join('')||'<p>No assessments recorded.</p>'}<h3>Points and game history</h3>${(C().log[s.seat]||[]).map(l=>`<p>${esc(l.d)} · ${esc(l.g)} · ${esc(l.p)} points</p>`).join('')||'<p>No point records yet.</p>'}</section>`:''}`;
};
RENDER.family=()=>{
 let content='';
 if(!PW.online)content=`<h2>Students and parents</h2><p>Sign in with the email your teacher linked to your seat. Parents see their own child's learning; students can submit assignments and quizzes.</p>${LP.nav('account','Sign in with email')}<p class="note">${PW.configured()?'Ask your teacher for an access invitation.':'Online sharing is awaiting school service setup. Your teacher can continue preparing lessons on this device.'}</p>`;
 else{
  content=`<h2>My linked students</h2><p>Signed in as ${esc(PW.user.email)}</p><label for="familySelect">Linked student</label><select id="familySelect"><option value="">Choose a linked student</option>${PW.familyLinks.map(l=>`<option value="${l.id}" ${LP.family?.id===l.id?'selected':''}>Class ${esc(l.class_id)} · Seat ${l.seat} · ${esc(l.kind)}</option>`).join('')}</select>${LP.button('refresh-family','Refresh access')}<p role="status">${esc(LP.familyStatus)}</p>`;
  if(!PW.familyLinks.length)content+='<p>No linked students yet. Ask your school administrator for a private account linked to the correct child.</p>';
  if(LP.family){const f=LP.family;content+=`<h2>${esc(f.name)} · Class ${esc(f.classId)}</h2><p>${esc(f.school)} · ${esc(f.kind)} access</p><div class="portal-stats"><div><b>${esc(f.points)}</b><span>Reward points</span></div><div><b>${f.attendance.filter(d=>d.status==='present').length} / ${f.attendance.length}</b><span>Present / recorded days</span></div><div><b>${f.submissions.length}</b><span>Submitted work</span></div></div><h3>Class announcements</h3>${f.announcements.map(a=>`<article class="lesson-item"><h3>${esc(a.title)}</h3><p class="portal-text">${esc(a.body)}</p></article>`).join('')||'<p>No announcements.</p>'}<h3>Assessments</h3>${f.assessments.map(a=>`<p><b>${esc(a.title)}</b> · ${esc(a.grade?.score??'Not graded')} / ${esc(a.maximum)}${a.grade?.feedback?'<br>'+esc(a.grade.feedback):''}</p>`).join('')||'<p>No assessments yet.</p>'}<h3>Lessons and assignments</h3>${f.lessons.map(l=>LP.lessonCard(l,true)).join('')||'<p>Your teacher has not published materials yet.</p>'}<details><summary>Points and game history</summary>${(f.history||[]).map(l=>`<p>${esc(l.d||'')} ? ${esc(l.g||'Class activity')} ? ${esc(l.p)} points</p>`).join('')||'<p>No point records yet.</p>'}</details><details><summary>Attendance history</summary>${f.attendance.map(d=>`<p>${esc(d.date)} · ${esc(d.status)}</p>`).join('')}</details>`;}
  if(PW.school)content+=`<hr><h2>Invite students and parents · Class ${esc(ui.cur)}</h2><p>A linked email grants access only to the selected seat. Share the invitation instructions yourself; access invitations do not send email.</p><div class="portal-form"><label for="familySeat">Student</label><select id="familySeat">${students(ui.cur).map(s=>`<option value="${s.seat}">${s.seat} ${esc(s.name)}</option>`).join('')}</select><label for="familyKind">Access</label><select id="familyKind"><option value="parent">Parent (view only)</option><option value="student">Student (view and submit)</option></select><label for="familyEmail">Invited email</label><input id="familyEmail" type="email" required maxlength="254">${LP.button('invite-family','Create access invitation')}${LP.button('load-teacher','Refresh linked access')}</div>${LP.links.filter(l=>l.class_id===ui.cur).map(l=>`<p>Seat ${l.seat} · ${esc(l.email)} · ${esc(l.kind)} · ${l.active?'Active':'Revoked'} ${l.active?LP.button('revoke-family','Revoke access',`data-id="${l.id}"`):''}</p>`).join('')}`;
 }
 if(PW.online&&PW.admin&&PW.school&&PW.accountSetupReady)content+=`<hr><h2>Create a parent or student account</h2><p>Select the correct child. Share the username and temporary password privately. Parents view their own child; students can submit work. First sign-in requires a new password.</p><form id="createFamilyAccountForm" class="portal-form"><label for="portalChild">Child in class ${esc(ui.cur)}</label><select id="portalChild" required>${students(ui.cur).map(s=>`<option value="${s.seat}">${s.seat} ${esc(s.name)}</option>`).join('')}</select><label for="portalKind">Account type</label><select id="portalKind"><option value="parent">Parent - view only</option><option value="student">Student - view and submit</option></select><label for="portalUsername">Username</label><input id="portalUsername" required pattern="[a-z][a-z0-9._-]{2,31}" maxlength="32" autocomplete="off"><label for="portalPassword">Temporary password</label><input id="portalPassword" type="password" required minlength="12" maxlength="128" autocomplete="new-password"><button class="btn go" type="submit">Create private account</button><p id="portalAccountMessage" role="status"></p></form>`;
 if(PW.online)content+=`<section class="family-qr"><img src="assets/family-portal.svg" width="180" height="180" alt="QR code for ClassGrove parent and student sign-in"><div><h3>Family sign-in QR</h3><p>Scan to open the portal. Sign-in is required. This QR contains no student information or password.</p><a class="btn" href="assets/family-portal.svg" download="ClassGrove-family-signin.svg">Download QR</a><a class="btn" href="https://shafiphysika.github.io/point-party/#family" target="_blank" rel="noopener">Open family sign-in</a></div></section>`;
 view.innerHTML=`<section class="panel">${content}</section>`;
};

const originalAccount=RENDER.account;
RENDER.account=()=>{
 originalAccount();
 const emailLabel=$('label[for=loginEmail]');if(emailLabel)emailLabel.textContent='Your email';
 const panel=view.querySelector('.panel');
 if(!PW.configured())panel.insertAdjacentHTML('beforeend',`<div class="service-status"><h3>Connect the school service</h3><p>Email sign-in needs a connected school database and email provider. The public project URL and key have not been configured.</p><p>Intended administrator: <b>${esc(window.POINT_PARTY_CONFIG.adminEmail)}</b>. Admin access is granted only after email verification against the database.</p><p>You can prepare lessons, record attendance, run classroom games and use progress reports on this device now.</p>${LP.nav('dashboard','Open teaching workspace')}</div>`);
 else if(!PW.client)panel.insertAdjacentHTML('beforeend','<p role="status">Connecting to the email service… Reload if this message persists.</p>');
 if(PW.online)panel.insertAdjacentHTML('beforeend',`<div class="form">${LP.nav('family','👨‍👩‍👧 Student & parent portal')}${PW.school?LP.nav('dashboard','🏠 Teaching overview'):''}</div>`);
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-portal]');if(!b)return;e.preventDefault();b.disabled=true;
 LP.action(b).catch(error=>toast(PortalCore.authError(error))).finally(()=>b.disabled=false);
});
document.addEventListener('submit',async e=>{
 const form=e.target;
 if(!['lessonForm','assessmentForm','announcementForm'].includes(form.id)&&!form.matches('.portal-submit'))return;
 e.preventDefault();const submit=form.querySelector('[type=submit]');submit.disabled=true;
 try{
  if(form.matches('.portal-submit')){
   if(!PW.online||LP.family?.kind!=='student')throw new Error('STUDENT_REQUIRED');
   const f=LP.family,l=f.lessons.find(l=>l.id===form.dataset.lesson),answers=l.kind==='quiz'?l.questions.map((_,i)=>Number(new FormData(form).get('q'+i))):[];
   await PW.rpc('pp_submit_work',{p_link:f.id,p_lesson:l.id,p_body:new FormData(form).get('body')||'',p_answers:answers});await LP.loadFamily(f.id);toast('Work submitted.');return;
  }
  if(!LP.writable())throw new Error('SCHOOL_ACCESS_REQUIRED');if(!PW.can('activities'))throw new Error('PERMISSION_ACTIVITIES_REQUIRED');const p=LP.data();
  if(form.id==='lessonForm'){
   const url=$('#lessonUrl').value.trim();if(url&&!PortalCore.safeUrl(url)){toast('Use a valid HTTPS resource link.');return;}
   const kind=$('#lessonKind').value,questions=kind==='quiz'?PortalCore.parseQuiz($('#lessonQuestions').value):[];
   const old=p.lessons.find(l=>l.id===LP.editLesson),l={id:old?.id||crypto.randomUUID(),classId:ui.cur,title:$('#lessonTitle').value.trim(),subject:$('#lessonSubject').value.trim(),body:$('#lessonBody').value,url,kind,due:$('#lessonDue').value,published:$('#lessonPublished').checked,questions};
   if(!l.title)throw new Error('INVALID_TITLE');if(old)Object.assign(old,l);else{if(p.lessons.length>=200){toast('Material limit reached. Export a backup before reorganizing.');return;}p.lessons.push(l);}LP.editLesson=null;save();RENDER.lessons();toast('Material saved.');
  }
  if(form.id==='assessmentForm'){if(p.assessments.length>=200){toast('Assessment limit reached. Export a backup before reorganizing.');return;}const title=$('#assessmentTitle').value.trim();if(!title)throw new Error('INVALID_TITLE');const a={id:crypto.randomUUID(),classId:ui.cur,title,maximum:Number($('#assessmentMaximum').value),date:$('#assessmentDate').value};p.assessments.push(a);LP.assessment=a.id;save();RENDER.gradebook();toast('Assessment added.');}
  if(form.id==='announcementForm'){if(p.announcements.length>=100){toast('Announcement limit reached. Export a backup before reorganizing.');return;}const title=$('#announcementTitle').value.trim(),body=$('#announcementBody').value.trim();if(!title||!body)throw new Error('INVALID_ANNOUNCEMENT');p.announcements.push({id:crypto.randomUUID(),classId:ui.cur,title,body,date:LP.today()});save();RENDER.dashboard();toast('Announcement posted.');}
 }catch(error){toast(form.id==='lessonForm'?error.message:PortalCore.authError(error));}finally{submit.disabled=false;}
});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='familySelect'){if(t.value)LP.loadFamily(t.value);else{LP.clearFamily();RENDER.family();}return;}
 if(t.id==='attendanceDate'){LP.attendanceDate=t.value;RENDER.attendance();return;}
 if(t.id==='assessmentSelect'){LP.assessment=t.value;RENDER.gradebook();return;}
 if(t.id==='progressSeat'){LP.progressSeat=Number(t.value);RENDER.progress();return;}
 if(t.id==='schoolSelect'){LP.clearFamily();LP.reset();}
 if(!(t.dataset.attendance||t.dataset.grade||t.dataset.feedback))return;
 if(!LP.writable()){toast('Open an approved school first.');return;}if(!PW.can(t.dataset.attendance?'roster':'activities')){toast('Ask your administrator to enable this permission.');return;}const p=LP.data();
 if(t.dataset.attendance){const d=LP.attendanceDate||LP.today(),day=((p.attendance[d]??={})[ui.cur]??={});if(t.value)day[t.dataset.attendance]=t.value;else delete day[t.dataset.attendance];}
 if(t.dataset.grade||t.dataset.feedback){if(!t.reportValidity())return;const id=t.dataset.grade||t.dataset.feedback,s=t.dataset.seat,g=((p.scores[id]??={})[s]??={score:null,feedback:''});if(t.dataset.grade)g.score=t.value===''?null:Number(t.value);else g.feedback=t.value;}
 save();
});

document.addEventListener('submit',async e=>{
 if(e.target.id!=='createFamilyAccountForm')return;
 e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]'),message=$('#portalAccountMessage');button.disabled=true;
 try{
  if(!PW.online||!PW.admin||!PW.accountSetupReady||!PW.school)throw new Error('ADMIN_REQUIRED');
  if(PW.dirty){await PW.flush();if(PW.dirty)throw new Error('SCHOOL_CONFLICT');}
  const password=$('#portalPassword').value;
  if(password.length<12||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))throw new Error('Use at least 12 characters with a letter and a number.');
  const {data,error}=await PW.client.functions.invoke('teacher-accounts',{body:{username:$('#portalUsername').value,password,school:PW.school,kind:$('#portalKind').value,classId:String(ui.cur),seat:Number($('#portalChild').value)}});
  if(error||data?.error)throw new Error('Family account could not be created. Check the account service and selected child.');
  form.reset();message.textContent='Account created for '+data.username+'. Share the temporary password privately with the intended family.';
 }catch(error){message.textContent=error.message||'Account setup failed.';}finally{button.disabled=false;}
});
