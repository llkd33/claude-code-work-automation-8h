'use strict';
const fs=require('node:fs'),path=require('node:path');
const FILES=['agents/data-auditor.md','agents/dashboard-builder.md','agents/qa-reviewer.md','skills/team-dashboard/SKILL.md'];
function checkPath(root,relative,leafFile=false){
 const parts=relative.split('/');
 for(let i=1;i<=parts.length;i++){
  const p=path.join(root,...parts.slice(0,i));let s;
  try{s=fs.lstatSync(p);}catch(e){if(e.code==='ENOENT')continue;throw e;}
  if(s.isSymbolicLink()||(i===parts.length&&leafFile?!s.isFile():!s.isDirectory()))throw Error(`${relative}: 일반 ${leafFile?'파일':'폴더'} 경로가 아닙니다.`);
 }
}
function install(root,{cwd=process.cwd(),write=fs.writeFileSync}={}){
 root=fs.realpathSync(root);
 if(fs.realpathSync(cwd)!==root)throw Error('claude-work-lab 폴더에서 실행하세요.');
 const source='templates/team-starter/.claude';
 const data=FILES.map(name=>{checkPath(root,`${source}/${name}`,true);return[name,fs.readFileSync(path.join(root,source,name))];});
 for(const [name,bytes] of data){
  const rel=`.claude/${name}`;checkPath(root,rel,true);const dest=path.join(root,rel);
  if(fs.existsSync(dest)&&!fs.readFileSync(dest).equals(bytes))throw Error(`${rel}: 다른 내용이 있어 설치하지 않았습니다. 기존 파일을 보존했습니다.`);
 }
 const createdFiles=[],createdDirs=[];
 try{
  for(const [name,bytes]of data){
   const dest=path.join(root,'.claude',name);if(fs.existsSync(dest))continue;
   const relative=path.relative(root,path.dirname(dest)).split(path.sep);
   for(let i=1;i<=relative.length;i++){const dir=path.join(root,...relative.slice(0,i));if(!fs.existsSync(dir)){fs.mkdirSync(dir);createdDirs.push(dir);}}
   // Record ownership before writing so a partial write is also rolled back.
   const fd=fs.openSync(dest,'wx');createdFiles.push(dest);
   try{write(fd,bytes);}finally{fs.closeSync(fd);}
  }
 }catch(e){
  const rollbackErrors=[];
  for(const file of createdFiles.reverse())try{fs.unlinkSync(file);}catch(x){rollbackErrors.push(x.message);}
  for(const dir of createdDirs.reverse())try{fs.rmdirSync(dir);}catch(x){rollbackErrors.push(x.message);}
  throw Error(`${e.message}; 새 설치를 되돌렸습니다.${rollbackErrors.length?' 복구 확인 필요: '+rollbackErrors.join('; '):''}`);
 }
 return{status:createdFiles.length?'INSTALLED':'ALREADY_INSTALLED',scope:'project',agents:['data-auditor','dashboard-builder','qa-reviewer'],skill:'team-dashboard',created:createdFiles.length};
}
if(require.main===module){try{const root=path.resolve(__dirname,'../..');console.log(JSON.stringify(install(root)));console.log('같은 폴더에서 Claude Code를 다시 시작하고 /team-dashboard를 입력하세요. 실제 위임은 대화의 담당자 이름으로 확인합니다.');}catch(e){console.error(`설치 실패: ${e.message}`);process.exitCode=1;}}
module.exports={install,FILES};
