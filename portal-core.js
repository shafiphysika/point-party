(function(root){
 'use strict';
 const text=(v,max=120)=>String(v??'').slice(0,max);
 const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const entries=v=>Object.entries(object(v)).filter(([k])=>!['__proto__','constructor','prototype'].includes(k));
 const seat=s=>/^([1-9]|[1-5][0-9]|60)$/.test(String(s));
 const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(String(v))?v:'';
 const list=(v,max=200)=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object').slice(0,max):[];
 function safeUrl(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
 function clean(input){
  const v=object(input);
  const lessons=list(v.lessons).map(x=>({id:text(x.id,80),classId:text(x.classId,40),title:text(x.title),subject:text(x.subject,60),body:text(x.body,8000),url:safeUrl(x.url),due:date(x.due),kind:['lesson','assignment','quiz'].includes(x.kind)?x.kind:'lesson',published:x.published===true,questions:list(x.questions,30).map(q=>({prompt:text(q.prompt,500),choices:Array.isArray(q.choices)?q.choices.slice(0,6).map(c=>text(c,200)):[],answer:Number.isInteger(q.answer)?q.answer:-1})).filter(q=>q.prompt&&q.choices.length>=2&&q.answer>=0&&q.answer<q.choices.length)})).filter(x=>x.id&&x.classId&&x.title);
  const assessments=list(v.assessments).map(x=>({id:text(x.id,80),classId:text(x.classId,40),title:text(x.title),date:date(x.date),maximum:Math.max(1,Math.min(10000,Number(x.maximum)||100)),category:text(x.category,60)})).filter(x=>x.id&&x.classId&&x.title);
  const scores=Object.fromEntries(assessments.map(a=>[a.id,Object.fromEntries(entries(object(v.scores)[a.id]).filter(([s])=>seat(s)).map(([s,g])=>[s,{score:g?.score===null||g?.score===''||g?.score===undefined||!Number.isFinite(Number(g.score))?null:Math.max(0,Math.min(a.maximum,Number(g.score))),feedback:text(g?.feedback,1000)}]))]));
  const attendance=Object.fromEntries(entries(v.attendance).filter(([d])=>date(d)).slice(-400).map(([d,classes])=>[d,Object.fromEntries(entries(classes).slice(0,200).map(([c,states])=>[text(c,40),Object.fromEntries(entries(states).filter(([s,val])=>seat(s)&&['present','absent','late','excused'].includes(val)))]))]));
  const announcements=list(v.announcements,100).map(x=>({id:text(x.id,80),classId:text(x.classId,40),title:text(x.title),body:text(x.body,4000),date:date(x.date)})).filter(x=>x.id&&x.title);
  return {lessons,assessments,scores,attendance,announcements};
 }
 function progress(portal,classId,number){
  const attendance={present:0,absent:0,late:0,excused:0,total:0};
  for(const day of Object.values(portal.attendance)){const s=day[classId]?.[number];if(s){attendance[s]++;attendance.total++;}}
  const grades={earned:0,possible:0,percentage:null,graded:0};
  for(const a of portal.assessments.filter(a=>a.classId===classId)){const g=portal.scores[a.id]?.[number];if(g?.score!==null&&g?.score!==undefined){grades.earned+=g.score;grades.possible+=a.maximum;grades.graded++;}}
  if(grades.possible)grades.percentage=Math.round(grades.earned/grades.possible*100);
  return {attendance,grades};
 }
 function parseQuiz(value){
  const lines=String(value).split(/\r?\n/).filter(s=>s.trim());
  if(!lines.length||lines.length>30)throw new Error('Add between 1 and 30 questions.');
  return lines.map((line,i)=>{const parts=line.split('|').map(s=>s.trim());if(parts.length<4||parts.length>8||parts.some(s=>!s))throw new Error('Question '+(i+1)+': use the shown format.');const answer=Number(parts.pop())-1,prompt=parts.shift();if(!Number.isInteger(answer)||answer<0||answer>=parts.length)throw new Error('Question '+(i+1)+': answer number is outside the choices.');return {prompt,choices:parts,answer};});
 }
 function authError(error){
  const code=error?.code||'',message=String(error?.message||'');
  if(/rate_limit|over_email_send|over_request/.test(code)||/rate limit/i.test(message))return 'Please wait before requesting another email code. Check your inbox and spam folder.';
  if(/email_address_not_authorized|email_send|smtp/i.test(code+' '+message))return 'Email delivery is not configured for this address. The administrator needs to connect the school email service.';
  if(/otp_expired|otp_disabled/.test(code))return 'This code has expired or is invalid. Request a new code and enter the most recent one.';
  if(/CLASS_ACCESS_REQUIRED/.test(message))return 'This class is outside your assignment. Reload the school and choose one of your allowed classes.';
  if(/CLASS_SCOPE_INVITE_REQUIRED/.test(message))return 'Ask the administrator to invite teachers. You can invite families only for your assigned classes.';
  if(/PERMISSION_/.test(message))return 'Your administrator has not enabled this tool for your school. Open My account to review your permissions.';
  if(/PGRST202|PGRST204|PGRST205|42P01|42703/.test(code)||/does not exist|schema cache/i.test(message))return 'The school database setup is incomplete. Ask the administrator to apply the school migrations, then refresh approvals.';
  if(/VERIFIED_EMAIL_REQUIRED/.test(message))return 'Verify your email with the latest sign-in link or code before opening your school.';
  if(/signup_disabled|email_provider_disabled/.test(code))return 'Email sign-in is disabled in the school service. The administrator needs to enable it.';
  if(/bad_jwt|session_not_found|refresh_token_not_found|refresh_token_already_used/.test(code))return 'Your sign-in session has expired. Request a new sign-in email.';
  if(/INVALID|invalid/i.test(code+' '+message))return 'Check the email, code, or form fields and try again.';
  if(/CONFLICT/.test(message))return 'Another teacher saved first. Download your changes before reloading the school.';
  if(/ROSTER_LINKED/.test(message))return 'Revoke linked family access before changing a linked student name or seat.';
  if(/WORK_ALREADY_REVIEWED/.test(message))return 'This work has already been graded. Ask your teacher about another attempt.';
  if(/ACCESS|ADMIN_REQUIRED|LINK_REQUIRED|STUDENT_REQUIRED/.test(message))return 'Your account does not have access to this action. Ask your teacher or administrator.';
  return 'Could not connect to the school service. Check your connection and try again.';
 }
 const api={clean,progress,parseQuiz,safeUrl,authError};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PortalCore=api;
})(typeof window==='undefined'?globalThis:window);
