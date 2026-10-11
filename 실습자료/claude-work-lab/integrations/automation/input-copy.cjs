'use strict';
const fs=require('node:fs/promises'),path=require('node:path');const {LAB_ROOT,noSymlinks}=require('./paths.cjs');
const SOURCES={original:'주간비용_실습.xlsx',changed:'주간비용_수정후.xlsx',next:'주간비용_다음주.xlsx',error:'주간비용_오류.xlsx',missing:'주간비용_열누락.xlsx'};
async function copyInput(name,{labRoot=LAB_ROOT}={}){
 if(!Object.hasOwn(SOURCES,name))throw Error('선택: original | changed | next | error | missing');
 const source=path.join(labRoot,'workbooks',SOURCES[name]),input=path.join(labRoot,'inbox/주간비용.xlsx');await noSymlinks(source,labRoot);await noSymlinks(input,labRoot);await fs.mkdir(path.dirname(input),{recursive:true});
 const temporary=input+'.copy-'+process.pid+'.tmp';try{await fs.copyFile(source,temporary);await fs.rename(temporary,input);}finally{await fs.rm(temporary,{force:true});}
 return {name,input};
}
async function main(){try{const args=process.argv.slice(2);if(args.length!==1)throw Error('사용법: node integrations/automation/input-copy.cjs original|changed|next|error|missing');const result=await copyInput(args[0]);console.log(`입력 변경: ${result.name} → inbox/주간비용.xlsx`);}catch(e){console.error('실패: '+e.message);process.exitCode=1;}}
module.exports={copyInput,SOURCES};if(require.main===module)main();
