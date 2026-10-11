'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const LAB=path.resolve(__dirname,'../..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(args=process.argv.slice(2)){
 if(args.some(x=>x!=='--api'))throw Error('사용법: node integrations/preflight/check.cjs [--api]');
 const out=path.join(LAB,'output/preflight'),report={checkedAt:new Date().toISOString(),nodeVersion:process.version,localReady:false,apiReady:false,claudeResponse:'manual_required',checks:[],api:{attempted:false,status:'not_checked'},inbox:{}};
 const add=(name,passed,detail)=>{report.checks.push({name,passed,detail});};
 add('Node20이상',Number(process.versions.node.split('.')[0])>=20,process.version);
 add('실습루트',path.resolve(process.cwd())===LAB,'터미널 현재 위치: '+process.cwd());
 try{await fs.mkdir(out,{recursive:true});const probe=path.join(out,`.write-check-${process.pid}`);await fs.writeFile(probe,'writable');await fs.unlink(probe);add('출력쓰기',true,'output/preflight');}catch(e){add('출력쓰기',false,e.message);}
 try{
  const {inspectWorkbook,runReport}=require('../local-report/weekly-report.cjs');
  for(const [name,count,total,valid]of [['실습',40,2333300,true],['수정후',41,2363300,true],['다음주',12,1130900,true],['오류',null,null,false],['열누락',null,null,false]]){
   const bytes=await fs.readFile(path.join(LAB,`workbooks/주간비용_${name}.xlsx`)),r=await inspectWorkbook(bytes);
   const ok=valid?r.ok&&r.summary.inputRows===count&&r.summary.totalAmount===total:!r.ok;
   add(`Excel_${name}`,ok,valid?`${r.summary?.inputRows}건 / ${r.summary?.totalAmount}원`:r.errors?.map(e=>e.code).join(','));
  }
  await runReport(path.join(LAB,'workbooks/주간비용_실습.xlsx'),out);add('실제보고서생성',true,'output/preflight/report.html');
 }catch(e){add('Excel라이브러리/실행',false,e.message+' · npm ci --prefix integrations/local-report 확인');}
 try{const {prepare}=require('../automation/prepare.cjs');if(typeof prepare==='function')await prepare({labRoot:LAB});else{const r=spawnSync(process.execPath,[path.join(LAB,'integrations/automation/prepare.cjs')],{cwd:LAB,encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
  const b=await fs.readFile(path.join(LAB,'inbox/주간비용.xlsx')),{inspectWorkbook}=require('../local-report/weekly-report.cjs'),r=await inspectWorkbook(b);report.inbox={exists:true,sha256:hash(b),valid:r.ok,inputRows:r.summary?.inputRows??r.inputRows,totalAmount:r.summary?.totalAmount??null,note:'기존 사본은 보존. 자동실습 시작 직전 input-copy.cjs original로 학생 사본만 초기화.'};add('감시사본',true,'inbox/주간비용.xlsx');
 }catch(e){add('감시사본',false,e.message);}
 const v=spawnSync(os.platform()==='win32'?'claude.exe':'claude',['--version'],{encoding:'utf8',timeout:10000});report.claudeVersion=v.status===0?v.stdout.trim():'미확인';report.claudeCheck='로그인·모델 권한·실제 대화는 사람이 Claude에서 별도 확인';
 report.localReady=report.checks.every(x=>x.passed);
 if(args.includes('--api')){
  const r=spawnSync(process.execPath,[path.join(LAB,'integrations/api-briefing/briefing.cjs'),'--amount','100','--summary',path.join(out,'summary.json'),'--output',path.join(out,'api')],{cwd:LAB,encoding:'utf8',timeout:20000});
  report.api={attempted:true,status:r.status===0?'live_passed':'attempt_failed',detail:r.status===0?'실제 API 결과 파일 확인':String(r.stderr||r.error?.message||'API 실패').slice(0,1200),output:'output/preflight/api'};report.apiReady=r.status===0;
 }
 report.nextSteps=['localReady:false이면 실패 항목과 OS별 준비표 확인','API 미확인/실패이면 교육장 연결 확인 후 --api 재시도, DEMO를 실연결 성공으로 기록하지 않기','Claude를 새로 열어 실제 응답·모델 이용 가능 여부를 직접 확인'];
 await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'preflight-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({localReady:report.localReady,apiReady:report.apiReady,api:report.api.status,claudeResponse:report.claudeResponse,inbox:report.inbox,input:'output/preflight/preflight-report.json'},null,2));if(!report.localReady)process.exitCode=1;return report;
}
module.exports={main};if(require.main===module)main().catch(e=>{console.error('준비 검사 중단: '+e.message);process.exitCode=1;});
