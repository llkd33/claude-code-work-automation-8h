'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {runOnce,prepare,buildMac,checkedEnv,runProcess,PRINT_ARGS}=require('./launch.cjs');
const SAMPLE=path.resolve(__dirname,'../../workbooks/주간비용_실습.xlsx');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const MOCK=String.raw`
const fs=require('node:fs');
const a=process.argv.slice(2),mode=process.env.MOCK_MODE||'success';
if(a[0]==='--help'){console.log(mode==='old-cli'?'old version':'--model --effort --safe-mode --restricted --setting-sources --strict-mcp-config --tools --no-session-persistence');process.exit(0);}
if(a[0]==='auth'){
 if(mode==='auth-malformed'){console.log('bad json');process.exit(0);}
 console.log(JSON.stringify({loggedIn:mode!=='logged-out',authMethod:mode==='api'?'api_key':mode==='oauth-token'?'oauth_token':'claude.ai',email:'do-not-record@example.test',accessToken:'DO_NOT_RECORD_TOKEN'}));process.exit(mode==='logged-out'?1:0);
}
let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>input+=s);process.stdin.on('end',()=>{
 fs.appendFileSync(process.env.MOCK_TRACE,JSON.stringify({args:a,input,cwd:process.cwd()})+'\n');
 if(mode==='timeout'){setInterval(()=>{},1000);return;}
 if(mode==='large'){console.log('x'.repeat(300000));return;}
 if(mode==='fail'){console.error('secret error detail should not be persisted');process.exit(2);}
 if(mode==='malformed'){console.log('not json');return;}
 if(mode==='mutate')fs.appendFileSync(process.env.MOCK_INPUT,'changed');
 const bad=mode==='error-result'||mode==='turn-limit';
 console.log(JSON.stringify({type:'result',subtype:bad?'error_max_turns':'success',is_error:bad,result:mode==='empty'?'':mode==='xss'?'<script>alert(1)</script> & 후기':'요약: 집계에서 확인한 총액입니다.\n가설: 추가 확인이 필요합니다.\n다음 행동: 원본을 검토하세요.'}));
});
`;
async function setup(t,mode='success'){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'auth report 한글 '));t.after(()=>fs.rm(root,{recursive:true,force:true}));
 await fs.mkdir(path.join(root,'inbox-auth'));await fs.mkdir(path.join(root,'workbooks'));
 const input=path.join(root,'inbox-auth','주간 비용.xlsx');await fs.copyFile(SAMPLE,input);await fs.copyFile(SAMPLE,path.join(root,'workbooks','주간비용_실습.xlsx'));
 const fixture=path.join(root,'가상 Claude.cjs'),trace=path.join(root,'trace.jsonl');await fs.writeFile(fixture,MOCK);
 const options={root,fixtureCommand:{file:process.execPath,prefix:[fixture]},env:{PATH:process.env.PATH||'',MOCK_MODE:mode,MOCK_TRACE:trace,MOCK_INPUT:input}};
 return {root,input,trace,options,original:sha(await fs.readFile(input))};
}
async function traces(file){try{return (await fs.readFile(file,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code==='ENOENT')return [];throw e;}}
test('실제 샘플 계산과 가상 Claude 한 번 호출; 로그인 세부정보는 저장하지 않음',async t=>{
 const f=await setup(t),r=await runOnce(f.options),calls=await traces(f.trace);
 assert.equal(r.summary.inputRows,40);assert.equal(r.summary.totalAmount,2333300);assert.equal(calls.length,1);assert.equal(r.state.modelCalls,1);
 assert.equal(r.state.executionScope,'fixture-process-only');assert.equal(r.state.claudeResponseReceived,true);assert.equal(r.state.sourceUnchanged,true);assert.equal(r.state.humanReviewRequired,true);
 const state=await fs.readFile(path.join(r.directory,'run-state.json'),'utf8');assert(!state.includes('do-not-record'));assert(!state.includes('DO_NOT_RECORD_TOKEN'));
 const p=JSON.parse(calls[0].input.split('검증된 집계:\n')[1]);assert.equal(p.totalAmount,2333300);assert(!('rows'in p));assert(!calls[0].input.includes('E001'));assert(!calls[0].input.includes('주간 비용.xlsx'));
 assert.equal(path.basename(calls[0].cwd),'claude-context');assert.deepEqual(await fs.readdir(calls[0].cwd),['verified-summary.json']);assert.deepEqual(JSON.parse(await fs.readFile(path.join(calls[0].cwd,'verified-summary.json'),'utf8')),p);
 assert.equal(sha(await fs.readFile(f.input)),f.original);assert((await fs.readFile(path.join(r.directory,'report.html'),'utf8')).includes('2,333,300원'));
});
test('호출 인자: 셸·쓰기·MCP·bare 없이 Read만, 최대 2턴',()=>{
 assert.equal(PRINT_ARGS[PRINT_ARGS.indexOf('--tools')+1],'Read');assert.equal(PRINT_ARGS[PRINT_ARGS.indexOf('--max-turns')+1],'2');
 assert.equal(PRINT_ARGS[PRINT_ARGS.indexOf('--model')+1],'claude-sonnet-5-5');assert.equal(PRINT_ARGS[PRINT_ARGS.indexOf('--effort')+1],'medium');
 for(const flag of ['--safe-mode','--restricted','--strict-mcp-config','--no-session-persistence','--disable-slash-commands'])assert(PRINT_ARGS.includes(flag));
 assert(!PRINT_ARGS.includes('--bare'));assert(!PRINT_ARGS.includes('--dangerously-skip-permissions'));assert.equal(PRINT_ARGS[PRINT_ARGS.indexOf('--permission-mode')+1],'dontAsk');
 assert.equal(PRINT_ARGS[PRINT_ARGS.indexOf('--mcp-config')+1],'{"mcpServers":{}}');
});
for(const [mode,code]of [['logged-out','AUTH_REQUIRED'],['api','AUTH_METHOD'],['oauth-token','AUTH_METHOD'],['auth-malformed','AUTH_MALFORMED'],['old-cli','CLI_VERSION']]){
 test(`${mode}: 분석 전에 중단`,async t=>{const f=await setup(t,mode);let error;await assert.rejects(runOnce(f.options),e=>(error=e,e.code===code));assert.equal((await traces(f.trace)).length,0);assert.equal(error.state.modelCalls,0);assert.equal(error.state.ok,false);assert.equal(sha(await fs.readFile(f.input)),f.original);await assert.rejects(fs.access(path.join(error.directory,'report.html')));});
}
for(const [mode,code]of [['fail','CLAUDE_FAILED'],['malformed','RESULT_MALFORMED'],['error-result','RESULT_INVALID'],['turn-limit','RESULT_INVALID'],['empty','RESULT_INVALID'],['large','OUTPUT_LIMIT']]){
 test(`${mode}: 실패를 성공 보고서로 만들지 않음`,async t=>{const f=await setup(t,mode);let error;await assert.rejects(runOnce(f.options),e=>(error=e,e.code===code));assert.equal((await traces(f.trace)).length,1);assert.equal(error.state.ok,false);assert.equal(error.state.claudeResponseReceived,false);assert.equal(sha(await fs.readFile(f.input)),f.original);await assert.rejects(fs.access(path.join(error.directory,'report.html')));const state=await fs.readFile(path.join(error.directory,'run-state.json'),'utf8');assert(!state.includes('secret error detail'));});
}
test('시간 제한으로 중단하고 실패 단계 기록',async t=>{const f=await setup(t,'timeout');let e;await assert.rejects(runOnce({...f.options,timeoutMs:700}),x=>(e=x,x.code==='TIMEOUT'));assert.equal(e.state.failedStage,'claude-analysis');assert.equal(e.state.ok,false);});
test('분석 중 원본 변경은 최종 보고서 게시 전에 중단',async t=>{const f=await setup(t,'mutate');let e;await assert.rejects(runOnce(f.options),x=>(e=x,x.code==='SOURCE_CHANGED'));assert.equal(e.state.claudeResponseReceived,true);assert.equal(e.state.sourceUnchanged,false);assert.equal(e.state.ok,false);await assert.rejects(fs.access(path.join(e.directory,'report.html')));});
test('Claude 응답의 HTML은 텍스트로 탈출',async t=>{const f=await setup(t,'xss'),r=await runOnce(f.options),html=await fs.readFile(path.join(r.directory,'report.html'),'utf8');assert(!html.includes('<script>alert'));assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &amp;'));});
test('원본 입력 실패는 Claude 도움말·인증·분석 호출 없이 중단',async t=>{const f=await setup(t);await fs.writeFile(f.input,'invalid xlsx');let e;await assert.rejects(runOnce(f.options),x=>(e=x,true));assert.equal(e.state.failedStage,'local-validation');assert.equal(e.state.modelCalls,0);assert.equal((await traces(f.trace)).length,0);});
test('Excel 0개 또는 2개이면 분석하지 않음',async t=>{const f=await setup(t);await fs.rm(f.input);await assert.rejects(runOnce(f.options),e=>e.code==='INPUT_COUNT');await fs.copyFile(SAMPLE,f.input);await fs.copyFile(SAMPLE,path.join(f.root,'inbox-auth','두번째.xlsx'));await assert.rejects(runOnce(f.options),e=>e.code==='INPUT_COUNT');assert.equal((await traces(f.trace)).length,0);});
test('중복 실행은 서로 다른 결과 폴더를 사용',async t=>{const f=await setup(t),[a,b]=await Promise.all([runOnce(f.options),runOnce(f.options)]);assert.notEqual(a.directory,b.directory);assert.equal((await traces(f.trace)).length,2);assert.equal(a.state.ok,true);assert.equal(b.state.ok,true);});
test('다음 실행 실패가 이전 성공 결과를 바꾸지 않음',async t=>{const f=await setup(t),good=await runOnce(f.options),before=await fs.readFile(path.join(good.directory,'report.html'));await assert.rejects(runOnce({...f.options,env:{...f.options.env,MOCK_MODE:'fail'}}));assert.deepEqual(await fs.readFile(path.join(good.directory,'report.html')),before);assert.equal(JSON.parse(await fs.readFile(path.join(good.directory,'run-state.json'),'utf8')).ok,true);});
test('prepare는 기존 사용자 Excel을 보존하며 샘플을 한 번만 복사',async t=>{const f=await setup(t);assert.equal((await prepare(f.root)).created,false);assert.equal(sha(await fs.readFile(f.input)),f.original);await fs.rm(f.input);assert.equal((await prepare(f.root)).created,true);assert.equal((await prepare(f.root)).created,false);assert.equal((await fs.readdir(path.join(f.root,'inbox-auth'))).length,1);});
test('인증·제공 서비스 환경변수는 비밀 값 출력 없이 거절',()=>{for(const key of ['ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_BASE_URL','ANTHROPIC_PROFILE','CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_OAUTH_TOKEN','CLAUDE_CONFIG_DIR'])assert.throws(()=>checkedEnv({[key]:'a-secret-value'}),e=>e.code==='AUTH_ENV_OVERRIDE'&&!e.message.includes('a-secret-value'));assert.equal(checkedEnv({PATH:'x'}).PATH,'x');});
test('프로세스 인자에서 셸 메타문자가 실행되지 않음',async t=>{const f=await setup(t),reply=await runProcess(process.execPath,['-e','console.log(JSON.stringify(process.argv.slice(1)))','a;$(touch hacked)'],{cwd:f.root,env:f.options.env,timeoutMs:2000});assert.deepEqual(JSON.parse(reply.stdout),['a;$(touch hacked)']);await assert.rejects(fs.access(path.join(f.root,'hacked')));});
test('macOS command 생성은 상대 실습 폴더와 종료 코드를 유지',async t=>{const f=await setup(t),target=await buildMac(f.root),script=await fs.readFile(target,'utf8');assert.equal(path.basename(target),'ExcelReport.command');assert(script.includes('${0:A:h}'));assert(script.includes('node integrations/auth-report/launch.cjs'));assert(script.includes('exit "$result"'));assert((await fs.stat(target)).mode&0o100);});
test('macOS command 제작은 기존 사용자 실행기를 덮어쓰지 않음',async t=>{const f=await setup(t),target=path.join(f.root,'ExcelReport.command'),content='#!/bin/zsh\nprint "사용자 실행기"\n';await fs.writeFile(target,content,{mode:0o640});const before=await fs.stat(target);await assert.rejects(buildMac(f.root),e=>e.code==='LAUNCHER_EXISTS');assert.equal(await fs.readFile(target,'utf8'),content);assert.equal((await fs.stat(target)).mode,before.mode);});
