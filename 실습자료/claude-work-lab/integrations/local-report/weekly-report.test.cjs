'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const ExcelJS=require('exceljs');
const {inspectWorkbook,runReport,parseArgs,shareText,REQUIRED_HEADERS}=require('./weekly-report.cjs');
const LAB=path.resolve(__dirname,'../..'),FILES=['summary.json','report.html','share.txt'];
const H=['전표번호','부서','품목','수량','단가','금액','처리상태'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function sample({headers=H,rows=[{전표번호:'T001',부서:'운영',품목:'문구',수량:2,단가:1000,금액:2000,처리상태:'완료'}]}={}){
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('비용내역');sheet.addRow(headers);
 for(const row of rows)sheet.addRow(headers.map(h=>row[h]??null));return book.xlsx.writeBuffer();
}
async function temp(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'weekly-report-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));return dir;}
const valid={전표번호:'T001',부서:'운영',품목:'문구',수량:2,단가:1000,금액:2000,처리상태:'완료'};
test('실제 원본 40건의 합계와 행/부서 등식·완료 상태',async()=>{const c=await inspectWorkbook(await fs.readFile(path.join(LAB,'workbooks/주간비용_실습.xlsx')));assert.equal(c.ok,true);const s=c.summary;assert.equal(s.inputRows,40);assert.equal(s.totalAmount,2333300);assert.equal(s.byStatus.완료.rows,29);assert.equal(s.inputRows,s.validRows+s.errorRows+s.duplicateRows);assert.equal(Object.values(s.byDepartment).reduce((a,b)=>a+b,0),s.totalAmount);assert.equal(s.qualityChecked,true);});
test('실제 수정후 41건·E003 수정 및 E041 추가',async()=>{const c=await inspectWorkbook(await fs.readFile(path.join(LAB,'workbooks/주간비용_수정후.xlsx')));assert.equal(c.ok,true);assert.equal(c.summary.totalAmount,2363300);assert.equal(c.summary.inputRows,41);assert.equal(c.summary.byStatus.완료.rows,31);assert.equal(c.rows.find(r=>r.id==='E003').amount,15000);assert.ok(c.rows.some(r=>r.id==='E041'));});
test('실제 다음주·열순서 변경도 정상 처리',async()=>{const c=await inspectWorkbook(await fs.readFile(path.join(LAB,'workbooks/주간비용_다음주.xlsx')));assert.equal(c.ok,true);assert.ok(c.rows.every(r=>r.id.startsWith('W')));assert.equal(c.summary.totalAmount,c.rows.reduce((n,r)=>n+r.quantity*r.unitPrice,0));assert.equal(c.summary.byStatus.완료.rows+c.summary.byStatus.진행.rows,c.summary.inputRows);});
test('실제 오류파일의 중복·빈단가를 캐시와 무관하게 발견',async()=>{const c=await inspectWorkbook(await fs.readFile(path.join(LAB,'workbooks/주간비용_오류.xlsx')));assert.equal(c.ok,false);assert.ok(c.errors.some(e=>e.code==='DUPLICATE_ID'));assert.ok(c.errors.some(e=>e.field==='단가'&&e.code==='EMPTY'));assert.equal(c.inputRows,c.validRows+c.duplicateRows+c.errorRows);});
test('실제 열누락 파일을 중단',async()=>{const c=await inspectWorkbook(await fs.readFile(path.join(LAB,'workbooks/주간비용_열누락.xlsx')));assert.equal(c.ok,false);assert.ok(c.errors.some(e=>e.field==='단가'&&e.code==='MISSING_HEADER'));});
test('합성: 열순서와 같은행 수식·오래된 캐시',async()=>{const h=['처리상태','금액','단가','품목','수량','전표번호','부서'];const c=await inspectWorkbook(await sample({headers:h,rows:[{...valid,금액:{formula:'$E$2 * $C$2',result:999999}}]}));assert.equal(c.ok,true);assert.equal(c.summary.totalAmount,2000);});
test('합성: 수식 cache 없음도 재계산',async()=>{const c=await inspectWorkbook(await sample({rows:[{...valid,금액:{formula:'D2*E2'}}]}));assert.equal(c.ok,true);assert.equal(c.summary.totalAmount,2000);});
test('합성: 원본 단가만 수정하면 cache보다 새 단가 사용',async()=>{const c=await inspectWorkbook(await sample({rows:[{...valid,단가:2000,금액:{formula:'D2*E2',result:2000}}]}));assert.equal(c.summary.totalAmount,4000);});
test('합성: 잘못된 정적 금액을 중단',async()=>{const c=await inspectWorkbook(await sample({rows:[{...valid,금액:1000}]}));assert.equal(c.ok,false);assert.ok(c.errors.some(e=>e.code==='AMOUNT_MISMATCH'));});
for(const [title,change,code]of [ ['빈 금액',{금액:null},'EMPTY'],['음수 단가',{단가:-1},'INVALID_NUMBER'],['0 수량',{수량:0},'INVALID_NUMBER'],['문자 단가',{단가:'1,000'},'INVALID_NUMBER'],['소수 수량',{수량:1.5},'INVALID_NUMBER'],['알 수 없는 상태',{처리상태:'대기'},'INVALID_STATUS'],['빈 부서',{부서:null},'EMPTY'],['지원하지 않는 수식',{금액:{formula:'SUM(D2:E2)',result:2000}},'UNSUPPORTED_FORMULA'],['다른행 참조',{금액:{formula:'D3*E3',result:2000}},'UNSUPPORTED_FORMULA']]){
 test('합성: '+title,async()=>{const c=await inspectWorkbook(await sample({rows:[{...valid,...change}]}));assert.equal(c.ok,false);assert.ok(c.errors.some(e=>e.code===code));});
}
test('합성: 0원 비용 허용',async()=>{const c=await inspectWorkbook(await sample({rows:[{...valid,단가:0,금액:0}]}));assert.equal(c.ok,true);assert.equal(c.summary.totalAmount,0);});
test('합성: 전표 중복 거부',async()=>{const c=await inspectWorkbook(await sample({rows:[valid,valid]}));assert.equal(c.ok,false);assert.equal(c.duplicateRows,1);});
test('합성: 필수 헤더 중복·누락·빈 데이터 거부',async()=>{for(const config of [{headers:H.filter(h=>h!=='수량')},{headers:[...H,'수량']},{rows:[]}])assert.equal((await inspectWorkbook(await sample(config))).ok,false);assert.ok(REQUIRED_HEADERS.includes('금액'));});
test('개인 기준이 결과와 HTML/문안을 실제로 변경',async()=>{const bytes=await fs.readFile(path.join(LAB,'workbooks/주간비용_실습.xlsx'));const a=await inspectWorkbook(bytes),b=await inspectWorkbook(bytes,{threshold:50000});assert.equal(a.summary.totalAmount,b.summary.totalAmount);assert.ok(b.summary.overThresholdRows>a.summary.overThresholdRows);});
test('실제 실행 4파일 생성·같은입력 재실행·원본불변·마지막결과 보존',async t=>{
 const dir=await temp(t),input=path.join(LAB,'workbooks/주간비용_실습.xlsx');const before=sha(await fs.readFile(input));
 const first=await runReport(input,dir),second=await runReport(input,dir);assert.equal(first.totalAmount,second.totalAmount);assert.equal(sha(await fs.readFile(input)),before);
 const v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));assert.equal(v.ok,true);assert.equal(v.qualityChecked,true);
 const last=await Promise.all(FILES.map(f=>fs.readFile(path.join(dir,f))));
 await assert.rejects(runReport(path.join(LAB,'workbooks/주간비용_오류.xlsx'),dir));
 for(let i=0;i<FILES.length;i++)assert.deepEqual(await fs.readFile(path.join(dir,FILES[i])),last[i]);
 const failed=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));assert.equal(failed.ok,false);assert.equal(failed.lastSuccessfulResultPreserved,true);assert.equal(failed.qualityChecked,true);
});
test('첫 실패에는 성공보고서 없음',async t=>{const dir=await temp(t);await assert.rejects(runReport(path.join(LAB,'workbooks/주간비용_열누락.xlsx'),dir));for(const file of FILES)await assert.rejects(fs.access(path.join(dir,file)));});
test('파일없음은 실행실패·원본검사 미완료 표시',async t=>{const dir=await temp(t);await assert.rejects(runReport(path.join(dir,'missing.xlsx'),dir));const v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));assert.equal(v.qualityChecked,false);assert.equal(v.ok,false);});
test('HTML과 문안의 사용자 입력 escaping',async t=>{const dir=await temp(t),file=path.join(dir,'input.xlsx');await fs.writeFile(file,await sample({rows:[{...valid,부서:'<script>alert(1)</script>',품목:'</textarea><script>x</script>'}]}));await runReport(file,path.join(dir,'out'),{threshold:0});const html=await fs.readFile(path.join(dir,'out/report.html'),'utf8');assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));assert.ok(!html.includes('<script>alert(1)</script>'));});
test('CLI 옵션 오타·음수·누락 거부',()=>{assert.equal(parseArgs(['a.xlsx','out','--threshold','50000']).threshold,50000);for(const args of [[],['a','b','--threshold'],['a','b','--threshold','-1'],['a','b','--wrong','50000'],['a','b','--threshold','50000x']])assert.throws(()=>parseArgs(args));});
async function assertSnapshot(directory,before){for(let i=0;i<FILES.length;i++)assert.deepEqual(await fs.readFile(path.join(directory,FILES[i])),before[i]);}
async function snapshot(directory){return Promise.all(FILES.map(file=>fs.readFile(path.join(directory,file))));}
const INITIAL=path.join(LAB,'workbooks/주간비용_실습.xlsx'),CHANGED=path.join(LAB,'workbooks/주간비용_수정후.xlsx');
test('공개 두번째 rename 실패시 이전 3파일 바이트를 복구',async t=>{
 const dir=await temp(t);await runReport(INITIAL,dir);const before=await snapshot(dir),original=fs.rename;let calls=0;
 fs.rename=async(...args)=>{if(++calls===2)throw Error('injected second rename');return original(...args);};
 try{await assert.rejects(runReport(CHANGED,dir),/injected second rename/);}finally{fs.rename=original;}
 await assertSnapshot(dir,before);const v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));
 assert.equal(v.ok,false);assert.equal(v.lastSuccessfulResultPreserved,true);assert.equal(v.outputStateRestored,true);assert.deepEqual(v.preservedFiles,FILES);assert.equal(v.qualityChecked,true);
});
test('이전 없는 첫 실행의 두번째 rename 실패시 새 성공파일을 제거',async t=>{
 const dir=await temp(t),original=fs.rename;let calls=0;fs.rename=async(...args)=>{if(++calls===2)throw Error('injected first publish');return original(...args);};
 try{await assert.rejects(runReport(INITIAL,dir),/injected first publish/);}finally{fs.rename=original;}
 for(const file of FILES)await assert.rejects(fs.access(path.join(dir,file)));
 const v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));assert.equal(v.lastSuccessfulResultPreserved,false);assert.equal(v.outputStateRestored,true);assert.deepEqual(v.absentFiles,FILES);
 assert.ok((await fs.readdir(dir)).every(name=>!name.endsWith('.tmp')));
});
test('성공 verification 임시쓰기 실패시 이전 결과 유지',async t=>{
 const dir=await temp(t);await runReport(INITIAL,dir);const before=await snapshot(dir),original=fs.writeFile;let injected=false;
 fs.writeFile=async(file,...rest)=>{if(!injected&&path.basename(file).startsWith('.verification.json.')){injected=true;throw Error('injected verification write');}return original(file,...rest);};
 try{await assert.rejects(runReport(CHANGED,dir),/injected verification write/);}finally{fs.writeFile=original;}
 assert.equal(injected,true);await assertSnapshot(dir,before);const v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));assert.equal(v.lastSuccessfulResultPreserved,true);assert.equal(v.ok,false);
});
test('verification 공개 rename 실패시 이미 공개한 3파일을 복구',async t=>{
 const dir=await temp(t);await runReport(INITIAL,dir);const before=await snapshot(dir),original=fs.rename;let injected=false;
 fs.rename=async(file,target)=>{if(!injected&&path.basename(target)==='verification.json'){injected=true;throw Error('injected verification publish');}return original(file,target);};
 try{await assert.rejects(runReport(CHANGED,dir),/injected verification publish/);}finally{fs.rename=original;}
 await assertSnapshot(dir,before);const v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));assert.equal(v.lastSuccessfulResultPreserved,true);assert.equal(v.ok,false);
});
test('복구도 실패하면 현재 바이트 대조로 보존 false를 기록',async t=>{
 const dir=await temp(t);await runReport(INITIAL,dir);const original=fs.rename;let count=0;
 fs.rename=async(...args)=>{count++;if(count===2||count===3)throw Error('injected publish and rollback');return original(...args);};
 try{await assert.rejects(runReport(CHANGED,dir),/injected publish and rollback/);}finally{fs.rename=original;}
 const v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));assert.equal(v.lastSuccessfulResultPreserved,false);assert.equal(v.outputStateRestored,false);assert.ok(v.errors.some(e=>e.code==='ROLLBACK_ERROR'));assert.ok(!v.preservedFiles.includes('summary.json'));
});
test('공유 문안은 실제 생성시각·출처를 표기하고 없으면 미기록',async()=>{
 const {summary}=await inspectWorkbook(await sample());const plain=shareText(summary);assert.ok(plain.includes('생성 시각: 미기록'));assert.ok(plain.includes('입력 출처: 미기록'));
 summary.generatedAt='2026-10-08T03:00:00.000Z';summary.source.file='sample.xlsx';const text=shareText(summary);assert.ok(text.includes(summary.generatedAt));assert.ok(text.includes('sample.xlsx / 비용내역'));
});
