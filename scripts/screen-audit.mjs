import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

// Isolated browser QA: all API traffic is intercepted. No real backend writes.
const root=process.cwd();
const output=path.join(root,'.qa');fs.mkdirSync(output,{recursive:true});
const mobile=process.argv.includes('--mobile');
const reportPath=path.join(output,process.argv.some(x=>x.startsWith('--focus='))?'screen-audit-focused.json':mobile?'screen-audit-mobile.json':'screen-audit.json');
const browser=process.env.FALE_QA_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=mobile?19980:19979, origin=`http://127.0.0.1:${port}`;
const dist=path.join(root,'dist');
const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp4':'video/mp4','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{
  const requested=decodeURIComponent(new URL(req.url,origin).pathname);
  const target=path.resolve(dist,'.'+requested);
  if(!target.startsWith(dist+path.sep)&&target!==dist){res.writeHead(403);res.end();return;}
  const file=fs.existsSync(target)&&fs.statSync(target).isFile()?target:path.join(dist,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
const profile=path.join(output,'chrome-'+Date.now());
const processHandle=spawn(browser,['--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-features=Translate','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
const websocket=await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(new Error('Chrome did not start')),30000);
  processHandle.stderr.on('data',chunk=>{const match=String(chunk).match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});
  processHandle.on('error',reject);
});
class CDP {
  constructor(url){this.ws=new WebSocket(url);this.id=0;this.pending=new Map();this.listeners=new Map();this.ready=new Promise(resolve=>this.ws.addEventListener('open',resolve));this.ws.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id){const p=this.pending.get(msg.id);if(p){this.pending.delete(msg.id);msg.error?p.reject(new Error(msg.error.message)):p.resolve(msg.result);}}else for(const fn of this.listeners.get(msg.method)||[])fn(msg.params,msg.sessionId);});}
  on(name,fn){const list=this.listeners.get(name)||[];list.push(fn);this.listeners.set(name,list);}
  async send(method,params={},sessionId){await this.ready;return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
}
const client=new CDP(websocket);
const {targetId}=await client.send('Target.createTarget',{url:'about:blank'});
const {sessionId}=await client.send('Target.attachToTarget',{targetId,flatten:true});
const send=(method,params)=>client.send(method,params,sessionId);
await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.open=()=>null;document.addEventListener('click',event=>{const link=event.target.closest?.('a');if(link&&/^(mailto:|tel:|https?:)/i.test(link.getAttribute('href')||'')&&!link.href.startsWith(location.origin)){event.preventDefault();}},true);`});
await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1366,height:mobile?844:900,deviceScaleFactor:1,mobile});
await send('Fetch.enable',{patterns:[{urlPattern:'*',requestStage:'Request'}]});

const ids={user:'11111111-1111-4111-8111-111111111111',candidate:'22222222-2222-4222-8222-222222222222',facility:'33333333-3333-4333-8333-333333333333',job:'44444444-4444-4444-8444-444444444444',shift:'55555555-5555-4555-8555-555555555555',application:'66666666-6666-4666-8666-666666666666',post:'77777777-7777-4777-8777-777777777777',course:'cme-ecg-101'};
const now=new Date().toISOString();
let current={role:'candidate',mode:'success',onboarded:true};
let errors=[],requests=[],lastActivity=0;
const candidate=()=>({id:ids.candidate,userId:ids.user,name:'QA Candidate',phone:'+910000000001',email:'qa@example.invalid',city:'Pune',state:'Maharashtra',profession:'Nurse',specialty:'Critical Care',qualification:'B.Sc Nursing',experienceYears:'2',candidateLevel:current.role==='student'?'STUDENT':'PROFESSIONAL',isStudent:current.role==='student',course:'B.Sc Nursing',college:'QA College',studyYear:'Final year',expectedGraduationYear:2027,council:'QA Council',regNumber:'QA-1234',kycStatus:'VERIFIED',status:'VERIFIED',skills:['Patient care'],languages:['English'],preferredCities:['Pune'],openToWork:true,documents:[],verifiedAt:now,createdAt:now,isMentor:false});
const facility=()=>({id:ids.facility,userId:ids.user,hospitalName:'QA Facility',facilityType:'Hospital',city:'Pune',state:'Maharashtra',beds:20,bedCapacity:20,icuBeds:2,contactPerson:'QA Recruiter',contactPhone:'+910000000002',contactEmail:'qa@example.invalid',kycStatus:'VERIFIED',status:'VERIFIED',licenseNumber:'QA-LICENSE',departments:['Critical Care'],hiringNeeds:['Nurse'],documents:[],createdAt:now});
const job=()=>({id:ids.job,facilityId:ids.facility,facilityName:'QA Facility',title:current.role==='student'?'Nursing Internship':'ICU Nurse',city:'Pune',workLocation:'Pune',department:'Critical Care',description:'QA test posting',employmentType:current.role==='student'?'Internship':'Full-time',isInternship:current.role==='student',internship:current.role==='student',openings:2,salaryMinPaise:2000000,salaryMaxPaise:3000000,experienceRequired:'1–3 years',qualificationRequired:'B.Sc Nursing',status:'OPEN',createdAt:now,postedAt:now});
const shift=()=>({id:ids.shift,facilityId:ids.facility,facilityName:'QA Facility',facilityCity:'Pune',title:'QA Nursing Shift',department:'Critical Care',city:'Pune',startAt:new Date(Date.now()+86400000).toISOString(),endAt:new Date(Date.now()+115200000).toISOString(),hours:8,ratePerHourPaise:50000,totalPayPaise:400000,openings:2,slotsClaimed:0,status:'OPEN',surgeRatePerHourPaise:0,createdAt:now,hasClaimed:false,matchScore:80});
const application=()=>({id:ids.application,jobId:ids.job,candidateId:ids.candidate,candidateName:'QA Candidate',candidateRole:'Nurse',candidateCity:'Pune',candidateQualification:'B.Sc Nursing',candidateExperience:'2',candidateCouncil:'QA Council',candidateEmail:'qa@example.invalid',candidatePhone:'+910000000001',jobTitle:'ICU Nurse',facilityName:'QA Facility',hospitalName:'QA Facility',city:'Pune',status:'SHORTLISTED',appliedAt:now,createdAt:now,councilVerified:true,regNumber:'QA-1234',skills:['Patient care'],matchScore:80,department:'Critical Care'});
const course=()=>({id:ids.course,title:'Clinical Learning QA',category:'Critical Care',duration:'2 hours',cmePoints:0,summary:'QA learning record',progressPercent:0,enrolled:false,completed:false});
const post=()=>({id:ids.post,authorId:ids.user,authorName:'QA Candidate',authorRole:'Nurse',title:'QA Community Discussion',body:'Clinical learning discussion for testing.',type:'Thought',field:'Nursing',status:'LIVE',upvotes:0,commentsCount:0,commentCount:0,flagCount:0,isAnonymous:false,isPinned:false,createdAt:now});
function fixture(pathname,method,body){
  if(pathname==='/auth/refresh'||pathname==='/auth/me'){
    if(current.role==='guest')return {status:401,data:null};
    const role=current.role==='facility'?'ROLE_FACILITY':current.role==='admin'?'ROLE_ADMIN':'ROLE_CANDIDATE';
    const user={id:ids.user,phone:'+910000000001',email:'qa@example.invalid',role,candidateLevel:current.role==='student'?'STUDENT':'PROFESSIONAL',onboarded:current.onboarded,status:'ACTIVE',active:true};
    return {data:pathname==='/auth/me'?user:{accessToken:'qa-browser-token',role,candidateLevel:user.candidateLevel,onboarded:current.onboarded,user}};
  }
  if(current.mode==='failure')return {status:503,data:null};
  const empty=current.mode==='empty';
  const list=item=>({data:empty?[]:[item]});
  if(pathname==='/ai/status')return {data:{available:false,provider:'none',providers:[]}};
  if(pathname==='/ai/execute'){
    const task=body?.task||'review';
    const assessment='Review based on supplied details. Source verification and a human decision are required.';
    const structuredData={status:task==='huddle_moderate'?'SAFE':'REVIEW_REQUIRED',assessment,summary:assessment,rationale:assessment,licenseAssessment:assessment,infraAssessment:assessment,wageAssessment:assessment,hoursAssessment:assessment,unitFitAssessment:assessment,councilAssessment:assessment,recommendation:'Check source records before acting.',confidence:null,suitabilityScore:null,isVerified:false,isCompliant:false,isRecommended:false,isApproved:task==='huddle_moderate',humanReviewRequired:true,whatsappDraft:'Thank you for contacting support. We will review the details you supplied.',ticketSummary:'QA support inquiry'};
    return {data:{success:true,task,provider:'qa-fixture',response:assessment,structuredData}};
  }
  if(pathname.startsWith('/ai/'))return pathname.includes('history')?{data:[]}:{status:503,data:null};
  if(pathname.includes('view-stats'))return {data:{totalViews:0,viewsToday:0,hospitalsViewedToday:0,weeklyGrowthPercent:0,hasIncreased:false}};
  if(pathname.includes('profile')&&!pathname.includes('admin/kyc'))return {data:pathname.includes('facility')?facility():candidate()};
  if(pathname.endsWith('/payout-method')||pathname.endsWith('/bank-account'))return {data:null};
  if(pathname.endsWith('/shift-policy'))return {data:{hasLinkedBank:false,kycVerified:true,firstShiftApprovalRequired:true,firstShiftFeeWaived:true,platformFeePercent:5,availableBalancePaise:0}};
  if(pathname.includes('mentor')&&pathname.includes('status'))return {data:{status:'NOT_APPLIED',verified:false}};
  if(pathname.includes('/wallet/transactions'))return {data:[]};
  if(pathname.endsWith('/wallet'))return {data:{id:ids.facility,facilityId:ids.facility,availableBalancePaise:0,lockedEscrowBalancePaise:0,totalDisbursedPaise:0,candidateCredits:0}};
  if(pathname==='/jobs'||pathname.endsWith('/facility/jobs'))return list(job());
  if(pathname===`/jobs/${ids.job}`)return empty?{status:404,data:null}:{data:job()};
  if(pathname.includes('/applications'))return list(application());
  if(pathname.includes('/claims')||pathname.includes('/earnings')||pathname.includes('/payouts'))return {data:[]};
  if(pathname==='/shifts'||pathname.includes('/shifts/facility')||pathname.includes('/employer/shifts')||pathname==='/admin/shifts')return list(shift());
  if(pathname==='/courses')return list(course());
  if(pathname==='/notifications')return {data:[]};
  if(pathname.startsWith('/verifications/'))return {data:{verificationId:ids.candidate,entityType:'CANDIDATE',maskedName:'QA Candidate',verified:true,accreditationText:'QA test record'}};
  if(pathname.includes('/huddle/posts')||pathname.includes('/huddle/flagged')||pathname.includes('/huddle/cases'))return pathname.includes('comments')?{data:[]}:list(post());
  if(pathname.includes('/huddle/questions')||pathname.includes('/huddle/sessions')||pathname.includes('/mentors'))return {data:[]};
  if(pathname==='/admin/dashboard')return {data:{pendingCandidateKycCount:empty?0:1,pendingFacilityKycCount:empty?0:1,pendingPostingsCount:empty?0:1,pendingApplicationsCount:empty?0:1,pendingShiftPayoutsCount:0,flaggedHuddlePostsCount:0,studentUpgradeRequestsCount:0,totalCandidatesCount:empty?0:1,totalFacilitiesCount:empty?0:1,totalPostingsCount:empty?0:1,totalApplicationsCount:empty?0:1,verifiedCandidatesCount:0,verifiedFacilitiesCount:0,activePostingsCount:0,shortlistedApplicationsCount:0,slaTurnaroundHours:0,slaOnTimePercentage:0,cadreBreakdown:{}}};
  if(pathname.includes('/kyc/candidates'))return list(candidate());
  if(pathname.includes('/kyc/facilities'))return list(facility());
  if(pathname==='/admin/postings')return list(job());
  if(pathname==='/employer/candidates')return list({...candidate(),candidateId:ids.candidate,verified:true,contactUnlocked:false,isContactUnlocked:false,matchScore:80,phoneMasked:'Hidden',emailMasked:'Hidden'});
  if(pathname.includes('/documents')||pathname.includes('/audit-logs')||pathname.includes('upgrade-requests'))return {data:[]};
  if(pathname.includes('/support'))return {data:[]};
  return {data:method==='GET'?[]:{id:ids.post,status:'PENDING'}};
}
client.on('Runtime.exceptionThrown',event=>{errors.push(event.exceptionDetails.exception?.description||event.exceptionDetails.text);});
client.on('Log.entryAdded',event=>{if(event.entry.level==='error'&&event.entry.source!=='network')errors.push(event.entry.text);});
client.on('Fetch.requestPaused',async event=>{
  const url=new URL(event.request.url);lastActivity=Date.now();
  try{
    const isApi=url.pathname.includes('/api/v1/');
    if(isApi){
      const pathname=url.pathname.slice(url.pathname.indexOf('/api/v1')+7);
      requests.push({path:pathname,method:event.request.method});
      let body;try{body=JSON.parse(event.request.postData||'null');}catch{}
      const result=fixture(pathname,event.request.method,body);
      const status=event.request.method==='OPTIONS'?204:result.status||200;
      const payload={success:status<400,data:result.data,message:status===503?'QA controlled service outage':status===404?'Not found':'QA response'};
      await send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:status,responseHeaders:[{name:'Content-Type',value:'application/json'},{name:'Access-Control-Allow-Origin',value:origin},{name:'Access-Control-Allow-Credentials',value:'true'},{name:'Access-Control-Allow-Headers',value:'authorization,content-type,idempotency-key'},{name:'Access-Control-Allow-Methods',value:'GET,POST,PUT,PATCH,DELETE,OPTIONS'}],body:status===204?'':Buffer.from(JSON.stringify(payload)).toString('base64')});
    }else if(url.origin===origin||['data:','blob:'].includes(url.protocol))await send('Fetch.continueRequest',{requestId:event.requestId});
    else await send('Fetch.fulfillRequest',{requestId:event.requestId,responseCode:204,body:''});
  }catch(error){errors.push('QA interception: '+error.message);}
});
const evaluate=async expression=>{
 const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw new Error(result.exceptionDetails.text+': '+result.exceptionDetails.exception?.description);
 return result.result.value;
};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function settle(){
 const start=Date.now();let previous='';let same=0;
 while(Date.now()-start<10000){
   await delay(150);
   const state=await evaluate(`JSON.stringify({url:location.pathname,text:document.body?.innerText?.slice(0,3000)||'',spinner:document.querySelectorAll('.animate-spin').length,ready:document.readyState})`).catch(()=>null);
   const details=state?JSON.parse(state):null;
   const ready=details?.ready==='complete'&&details.text.trim().length>10&&details.spinner===0;
   if(ready&&state===previous&&Date.now()-lastActivity>400)same++;else same=0;
   previous=state;if(same>=3)break;
 }
}
const publicRoutes=['/','/landing','/login','/verify','/verify?id='+ids.candidate,'/privacy','/terms','/admin/login'];
const candidateRoutes=['/home','/jobs','/jobs/'+ids.job,'/applications','/shifts','/earnings','/profile','/learning','/learning/'+ids.course,'/huddle','/notifications','/support'];
const facilityRoutes=['/employer','/employer/post','/employer/post-shift','/employer/postings','/employer/applicants','/employer/candidates','/employer/wallet','/employer/profile'];
const adminRoutes=['/admin','/admin/candidates','/admin/facilities','/admin/postings','/admin/applications','/admin/huddle','/admin/support'];
const cases=[...publicRoutes.map(route=>({route,role:'guest'})),...candidateRoutes.map(route=>({route,role:'candidate'})),...candidateRoutes.map(route=>({route,role:'student'})),...facilityRoutes.map(route=>({route,role:'facility'})),...adminRoutes.map(route=>({route,role:'admin'})),...['candidate','student','facility'].map(role=>({route:'/onboarding?role='+ (role==='facility'?'employer':'candidate'),role,onboarded:false}))];
const results=[];
const modes=mobile?['success']:(process.env.FALE_QA_MODES||'success,empty,failure').split(',');
const focus=process.argv.find(value=>value.startsWith('--focus='))?.slice(8);
try{
 for(const item of cases.filter(item=>!focus||item.route.startsWith(focus))){for(const mode of modes){
   current={...item,mode,onboarded:item.onboarded!==false};errors=[];requests=[];lastActivity=Date.now();
   await send('Page.navigate',{url:origin+item.route});await settle();
   const snapshot=await evaluate(`({url:location.pathname+location.search,title:document.title,text:document.body.innerText,alerts:[...document.querySelectorAll('[role=alert],[data-sonner-toast]')].map(x=>x.innerText),width:innerWidth,scrollWidth:document.documentElement.scrollWidth})`);
   const crash=!snapshot.text.trim()||/Cannot read properties|is not defined/.test(snapshot.text)||(mode==='success'&&/This page didn't load|Something went wrong/.test(snapshot.text));
   const failedRequests=requests.filter(r=>r.method!=='OPTIONS'&&!r.path.startsWith('/auth/')&&!r.path.startsWith('/ai/'));
   const visibleError=/unable|unavailable|unsuccessful|could not|cannot|failed|try again|retry|didn't load|not found/i.test(snapshot.text);
   let retryRecovered=null;
   if(mode==='failure'&&failedRequests.length&&visibleError){
     current.mode='success';
     const clicked=await evaluate(`(()=>{const buttons=[...document.querySelectorAll('button')].filter(x=>/^Retry$|^Try again$/.test(x.innerText.trim())&&!x.disabled);for(const button of buttons)button.click();return buttons.length>0;})()`);
     if(clicked){await settle();retryRecovered=await evaluate(`![...document.querySelectorAll('[role=alert]')].some(x=>/could not|cannot reach|unavailable|failed/i.test(x.innerText))`);}
   }
   const result={...item,mode,url:snapshot.url,title:snapshot.title,crash,visibleError,retryRecovered,overflow:snapshot.scrollWidth>snapshot.width+2,errors:[...new Set(errors)],requests:failedRequests.map(x=>x.path),networkRequests:failedRequests,alerts:snapshot.alerts,text:snapshot.text.slice(0,1500)};
   results.push(result);fs.writeFileSync(reportPath,JSON.stringify(results,null,2));
   console.log(JSON.stringify({route:item.route,role:item.role,mode,crash,visibleError,errors:result.errors.length}));
 }}
}finally{
 fs.writeFileSync(reportPath,JSON.stringify(results,null,2));
 await client.send('Browser.close').catch(()=>{});processHandle.kill();server.close();
}

const failures=results.filter(result=>result.crash||result.errors.length||result.retryRecovered===false||result.overflow);
console.log(JSON.stringify({checks:results.length,failures:failures.length,recovered:results.filter(result=>result.retryRecovered===true).length,report:reportPath}));
if(failures.length)process.exitCode=1;
