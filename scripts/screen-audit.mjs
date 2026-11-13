import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

// Isolated browser QA: all API traffic is intercepted. No real backend writes.
const root=process.cwd();
const output=path.join(root,'.qa');fs.mkdirSync(output,{recursive:true});
const mobile=process.argv.includes('--mobile');
const attendanceAudit=process.argv.includes('--attendance');
const gstAudit=process.argv.includes('--gst');
const financeStyle=process.argv.includes('--finance-style');
const financeTheme=process.argv.includes('--finance-theme');
const pinTheme=process.argv.includes('--pin-theme');
let attendanceBody=null, attendanceDone=false;
const reportPath=path.join(output,gstAudit?(mobile?'gst-audit-mobile.json':'gst-audit.json'):attendanceAudit?'shift-attendance-audit.json':process.argv.some(x=>x.startsWith('--focus='))?(mobile?'screen-audit-focused-mobile.json':'screen-audit-focused.json'):mobile?'screen-audit-mobile.json':'screen-audit.json');
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
const processHandle=spawn(browser,[...(attendanceAudit?['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']:[]),'--headless=new','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-features=Translate','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
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
if(attendanceAudit){await client.send('Browser.grantPermissions',{origin,permissions:['geolocation']});await send('Emulation.setGeolocationOverride',{latitude:18.52,longitude:73.85,accuracy:10});}
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
  if(gstAudit&&pathname==='/shifts/facility/policy')return {data:{hasLinkedBank:true,kycVerified:true,firstShiftApprovalRequired:false,firstShiftFeeWaived:true,platformFeePercent:8,platformFeeGstPercent:18,availableBalancePaise:5000000}};
  if(gstAudit&&pathname.endsWith('/bank-account'))return {data:{id:ids.facility,facilityId:ids.facility,bankName:'QA Bank',accountNumberMasked:'****0001',accountNumberLast4:'0001',accountHolderName:'QA Facility',ifsc:'TEST0000001',accountType:'Current',status:'Verified'}};
  if(gstAudit&&pathname.includes('/wallet/transactions'))return {data:[{id:ids.application,invoiceId:'INV-GST-QA',walletId:ids.facility,type:'disbursement',title:'Shift settlement',amountPaise:-393984,balanceAfterPaise:5000000,platformFeePaise:28800,platformFeeGstPaise:5184,status:'Processing',refNumber:'GST-QA-REF',createdAt:now}]};
  if(attendanceAudit&&pathname==='/shifts/claims')return {data:[{id:ids.application,shiftId:ids.shift,candidateId:ids.candidate,status:attendanceDone?'CHECKED_IN':'CONFIRMED',grossAmountPaise:400000,platformFeePaise:0,tdsAmountPaise:4000,netAmountPaise:396000,platformFeePercent:0,payoutStatus:'IN_ESCROW',arrivalInstructions:{reportTo:'QA Supervisor',reportLocation:'Block B'}}]};
  if(attendanceAudit&&pathname.endsWith('/check-in')&&method==='POST'){
    attendanceBody=body;
    const valid=body?.method==='PIN'&&body?.pin==='123456'&&body?.latitude===18.52&&body?.longitude===73.85&&body?.selfieDataUrl?.startsWith('data:image/jpeg;base64,');
    if(!valid)return {status:400,data:null};attendanceDone=true;
    return {data:{id:ids.application,shiftId:ids.shift,status:'CHECKED_IN',attendanceRecorded:true,checkedInAt:now}};
  }

  if(pathname==='/auth/refresh'||pathname==='/auth/me'){
    if(current.role==='guest')return {status:401,data:null};
    const role=current.role==='facility'?'ROLE_FACILITY':current.role==='admin'?'ROLE_ADMIN':'ROLE_CANDIDATE';
    const user={id:ids.user,phone:'+910000000001',email:'qa@example.invalid',role,candidateLevel:current.role==='student'?'STUDENT':'PROFESSIONAL',onboarded:current.onboarded,status:'ACTIVE',active:true};
    return {data:pathname==='/auth/me'?user:{accessToken:'qa-browser-token',role,candidateLevel:user.candidateLevel,onboarded:current.onboarded,user}};
  }
  if(current.mode==='failure')return {status:503,data:null};
  const empty=current.mode==='empty';
  const list=item=>({data:empty?[]:[item]});
  if(pinTheme && pathname.includes('/applications'))return list({...application(),jobId:ids.shift,shiftId:ids.shift,jobTitle:'QA Nursing Shift',status:'CONFIRMED',checkInPin:'123456',checkInQrToken:'qa-checkin-token'});
  if(financeTheme && pathname==='/admin/finance/deposits')return {data:empty?[]:[{id:ids.application,facilityName:'QA Hospital',amountPaise:393984,utr:'QA1234567890',createdAt:now}]};
  if(financeTheme && pathname==='/admin/finance/accounts')return {data:empty?[]:[{id:ids.candidate,kind:'candidate',name:'QA Clinician',holder:'QA Clinician',destination:'UPI qa***@bank',updatedAt:now},{id:ids.facility,kind:'hospital',name:'QA Hospital',holder:'QA Hospital',destination:'QA Bank ****0001',updatedAt:now}]};
  if(financeStyle) {
    const paid={id:ids.application,shiftId:ids.shift,candidateId:ids.candidate,candidateName:'Saved Clinician',facilityName:'QA Facility',shiftTitle:'QA Nursing Shift',shiftDepartment:'Critical Care',startAt:now,hours:8,actualHours:8,status:'COMPLETED',payoutStatus:'DISBURSED',grossAmountPaise:100001,platformFeePaise:0,tdsAmountPaise:10000,netAmountPaise:90001,disbursedAt:now,payoutMethodSnapshot:'Saved Bank ****0001',payoutRegistrationNumber:'SAVED-1234',utr:'QA1234567890',payoutSlipRef:'PAY-'+ids.application};
    if(pathname==='/shifts/claims')return {data:empty?[]:[paid,{...paid,id:ids.shift,status:'CLAIMED',payoutStatus:'IN_ESCROW',shiftTitle:'Unconfirmed application'}]};
    if(pathname.startsWith('/payouts/')&&pathname.endsWith('/slip'))return {data:paid};
    if(pathname.includes('/wallet/transactions'))return {data:empty?[]:[{id:ids.application,invoiceId:'INV-2026-000001',type:'disbursement',title:'Shift settlement',amountPaise:-393984,platformFeePaise:28800,platformFeeGstPaise:5184,status:'Processing',refNumber:'SET-'+ids.application,canonicalDocument:true,createdAt:now}]};
  }
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
const modes=attendanceAudit||gstAudit?['success']:mobile?['success']:(process.env.FALE_QA_MODES||'success,empty,failure').split(',');
const focus=process.argv.find(value=>value.startsWith('--focus='))?.slice(8);
try{
 for(const item of cases.filter(item=>(!focus||focus.split(',').some(prefix=>item.route.startsWith(prefix)))&&(!attendanceAudit||(item.role==='candidate'&&item.route==='/shifts'))&&(!gstAudit||(item.role==='facility'&&['/employer/post-shift','/employer/wallet'].includes(item.route))))){for(const mode of modes){
   current={...item,mode,onboarded:item.onboarded!==false};errors=[];requests=[];lastActivity=Date.now();
   await send('Page.navigate',{url:origin+item.route});await settle();
   const dismissedConsent=await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Essential only');if(!button)return false;button.click();return true;})()`);
   if(dismissedConsent)await settle();
   if((process.argv.includes('--finance')||financeTheme) && item.route==='/admin/applications') {
     await evaluate("(()=>{const tab=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('Finance Review'));if(!tab)throw new Error('Finance Review tab missing');tab.click();})()");await settle();
   }
   if(pinTheme && mode==='success' && item.route==='/employer/applicants') {
     await evaluate("(()=>{const buttons=[...document.querySelectorAll('button')];buttons.find(x=>x.textContent.includes('Locum Shifts'))?.click();})()");await settle();
     await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>/^Confirmed/.test(x.innerText.trim()));b?.click();})()");await settle();
     await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='Show Check-in PIN / QR');if(!b)throw new Error('PIN / QR action missing: '+document.body.innerText);b.click();})()");await settle();
     const valid=await evaluate("(()=>{const d=document.querySelector('[role=dialog]');const image=d?.querySelector('img[alt=\"Booking check-in QR\"]');return !!d&&d.innerText.includes('123456')&&!!image&&image.naturalWidth>0&&!![...d.querySelectorAll('button')].find(x=>x.innerText.trim()==='Close');})()");
     if(!valid)throw new Error('Themed check-in dialog must preserve its PIN and QR');
     const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,'pin-theme-'+(mobile?'mobile':'desktop')+'.png'),Buffer.from(shot.data,'base64'));
     await evaluate("(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(x=>x.innerText.trim()==='Close');b.click();})()");await settle();
   }
   if(financeTheme && mode==='success' && item.route==='/admin/applications') {
     const capture=async name=>{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,'finance-theme-'+(mobile?'mobile':'desktop')+'-'+name+'.png'),Buffer.from(shot.data,'base64'));};
     await capture('queues');
     for(const buttonText of ['Review ownership','Review deposit']) {
       await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()===${JSON.stringify(buttonText)});if(!b)throw new Error('Review action missing');b.click();})()`);await settle();
       const guarded=await evaluate("(()=>{const d=document.querySelector('[role=dialog]');const b=[...d.querySelectorAll('button')].find(x=>x.innerText.includes('Approve review'));return !!b&&b.disabled&&!!d.querySelector('#finance-review-notes');})()");
       if(!guarded)throw new Error('Themed review must preserve evidence approval guards');
       await capture(buttonText==='Review ownership'?'ownership':'deposit');
       await evaluate("(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(x=>x.innerText.trim()==='Cancel');b.click();})()");await settle();
     }
   }
   if(financeStyle&&mode==='success'&&(item.route==='/employer/wallet'||(item.route==='/earnings'&&item.role==='candidate'))){
     const capture=async suffix=>{const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,'finance-style-'+(mobile?'mobile':'desktop')+'-'+suffix+'.png'),Buffer.from(shot.data,'base64'));};
     await capture(item.route==='/earnings'?'earnings':'wallet');
     const selector=item.route==='/earnings'?(mobile?'Advice Slip':'Slip'):'INV-2026-000001';
     const clicked=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent!==null&&x.innerText.trim()===${JSON.stringify(selector)}&&!x.disabled);if(!b)return false;b.click();return true;})()`);
     if(!clicked)throw new Error('Styled advice / statement button missing');await settle();
     const expected=item.route==='/earnings'?['900.01','100.00','Saved Bank','Saved Clinician']:['INV-2026-000001','3,600.00','Base shift amount:','Subtotal before GST:','51.84','288.00','Processing'];
     const valid=await evaluate(`(()=>{const d=document.querySelector('[role=dialog]');return !!d&&${JSON.stringify(expected)}.every(value=>d.innerText.includes(value))&&!/29AABCT|TNMC-84912|CREDITED TO NODAL/.test(d.innerText);})()`);
     if(!valid)throw new Error('Styled financial preview lost stored amounts or payment status');
     await capture(item.route==='/earnings'?'payout-advice':'hospital-statement');
     await evaluate("(()=>{const b=[...document.querySelectorAll('[role=dialog] button')].find(x=>x.innerText.trim()==='Close'||x.getAttribute('aria-label')==='Close');b?.click();})()");await settle();
   }
   if(gstAudit){
     if(item.route==='/employer/post-shift'){
       await evaluate(`(()=>{const input=document.getElementById('hourly-rate');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'300');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);await settle();
       const valid=await evaluate(`document.body.innerText.includes('51.84')&&document.body.innerText.includes('3,939.84')&&document.body.innerText.includes('Platform fee reserve (8%)')&&document.body.innerText.includes('GST on platform fee (18%)')`);
       if(!valid)throw new Error('GST quote must equal 3600 + 288 + 51.84 = 3939.84');
       await evaluate(`(()=>{const row=[...document.querySelectorAll('span')].find(x=>x.innerText.trim()==='GST on platform fee (18%):');row?.scrollIntoView({block:'center'});})()`);
       await delay(500);
       const visible=await evaluate(`(()=>{const row=[...document.querySelectorAll('span')].find(x=>x.innerText.trim()==='GST on platform fee (18%):');if(!row)return false;const r=row.getBoundingClientRect();return r.height>0&&r.top>=0&&r.bottom<=innerHeight;})()`);
       if(!visible)throw new Error('GST breakdown must be visible in the viewport');
       const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(output,mobile?'gst-quote-mobile.png':'gst-quote-desktop.png'),Buffer.from(shot.data,'base64'));
     }else{
       const opened=await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='INV-GST-QA');if(!button)return false;button.click();return true;})()`);if(!opened)throw new Error('Recorded settlement statement not available');await settle();
       const valid=await evaluate(`document.querySelector('[role=dialog]')?.innerText.includes('51.84')&&document.querySelector('[role=dialog]')?.innerText.includes('288.00')&&!document.querySelector('[role=dialog]')?.innerText.includes('29AABCT1332L1Z4')`);
       if(!valid)throw new Error('Statement must display stored fee and GST');
     }
     console.log(JSON.stringify({gstVerified:true,route:item.route}));
   }
   if(attendanceAudit){
     const click=async pattern=>{const clicked=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>new RegExp(${JSON.stringify(pattern)},'i').test(x.innerText.trim())&&!x.disabled);if(!b)return false;b.click();return true;})()`);if(!clicked)throw new Error('Button missing: '+pattern);};
     if(!await evaluate(`[...document.querySelectorAll('button')].some(x=>/Check In \(PIN\)/.test(x.innerText))`)){await click('^Applied');await settle();}
     await click('Check In');await settle();
     await evaluate(`(()=>{const input=document.querySelector('input[aria-label="Six-digit hospital PIN"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'123456');input.dispatchEvent(new Event('input',{bubbles:true}));})()`);
     for(let n=0;n<100&&!attendanceDone;n++)await delay(100);
     await settle();
     if(!attendanceDone)throw new Error('Attendance evidence was not submitted');
     console.log(JSON.stringify({attendanceSubmitted:true,method:attendanceBody.method,locationCaptured:true,selfieBytes:attendanceBody.selfieDataUrl.length}));
   }
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
   if(mode==='success'&&['/employer/postings','/employer/applicants'].includes(item.route)){
     const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
     fs.writeFileSync(path.join(output,'employer-'+item.route.split('/').pop()+(mobile?'-mobile':'-desktop')+'.png'),Buffer.from(shot.data,'base64'));
   }
   console.log(JSON.stringify({route:item.route,role:item.role,mode,crash,visibleError,errors:result.errors.length}));
 }}
}finally{
 fs.writeFileSync(reportPath,JSON.stringify(results,null,2));
 await client.send('Browser.close').catch(()=>{});processHandle.kill();server.close();
}

const failures=results.filter(result=>result.crash||result.errors.length||result.retryRecovered===false||result.overflow);
console.log(JSON.stringify({checks:results.length,failures:failures.length,recovered:results.filter(result=>result.retryRecovered===true).length,report:reportPath}));
if(failures.length)process.exitCode=1;
