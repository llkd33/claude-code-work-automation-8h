'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const {runWatch,parseArgs,validateOptions}=require('./watch.cjs');
const {prepare}=require('./prepare.cjs'),{copyInput,SOURCES}=require('./input-copy.cjs'),{safePaths,LAB_ROOT}=require('./paths.cjs');
const RESULTS=['summary.json','report.html','share.txt'];
async function setup(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'solo-automation-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'workbooks'),{recursive:true});for(const source of Object.values(SOURCES))await fs.copyFile(path.join(LAB_ROOT,'workbooks',source),path.join(root,'workbooks',source));
 return root;
}
async function read(root,file='output/auto/watch-state.json'){return JSON.parse(await fs.readFile(path.join(root,file),'utf8'));}
async function hashes(root){return Promise.all(RESULTS.map(f=>fs.readFile(path.join(root,'output/auto',f))));}
async function lines(root){return (await fs.readFile(path.join(root,'output/auto/run-log.jsonl'),'utf8')).trim().split('\n').map(line=>JSON.parse(line));}
async function sameResults(root,before){for(let i=0;i<RESULTS.length;i++)assert.deepEqual(await fs.readFile(path.join(root,'output/auto',RESULTS[i])),before[i]);}
test('prepare 기존 입력 보존·reset명시·원본불변',async t=>{const root=await setup(t);const original=await fs.readFile(path.join(root,'workbooks',SOURCES.original));assert.equal((await prepare({labRoot:root})).copied,true);await copyInput('next',{labRoot:root});const changed=await fs.readFile(path.join(root,'inbox/주간비용.xlsx'));assert.equal((await prepare({labRoot:root})).copied,false);assert.deepEqual(await fs.readFile(path.join(root,'inbox/주간비용.xlsx')),changed);await prepare({labRoot:root,reset:true});assert.deepEqual(await fs.readFile(path.join(root,'inbox/주간비용.xlsx')),original);assert.deepEqual(await fs.readFile(path.join(root,'workbooks',SOURCES.original)),original);});
test('실제 루프 원본40→다음주12→skip→error보존→재시도→복구생성→종료',async t=>{
 const root=await setup(t);await prepare({labRoot:root});let previous;
 const state=await runWatch({labRoot:root,interval:.05,checks:6,onCheck:async event=>{
  if(event.check===1){assert.equal(event.totalAmount,2333300);await copyInput('next',{labRoot:root});}
  if(event.check===2){assert.equal(event.inputRows,12);assert.equal(event.totalAmount,1130900);previous=await hashes(root);}
  if(event.check===3){assert.equal(event.status,'skipped');await copyInput('error',{labRoot:root});}
  if(event.check===4||event.check===5){assert.equal(event.status,'error');await sameResults(root,previous);assert.equal((await read(root)).lastSuccessfulInputHash,(await read(root,'output/auto/summary.json')).source.sha256);}
  if(event.check===5)await copyInput('next',{labRoot:root});
 }});
 assert.deepEqual(state.counts,{checks:6,generated:3,skipped:1,errors:2});assert.equal(state.status,'stopped');assert.equal(state.outcome,'completed');assert.equal(state.stopReason,'checks-complete');assert.equal((await read(root,'output/auto/verification.json')).ok,true);assert.equal((await lines(root)).at(-1).status,'stopped');await assert.rejects(fs.access(path.join(root,'output/auto/.watch.lock')));
});
test('중단 후 재시작은 같은 원본skip·개인기준변경은생성',async t=>{
 const root=await setup(t);await prepare({labRoot:root});const controller=new AbortController();const stopped=await runWatch({labRoot:root,interval:.05,checks:12,signal:controller.signal,onCheck:()=>controller.abort()});assert.equal(stopped.outcome,'interrupted');assert.equal(stopped.counts.checks,1);
 const restarted=await runWatch({labRoot:root,interval:.05,checks:1});assert.equal(restarted.counts.skipped,1);assert.equal(restarted.counts.generated,0);
 const personal=await runWatch({labRoot:root,interval:.05,checks:1,threshold:20000});assert.equal(personal.counts.generated,1);assert.equal((await read(root,'output/auto/summary.json')).threshold,20000);
});
test('깨진state는중단·명시reset시이전state보존후정상생성',async t=>{const root=await setup(t);await prepare({labRoot:root});await fs.mkdir(path.join(root,'output/auto'),{recursive:true});await fs.writeFile(path.join(root,'output/auto/watch-state.json'),'{bad');await assert.rejects(runWatch({labRoot:root,interval:.05,checks:1}),/깨졌습니다/);assert.equal(await fs.readFile(path.join(root,'output/auto/watch-state.json'),'utf8'),'{bad');await assert.rejects(fs.access(path.join(root,'output/auto/.watch.lock')));const state=await runWatch({labRoot:root,interval:.05,checks:1,resetState:true});assert.equal(state.counts.generated,1);assert.ok((await fs.readdir(path.join(root,'output/auto'))).some(n=>n.startsWith('watch-state.json.previous-')));});
test('동일output의동시watch잠금·다른output은별도생성가능',async t=>{const root=await setup(t);await prepare({labRoot:root});const controller=new AbortController();let ready;const pendingReady=new Promise(resolve=>ready=resolve);let finish;const blocker=new Promise(resolve=>finish=resolve);const first=runWatch({labRoot:root,interval:.05,checks:12,signal:controller.signal,onCheck:async event=>{if(event.check===1){ready();await blocker;}}});await pendingReady;await assert.rejects(runWatch({labRoot:root,interval:.05,checks:1}),/잠금/);const other=await runWatch({labRoot:root,output:'output/other',interval:.05,checks:1});assert.equal(other.counts.generated,1);controller.abort();finish();await first;});
test('범위탈출·원본덮어쓰기·심볼릭입력/출력거부',async t=>{const root=await setup(t);await prepare({labRoot:root});for(const options of [{input:'workbooks/주간비용_실습.xlsx',output:'output/auto'},{input:'inbox/../workbooks/a.xlsx',output:'output/auto'},{input:'inbox/주간비용.xlsx',output:'inbox'},{input:'inbox/주간비용.xlsx',output:'output/../../outside'}])await assert.rejects(safePaths(options.input,options.output,root));await fs.symlink(path.join(root,'workbooks',SOURCES.original),path.join(root,'inbox/link.xlsx'));await assert.rejects(safePaths('inbox/link.xlsx','output/auto',root),/심볼릭/);await fs.mkdir(path.join(root,'output'));await fs.symlink(path.join(root,'inbox'),path.join(root,'output/link'),'junction');await assert.rejects(safePaths('inbox/주간비용.xlsx','output/link/auto',root),/심볼릭/);});
test('파일없음은매check재시도·성공hash없음',async t=>{const root=await setup(t);const state=await runWatch({labRoot:root,interval:.05,checks:2});assert.equal(state.counts.errors,2);assert.equal(state.lastSuccessfulInputHash,null);assert.equal(state.counts.generated,0);});
test('누락필수열입력은watch실패로남기고후속check재시도',async t=>{const root=await setup(t);await copyInput('missing',{labRoot:root});const state=await runWatch({labRoot:root,interval:.05,checks:2});assert.equal(state.counts.errors,2);assert.equal(state.lastSuccessfulInputHash,null);assert.equal((await read(root,'output/auto/verification.json')).ok,false);});
test('상태가성공이어도성공verification없으면재시작시재검사',async t=>{const root=await setup(t);await prepare({labRoot:root});await runWatch({labRoot:root,interval:.05,checks:1});await fs.writeFile(path.join(root,'output/auto/verification.json'),JSON.stringify({ok:false}));const state=await runWatch({labRoot:root,interval:.05,checks:1});assert.equal(state.counts.generated,1);});
test('옵션범위·오타·숫자뒤문자·중복옵션거부',()=>{assert.equal(parseArgs([]).checks,12);assert.equal(parseArgs(['--interval','.1']).interval,.1);for(const options of [{interval:0},{interval:6},{checks:13},{checks:1.1},{threshold:-1},{threshold:Infinity}])assert.throws(()=>validateOptions(options));for(const args of [['--checks','12x'],['--threshold','-1'],['--input'],['--oops','1'],['--checks','1','--checks','2']])assert.throws(()=>parseArgs(args));});
async function cliLab(t){const root=await setup(t);await fs.mkdir(path.join(root,'integrations/automation'),{recursive:true});for(const name of ['watch.cjs','paths.cjs','prepare.cjs','input-copy.cjs'])await fs.copyFile(path.join(__dirname,name),path.join(root,'integrations/automation',name));await fs.mkdir(path.join(root,'integrations/local-report'));await fs.copyFile(path.join(LAB_ROOT,'integrations/local-report/weekly-report.cjs'),path.join(root,'integrations/local-report/weekly-report.cjs'));await fs.symlink(path.join(LAB_ROOT,'integrations/local-report/node_modules'),path.join(root,'integrations/local-report/node_modules'),'junction');return root;}
function child(root,args){const proc=spawn(process.execPath,['integrations/automation/watch.cjs',...args],{cwd:root});let stdout='',stderr='';proc.stdout.on('data',b=>stdout+=b);proc.stderr.on('data',b=>stderr+=b);const done=new Promise(resolve=>proc.on('close',(code,signal)=>resolve({code,signal,stdout,stderr})));return {proc,done};}
async function until(check){const deadline=Date.now()+5000;while(Date.now()<deadline){if(await check())return;await new Promise(resolve=>setTimeout(resolve,10));}throw Error('CLI progress timeout');}
test('실제CLI:40→12→skip→error보존→CtrlC→재시작',async t=>{
 const root=await cliLab(t);await prepare({labRoot:root});const running=child(root,['--interval','0.2','--checks','12']);t.after(()=>running.proc.kill());
 const entries=async()=>{try{return await lines(root);}catch{return [];}};
 await until(async()=> (await entries()).some(e=>e.status==='generated'));await copyInput('next',{labRoot:root});
 await until(async()=> (await entries()).some(e=>e.status==='generated'&&e.inputRows===12));const before=await hashes(root);
 await until(async()=> (await entries()).some(e=>e.status==='skipped'));await copyInput('error',{labRoot:root});
 await until(async()=> (await entries()).some(e=>e.status==='error'));await sameResults(root,before);running.proc.kill('SIGINT');const result=await running.done;assert.equal(result.code,0,result.stderr);assert.ok(result.stdout.includes('skipped'));assert.equal((await read(root)).outcome,'interrupted');assert.equal((await lines(root)).at(-1).status,'stopped');
 await copyInput('next',{labRoot:root});const again=child(root,['--interval','0.05','--checks','1']);assert.equal((await again.done).code,0);assert.equal((await read(root)).outcome,'completed');assert.equal((await read(root,'output/auto/verification.json')).ok,true);
});
test('실제CLI 잘못된옵션은failed-setup로종료',async t=>{const root=await cliLab(t);const c=child(root,['--checks','13']);const result=await c.done;assert.equal(result.code,1);assert.ok(result.stderr.includes('failed-setup'));});
