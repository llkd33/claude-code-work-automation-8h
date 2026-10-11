'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {runReport}=require('../local-report/weekly-report.cjs');
const {LAB_ROOT,safePaths}=require('./paths.cjs');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const stamp=()=>new Date().toISOString();
function validateOptions({interval=5,checks=12,threshold=50000}={}){
 if(typeof interval!=='number'||!Number.isFinite(interval)||interval<0.05||interval>5)throw Error('간격은 0.05~5초여야 합니다.');
 if(!Number.isInteger(checks)||checks<1||checks>12)throw Error('검사 횟수는 1~12회여야 합니다.');
 if(interval*checks>60)throw Error('자동 실행 예산은 최대 60초입니다.');
 if(!Number.isSafeInteger(threshold)||threshold<0)throw Error('기준 금액은 0 이상의 정수여야 합니다.');
 return {interval,checks,threshold};
}
function parseArgs(args){
 const options={input:'inbox/주간비용.xlsx',output:'output/auto'};const flags=new Set();
 for(let i=0;i<args.length;i++){
  const flag=args[i];if(flags.has(flag))throw Error('옵션이 중복됩니다: '+flag);flags.add(flag);
  if(flag==='--reset-state'){options.resetState=true;continue;}
  if(!['--input','--output','--interval','--checks','--threshold'].includes(flag)||i+1>=args.length||args[i+1].startsWith('--'))throw Error('사용법: node integrations/automation/watch.cjs --input inbox/주간비용.xlsx --output output/auto --interval 5 --checks 12 --threshold 50000 [--reset-state]');
  const value=args[++i];if(['--input','--output'].includes(flag))options[flag.slice(2)]=value;
  else {if(!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value))throw Error('숫자 옵션을 확인해 주세요: '+flag);options[flag.slice(2)]=Number(value);}
 }
 return {...options,...validateOptions(options)};
}
async function atomicJson(file,value){const temporary=file+'.'+process.pid+'.tmp';try{await fs.writeFile(temporary,JSON.stringify(value,null,2)+'\n');await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true}).catch(()=>{});}}
async function readState(file,{resetState=false}={}){
 let raw;try{raw=await fs.readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}
 let state;try{state=JSON.parse(raw);if(state.version!==1||typeof state.status!=='string'||(state.lastSuccessfulInputHash!==null&&!/^[a-f0-9]{64}$/.test(state.lastSuccessfulInputHash))||!Number.isSafeInteger(state.threshold)||state.threshold<0)throw Error('invalid schema');}catch{
  if(!resetState)throw Error('watch-state.json이 깨졌습니다. 결과 파일을 확인한 뒤 --reset-state로 상태만 새로 시작해 주세요.');
 }
 if(resetState){await fs.copyFile(file,file+'.previous-'+Date.now()+'.json');return null;}
 return state;
}
async function acquireLock(file,runId){
 let handle;try{handle=await fs.open(file,'wx');}catch(e){if(e.code==='EEXIST')throw Error('이 출력 폴더를 사용하는 watch가 이미 있거나 잠금이 남아 있습니다. 기존 터미널에서 Ctrl+C로 종료하세요.');throw e;}
 try{await handle.writeFile(JSON.stringify({pid:process.pid,runId,startedAt:stamp()}));}catch(e){await handle.close();await fs.rm(file,{force:true});throw e;}await handle.close();
 return async()=>{try{const current=JSON.parse(await fs.readFile(file,'utf8'));if(current.runId===runId)await fs.rm(file);}catch(e){if(e.code!=='ENOENT')throw e;}};
}
function wait(seconds,signal){return new Promise(resolve=>{if(signal?.aborted)return resolve();const finish=()=>{clearTimeout(timer);signal?.removeEventListener('abort',finish);resolve();};const timer=setTimeout(finish,seconds*1000);signal?.addEventListener('abort',finish,{once:true});});}
async function runWatch({input='inbox/주간비용.xlsx',output='output/auto',interval=5,checks=12,threshold=50000,resetState=false,labRoot=LAB_ROOT,signal,onCheck}={}){
 ({interval,checks,threshold}=validateOptions({interval,checks,threshold}));
 const {source,destination}=await safePaths(input,output,labRoot);await fs.mkdir(destination,{recursive:true});
 const lockFile=path.join(destination,'.watch.lock'),stateFile=path.join(destination,'watch-state.json'),logFile=path.join(destination,'run-log.jsonl'),runId=crypto.randomUUID();
 const release=await acquireLock(lockFile,runId);let state=null;const deadline=Date.now()+60000;
 try{
  const previous=await readState(stateFile,{resetState});let successfulHash=previous?.threshold===threshold&&previous.input===path.relative(labRoot,source)?previous.lastSuccessfulInputHash:null;
  if(successfulHash){try{const s=JSON.parse(await fs.readFile(path.join(destination,'summary.json'),'utf8'));for(const name of ['report.html','share.txt'])await fs.access(path.join(destination,name));const v=JSON.parse(await fs.readFile(path.join(destination,'verification.json'),'utf8'));if(s.source?.sha256!==successfulHash||s.threshold!==threshold||s.qualityChecked!==true||v.ok!==true||v.source?.sha256!==successfulHash)successfulHash=null;}catch{successfulHash=null;}}
  state={version:1,runId,pid:process.pid,status:'running',startedAt:stamp(),updatedAt:stamp(),input:path.relative(labRoot,source),output:path.relative(labRoot,destination),interval,checksBudget:checks,durationBudgetSeconds:60,threshold,lastSuccessfulInputHash:successfulHash,lastAttemptFailed:false,outcome:null,counts:{checks:0,generated:0,skipped:0,errors:0},stopReason:null};
  await atomicJson(stateFile,state);
  for(let n=1;n<=checks;n++){
   if(signal?.aborted||Date.now()>=deadline)break;
   if(n>1)await wait(Math.min(interval,Math.max(0,(deadline-Date.now())/1000)),signal);
   if(signal?.aborted||Date.now()>=deadline)break;
   let inputHash=null,event;state.counts.checks++;
   try{
    await safePaths(input,output,labRoot);inputHash=sha(await fs.readFile(source));
    if(inputHash===state.lastSuccessfulInputHash&&!state.lastAttemptFailed){state.counts.skipped++;event={status:'skipped',reason:'unchanged'};}
    else{
     const summary=await runReport(source,destination,{threshold});
     // 실행 중 입력이 달라진 경우 생성 결과의 실제 원본 해시만 성공으로 기록한다.
     state.lastSuccessfulInputHash=summary.source.sha256;state.lastAttemptFailed=false;state.counts.generated++;event={status:'generated',inputRows:summary.inputRows,totalAmount:summary.totalAmount};
    }
   }catch(e){state.lastAttemptFailed=true;state.counts.errors++;event={status:'error',message:e.message};}
   state.updatedAt=stamp();const record={runId,check:n,time:state.updatedAt,inputHash,...event,counts:{...state.counts}};
   await fs.appendFile(logFile,JSON.stringify(record)+'\n');await atomicJson(stateFile,state);if(onCheck)await onCheck(record,state);
  }
  state.status='stopped';state.stopReason=signal?.aborted?'signal':state.counts.checks===checks?'checks-complete':'time-budget';state.outcome=signal?.aborted?'interrupted':'completed';state.updatedAt=stamp();await atomicJson(stateFile,state);
  await fs.appendFile(logFile,JSON.stringify({runId,time:state.updatedAt,status:'stopped',outcome:state.outcome,reason:state.stopReason,counts:state.counts})+'\n');return state;
 }catch(e){
  e.phase=state?'runtime':'setup';if(state){state.status='stopped';state.outcome='failed';state.stopReason='fatal-error';state.updatedAt=stamp();state.message=e.message;await atomicJson(stateFile,state).catch(()=>{});await fs.appendFile(logFile,JSON.stringify({runId,time:state.updatedAt,status:'stopped',outcome:'failed',reason:'fatal-error',message:e.message,counts:state.counts})+'\n').catch(()=>{});}throw e;
 }finally{await release();}
}
async function main(){
 const controller=new AbortController(),stop=()=>controller.abort();process.on('SIGINT',stop);process.on('SIGTERM',stop);
 try{const options=parseArgs(process.argv.slice(2));console.log('자동 확인 시작 · 종료 Ctrl+C (진행 중인 검사는 안전하게 마친 뒤 종료)');const state=await runWatch({...options,signal:controller.signal,onCheck:record=>console.log(`${record.check}/${options.checks}: ${record.status}${record.message?' · '+record.message:''}`)});console.log(`종료: ${state.stopReason} / 생성 ${state.counts.generated} · 그대로 ${state.counts.skipped} · 오류 ${state.counts.errors}`);}
 catch(e){console.error('실패 ['+(e.phase==='runtime'?'failed':'failed-setup')+']: '+e.message);process.exitCode=1;}finally{process.off('SIGINT',stop);process.off('SIGTERM',stop);}
}
module.exports={runWatch,parseArgs,validateOptions,readState};if(require.main===module)main();
