'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {inspectWorkbook}=require('../local-report/weekly-report.cjs');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function metric(html,name){
 const re=new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\bdata-metric=["']${name}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,'gi');
 const matches=[...html.matchAll(re)];assert.equal(matches.length,1,`${name}: 숫자 요소는 정확히 하나여야 합니다.`);
 const value=matches[0][2].trim();assert.match(value,/^(?:\d+|\d{1,3}(?:,\d{3})+)$/,`${name}: 숫자만 표시하세요.`);return Number(value.replaceAll(',',''));
}
async function verify(root,htmlRelative='output/team-dashboard.html'){
 root=await fs.realpath(root);const htmlPath=path.resolve(root,htmlRelative);
 assert.ok(htmlPath.startsWith(path.join(root,'output')+path.sep)&&path.extname(htmlPath)==='.html','새 HTML은 output 안에 있어야 합니다.');
 const dir=path.join(root,'output/local-final');
 for(const name of ['summary.json','verification.json','report.html','share.txt'])assert.ok((await fs.stat(path.join(dir,name))).isFile(),`${name}: 파일이 없습니다.`);
 const s=JSON.parse(await fs.readFile(path.join(dir,'summary.json'),'utf8')),v=JSON.parse(await fs.readFile(path.join(dir,'verification.json'),'utf8'));
 assert.equal(v.ok,true,'이번 원본 검사가 실패했습니다.');assert.equal(v.qualityChecked,true);assert.equal(v.sourceUnchanged,true);assert.deepEqual(v.errors,[]);
 assert.equal(s.qualityChecked,true);assert.equal(s.qualityStatus,'passed');assert.equal(s.generatedAt,v.generatedAt);
 for(const key of ['inputRows','validRows','duplicateRows','errorRows']){assert.ok(Number.isSafeInteger(s[key])&&s[key]>=0);assert.equal(s[key],v[key]);}
 assert.equal(s.inputRows,s.validRows+s.duplicateRows+s.errorRows);assert.equal(s.validRows,s.byStatus.완료.rows+s.byStatus.진행.rows);
 assert.equal(s.totalAmount,Object.values(s.byDepartment).reduce((a,b)=>a+b,0));
 assert.equal(s.source.file,path.basename(s.source.file),'원본 파일명 경로가 잘못되었습니다.');assert.equal(s.source.kind,'local-xlsx');assert.equal(s.source.sha256,v.source.sha256);assert.equal(s.source.file,v.source.file);
 const bytes=await fs.readFile(path.join(root,'workbooks',s.source.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),s.source.sha256,'원본이 보고서 생성 이후 바뀌었습니다.');
 const recalculated=await inspectWorkbook(bytes,{threshold:s.threshold});assert.equal(recalculated.ok,true,'원본 재계산에 실패했습니다.');
 for(const key of ['inputRows','validRows','duplicateRows','errorRows','totalAmount','byDepartment','byStatus'])assert.deepEqual(JSON.parse(JSON.stringify(s[key])),JSON.parse(JSON.stringify(recalculated.summary[key])),`${key}: 원본 재계산과 다릅니다.`);
 let html=await fs.readFile(htmlPath,'utf8');
 // Comments and executable/style text cannot supply displayed values to the checker.
 html=html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
 assert.match(html,/<html\b/i,'HTML 문서가 아닙니다.');
 const metrics={inputRows:s.inputRows,validRows:s.validRows,duplicateRows:s.duplicateRows,errorRows:s.errorRows,totalAmount:s.totalAmount,completedRows:s.byStatus.완료.rows,inProgressRows:s.byStatus.진행.rows};
 for(const [name,value]of Object.entries(metrics))assert.equal(metric(html,name),value,`${name}: 화면 숫자 요소가 집계와 다릅니다.`);
 const rows=[...html.matchAll(/<tr\b[^>]*\bdata-department=["']([^"']*)["'][^>]*>([\s\S]*?)<\/tr>/gi)];assert.equal(rows.length,Object.keys(s.byDepartment).length,'부서 행 수가 다릅니다.');
 for(const [name,value]of Object.entries(s.byDepartment)){
  const matches=rows.filter(r=>r[1]===esc(name));assert.equal(matches.length,1,`${name}: 부서 행을 확인하세요.`);
  const cells=[...matches[0][2].matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi)];assert.ok(cells.some(c=>c[2].trim()===esc(name)),`${name}: 부서명이 표시되지 않습니다.`);
  const amount=cells.filter(c=>/\bdata-amount=/.test(c[1]));assert.equal(amount.length,1);assert.ok(amount[0][1].includes(`data-amount="${value}"`)||amount[0][1].includes(`data-amount='${value}'`));assert.equal(amount[0][2].trim(),value.toLocaleString('ko-KR'),`${name}: 표시 금액이 다릅니다.`);
 }
 for(const [attr,value]of [['data-source-file',s.source.file],['data-generated-at',s.generatedAt]]){
  const matches=[...html.matchAll(new RegExp(`<([a-z][a-z0-9]*)\\b[^>]*\\b${attr}(?:\\s*=\\s*["'][^"']*["'])?[^>]*>([\\s\\S]*?)<\\/\\1>`,'gi'))];assert.equal(matches.length,1);assert.equal(matches[0][2].trim(),esc(value));
 }
 return{status:'PASS',sourceRecalculated:true,inputRows:s.inputRows,totalAmount:s.totalAmount,htmlSourceChecked:true,browserChecked:false,html:path.relative(root,htmlPath)};
}
if(require.main===module){verify(path.resolve(__dirname,'../..'),process.argv[2]).then(result=>console.log(JSON.stringify(result))).catch(e=>{console.error(`FAIL: ${e.message}`);process.exitCode=1;});}
module.exports={verify};
