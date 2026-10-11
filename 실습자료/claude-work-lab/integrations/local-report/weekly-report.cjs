'use strict';
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto');
const REQUIRED_HEADERS = ['전표번호','부서','품목','수량','단가','금액','처리상태'];
const OUTPUT_FILES = ['summary.json','report.html','share.txt'];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const esc = v => String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => n.toLocaleString('ko-KR');
const blank = v => v == null || v === '' || (typeof v === 'string' && !v.trim());
function textValue(cell) {
 const v=cell.value;
 if(typeof v==='string'||typeof v==='number')return String(v).trim();
 if(v?.richText)return v.richText.map(t=>t.text).join('').trim();
 return '';
}
async function inspectWorkbook(bytes,{threshold=100000}={}) {
 if(!Number.isSafeInteger(threshold)||threshold<0)throw Error('기준 금액은 0 이상의 정수여야 합니다.');
 let ExcelJS;try{ExcelJS=require('exceljs')}catch{throw Error('사전 준비 명령 npm ci --prefix integrations/local-report 를 실행해 주세요.')}
 // ArtifactTool의 x: 태그를 ExcelJS가 읽는 기본 namespace 태그로 정규화한다.
 // 셀/수식/값 파싱은 ExcelJS가 담당하며, 원본 파일은 수정하지 않는다.
 const JSZip=require('jszip'),zip=await JSZip.loadAsync(bytes);let normalized=false;
 for(const file of Object.values(zip.files)){if(file.dir||!file.name.endsWith('.xml'))continue;let xml=await file.async('string');
  const declaration=/xmlns:([A-Za-z_][\w.-]*)=["']http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main["']/g;
  for(const match of [...xml.matchAll(declaration)]){const prefix=match[1];xml=xml.replace(new RegExp('<(/?)'+prefix+':','g'),'<$1').replace(match[0],'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"');normalized=true;}
  zip.file(file.name,xml);
 }
 const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(normalized?await zip.generateAsync({type:'nodebuffer'}):bytes,{ignoreNodes:['tableParts','drawing']});
 const sheet=workbook.getWorksheet('비용내역');if(!sheet)throw Error('비용내역 탭을 찾을 수 없습니다.');
 const columns={},errors=[];
 const fail=(row,field,code,message)=>({row,field,code,message});
 sheet.getRow(1).eachCell((cell,col)=>{const h=textValue(cell);if(!h)return;if(columns[h])errors.push(fail(1,h,'DUPLICATE_HEADER',`${h} 헤더가 두 번 있습니다.`));else columns[h]=col;});
 for(const h of REQUIRED_HEADERS)if(!columns[h])errors.push(fail(1,h,'MISSING_HEADER',`필수 헤더 ${h}가 없습니다.`));
 const invalid=(inputRows=0,validRows=0,duplicateRows=0,errorRows=0)=>({ok:false,qualityChecked:true,errors,inputRows,validRows,duplicateRows,errorRows,threshold});
 if(errors.length)return invalid();
 const seen=new Map(),rows=[];let inputRows=0,duplicateRows=0,errorRows=0;
 for(let n=2;n<=sheet.rowCount;n++) {
  const row=sheet.getRow(n);if(!row.values.some(v=>!blank(v)))continue;
  inputRows++;const issues=[],get=h=>row.getCell(columns[h]);
  const issue=(field,code,message)=>issues.push(fail(n,field,code,message));
  const id=textValue(get('전표번호')),department=textValue(get('부서')),item=textValue(get('품목')),status=textValue(get('처리상태'));
  for(const [field,v] of [['전표번호',id],['부서',department],['품목',item],['처리상태',status]])if(!v)issue(field,'EMPTY',`${field}을 입력해 주세요. 수식은 지원하지 않습니다.`);
  const duplicate=!!id&&seen.has(id);if(duplicate)issue('전표번호','DUPLICATE_ID',`${id}는 ${seen.get(id)}행에도 있습니다.`);else if(id)seen.set(id,n);
  if(status&&!['완료','진행'].includes(status))issue('처리상태','INVALID_STATUS','처리상태는 완료 또는 진행이어야 합니다.');
  const num=(field,positive=false)=>{const v=get(field).value;if(blank(v)){issue(field,'EMPTY',`${field}이 비어 있습니다.`);return null;}if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0||(positive&&v===0)){issue(field,'INVALID_NUMBER',`${field}은 ${positive?'양의':'0 이상의'} 정수로 입력해 주세요. 수식·문자 숫자는 지원하지 않습니다.`);return null;}return v;};
  const quantity=num('수량',true),unitPrice=num('단가');let amount=quantity===null||unitPrice===null?null:quantity*unitPrice;
  if(amount!==null&&!Number.isSafeInteger(amount)){issue('금액','OVERFLOW','계산 금액이 정수 지원 범위를 넘습니다.');amount=null;}
  const cell=get('금액'),v=cell.value;
  if(blank(v))issue('금액','EMPTY','금액이 비어 있습니다.');
  else if(typeof v==='object'&&('formula'in v||'sharedFormula'in v)) {
   const f=String(cell.formula||'').replace(/\s|\$/g,'').replace(/^=/,'').toUpperCase();const a=get('수량').address.toUpperCase(),b=get('단가').address.toUpperCase();
   if(![`${a}*${b}`,`${b}*${a}`,`(${a}*${b})`,`(${b}*${a})`].includes(f))issue('금액','UNSUPPORTED_FORMULA',`금액 수식은 같은 행의 수량×단가만 지원합니다: ${f}`);
   // 허용 수식의 저장된 계산 결과는 읽지 않는다.
  } else if(typeof v!=='number'||!Number.isSafeInteger(v)||v<0)issue('금액','INVALID_NUMBER','금액은 0 이상의 정수 또는 수량×단가 수식이어야 합니다.');
  else if(amount!==null&&v!==amount)issue('금액','AMOUNT_MISMATCH',`입력 금액 ${v}원이 수량×단가 ${amount}원과 다릅니다.`);
  if(duplicate)duplicateRows++;else if(issues.length)errorRows++;else rows.push({id,department,item,quantity,unitPrice,amount,status,sourceRow:n});
  errors.push(...issues);
 }
 if(!inputRows)errors.push(fail(2,'비용내역','EMPTY_DATA','최소 한 건을 입력해 주세요.'));
 if(errors.length)return invalid(inputRows,rows.length,duplicateRows,errorRows);
 const byDepartment=Object.create(null),byStatus={완료:{rows:0,amount:0},진행:{rows:0,amount:0}};let totalAmount=0;
 for(const row of rows){totalAmount+=row.amount;byDepartment[row.department]=(byDepartment[row.department]||0)+row.amount;byStatus[row.status].rows++;byStatus[row.status].amount+=row.amount;}
 if(!Number.isSafeInteger(totalAmount))throw Error('전체 합계가 정수 지원 범위를 넘습니다.');
 const overThreshold=rows.filter(r=>r.amount>=threshold);
 return {ok:true,errors:[],rows,summary:{inputRows,validRows:rows.length,duplicateRows:0,errorRows:0,totalAmount,byDepartment,qualityChecked:true,qualityStatus:'passed',byStatus,threshold,thresholdRule:'금액이 기준 이상인 건',overThresholdRows:overThreshold.length,overThresholdAmount:overThreshold.reduce((s,r)=>s+r.amount,0),overThreshold,source:{kind:'local-xlsx',sheet:'비용내역',amountCalculation:'수량×단가 재계산; 수식 cache 미사용'}}};
}
function shareText(s) {
 return `주간 비용 ${fmt(s.inputRows)}건, 총 ${fmt(s.totalAmount)}원입니다.\n완료 ${s.byStatus.완료.rows}건 / 진행 ${s.byStatus.진행.rows}건입니다.\n${fmt(s.threshold)}원 이상 확인할 비용은 ${s.overThresholdRows}건(${fmt(s.overThresholdAmount)}원)입니다.\n부서별: ${Object.entries(s.byDepartment).map(([k,v])=>`${k} ${fmt(v)}원`).join(', ')}\n원본 입력 검사 통과: 중복 ${s.duplicateRows}건, 오류 ${s.errorRows}건.\n생성 시각: ${s.generatedAt ?? "미기록"}\n입력 출처: ${s.source?.file ?? "미기록"} / ${s.source?.sheet ?? "미기록"}\n원본 변경 후 다시 실행해 주세요.\n`;
}
function render(s) {
 const cards=[['비용 건수',`${s.inputRows}건`],['총액',`${fmt(s.totalAmount)}원`],['완료 / 진행',`${s.byStatus.완료.rows} / ${s.byStatus.진행.rows}건`],[`${fmt(s.threshold)}원 이상`,`${s.overThresholdRows}건`]];
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>주간 비용 보고서</title><style>body{font-family:system-ui,sans-serif;background:#fafafa;color:#161616;max-width:980px;margin:48px auto;padding:24px;line-height:1.6}h1{font-size:32px}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.card{padding:20px;background:white;border:1px solid #e7e7eb;border-radius:12px}.card small{display:block;color:#596170}.card b{display:block;font-size:26px;color:#d72d48}table{width:100%;border-collapse:collapse;background:white}th,td{text-align:left;padding:12px;border-bottom:1px solid #ddd}footer{color:#596170;margin-top:28px}.table-scroll{overflow:auto}button{font:inherit;padding:10px 16px;margin:12px 0;cursor:pointer}textarea{box-sizing:border-box;width:100%;min-height:160px;padding:12px;font:inherit}@media(max-width:480px){body{margin:8px auto;padding:16px}.cards{grid-template-columns:1fr}h1{font-size:26px}}</style></head><body><main><p>WEEKLY EXPENSE REPORT · 원본 검사 통과</p><h1>주간 비용 보고서</h1><div class="cards">${cards.map(([a,b])=>`<div class="card"><small>${esc(a)}</small><b>${esc(b)}</b></div>`).join('')}</div><h2>부서별 비용</h2><div class="table-scroll"><table><thead><tr><th>부서</th><th>합계</th></tr></thead><tbody>${Object.entries(s.byDepartment).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${fmt(v)}원</td></tr>`).join('')}</tbody></table></div><h2>내 확인 기준: ${fmt(s.threshold)}원 이상</h2><p>${s.overThresholdRows}건 · ${fmt(s.overThresholdAmount)}원</p><div class="table-scroll"><table><thead><tr><th>전표</th><th>품목</th><th>금액</th><th>상태</th></tr></thead><tbody>${s.overThreshold.map(r=>`<tr><td>${esc(r.id)}</td><td>${esc(r.item)}</td><td>${fmt(r.amount)}원</td><td>${esc(r.status)}</td></tr>`).join('')||'<tr><td colspan="4">기준에 해당하는 건이 없습니다.</td></tr>'}</tbody></table></div><h2>공유할 문안</h2><textarea id="share" readonly aria-label="공유 문안">${esc(shareText(s))}</textarea><button id="copy" type="button">문안 복사</button><p id="copy-status" role="status"></p><footer>원본: ${esc(s.source.file)} / 비용내역<br>생성: ${esc(s.generatedAt)}<br>중복·필수 항목·상태·수량·단가·금액을 검사했습니다. 금액은 수량×단가로 다시 계산했습니다.<br>원본을 수정하거나 다음 주 파일을 받으면 도구를 다시 실행하세요. 이 HTML은 생성 시점의 결과입니다.</footer></main><script>document.getElementById('copy').addEventListener('click',async()=>{const a=document.getElementById('share');try{if(!navigator.clipboard)throw Error('manual');await navigator.clipboard.writeText(a.value);document.getElementById('copy-status').textContent='복사했습니다.';}catch{a.focus();a.select();document.getElementById('copy-status').textContent='문안을 선택했습니다. Ctrl+C 또는 ⌘C로 복사해 주세요.';}});</script></body></html>`;
}
const writeJson=(file,value)=>fs.writeFile(file,JSON.stringify(value,null,2)+'\n','utf8');
async function runReport(inputFile,outputDirectory,options={}) {
 const input=path.resolve(inputFile),output=path.resolve(outputDirectory),generatedAt=new Date().toISOString();
 await fs.mkdir(output,{recursive:true});
 const token=`${process.pid}-${Date.now()}`,stagedFiles=[...OUTPUT_FILES,'verification.json'];
 const previous=new Map();let sourceHash=null,checked=null,publishing=false,snapshotReady=false;
 const temporary=file=>path.join(output,`.${file}.${token}.tmp`);
 const readExisting=async file=>{try{return await fs.readFile(path.join(output,file));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 try {
  // 공개 파일을 바꾸기 전에 이전 바이트를 보관한다.
  for(const file of OUTPUT_FILES)previous.set(file,await readExisting(file));snapshotReady=true;
  if(path.extname(input).toLowerCase()!=='.xlsx')throw Error('입력은 .xlsx Excel 파일이어야 합니다.');
  const bytes=await fs.readFile(input);sourceHash=hash(bytes);checked=await inspectWorkbook(bytes,options);
  if(!checked.ok)throw Error(`원본 검사 실패: ${checked.errors.length}개 문제. verification.json의 행 번호와 안내를 확인해 주세요.`);
  const s=checked.summary;s.generatedAt=generatedAt;s.source.file=path.basename(input);s.source.sha256=sourceHash;
  if(hash(await fs.readFile(input))!==sourceHash)throw Error('실행 중 원본이 변경되었습니다. 저장하고 다시 실행해 주세요.');
  const verification={ok:true,qualityChecked:true,generatedAt,source:s.source,inputRows:s.inputRows,validRows:s.validRows,duplicateRows:0,errorRows:0,sourceUnchanged:true,threshold:s.threshold,errors:[],outputFiles:OUTPUT_FILES};
  const files={'summary.json':JSON.stringify(s,null,2)+'\n','report.html':render(s),'share.txt':shareText(s),'verification.json':JSON.stringify(verification,null,2)+'\n'};
  // 검증 기록까지 임시 저장한 뒤 공개한다. 하나라도 실패하면 이전 결과로 복구한다.
  for(const [file,content]of Object.entries(files))await fs.writeFile(temporary(file),content,'utf8');
  publishing=true;
  for(const file of stagedFiles)await fs.rename(temporary(file),path.join(output,file));
  return s;
 }catch(e){
  const rollbackErrors=[];
  if(publishing&&snapshotReady){
   for(const file of OUTPUT_FILES){try{
    const bytes=previous.get(file);
    if(bytes===null)await fs.rm(path.join(output,file),{force:true});
    else{await fs.writeFile(temporary(file),bytes);await fs.rename(temporary(file),path.join(output,file));}
   }catch(restoreError){rollbackErrors.push({code:'ROLLBACK_ERROR',field:file,message:restoreError.message});}}
  }
  // 파일이 존재했다는 추측 대신 현재 바이트와 이전 바이트를 대조한다.
  const preservedFiles=[],absentFiles=[];let outputStateRestored=snapshotReady;
  if(snapshotReady)for(const file of OUTPUT_FILES){try{
   const now=await readExisting(file),before=previous.get(file);
   if(before===null){if(now===null)absentFiles.push(file);else outputStateRestored=false;}
   else if(now!==null&&now.equals(before))preservedFiles.push(file);
   else outputStateRestored=false;
  }catch{outputStateRestored=false;}}
  const c=checked?.summary??checked;
  const failure={ok:false,qualityChecked:checked?.qualityChecked??checked?.summary?.qualityChecked??false,generatedAt,source:{file:path.basename(input),sha256:sourceHash},inputRows:c?.inputRows??null,validRows:c?.validRows??null,duplicateRows:c?.duplicateRows??null,errorRows:c?.errorRows??null,errors:[...(checked&&!checked.ok?checked.errors:[{code:'EXECUTION_ERROR',message:e.message}]),...rollbackErrors],preservedFiles,absentFiles,outputStateRestored,lastSuccessfulResultPreserved:outputStateRestored&&preservedFiles.length===OUTPUT_FILES.length};
  try{await writeJson(temporary('verification.json'),failure);await fs.rename(temporary('verification.json'),path.join(output,'verification.json'));}
  catch(recordError){e.message+=` 검증 기록 저장에도 실패했습니다: ${recordError.message}`;}
  throw e;
 }finally{
  await Promise.all(stagedFiles.map(file=>fs.rm(temporary(file),{force:true}).catch(()=>{})));
 }
}
function parseArgs(args) {
 if(args.length<2||args.length>4||(args.length>2&&(args.length!==4||args[2]!=='--threshold'||!/^\d+$/.test(args[3]))))throw Error('사용법: node integrations/local-report/weekly-report.cjs 입력.xlsx output/폴더 [--threshold 50000]');
 const threshold=args.length===4?Number(args[3]):100000;if(!Number.isSafeInteger(threshold))throw Error('기준 금액은 정수 지원 범위 안이어야 합니다.');return {input:args[0],output:args[1],threshold};
}
async function main(){try{const a=parseArgs(process.argv.slice(2)),s=await runReport(a.input,a.output,{threshold:a.threshold});console.log(`완료: ${s.inputRows}건 / ${fmt(s.totalAmount)}원 / ${path.join(a.output,'report.html')}`);}catch(e){console.error(`실패: ${e.message}`);process.exitCode=1;}}
module.exports={inspectWorkbook,runReport,render,shareText,parseArgs,REQUIRED_HEADERS};if(require.main===module)main();
