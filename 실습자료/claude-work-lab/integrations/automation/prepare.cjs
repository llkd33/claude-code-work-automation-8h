'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const {LAB_ROOT,noSymlinks}=require('./paths.cjs');
async function prepare({reset=false,labRoot=LAB_ROOT}={}){
 const input=path.join(labRoot,'inbox/주간비용.xlsx'),source=path.join(labRoot,'workbooks/주간비용_실습.xlsx');
 await noSymlinks(input,labRoot);await noSymlinks(source,labRoot);await fs.mkdir(path.dirname(input),{recursive:true});
 if(!reset){try{await fs.copyFile(source,input,require('node:fs').constants.COPYFILE_EXCL);return {copied:true,input};}catch(e){if(e.code==='EEXIST')return {copied:false,input};throw e;}}
 const temporary=input+'.prepare-'+process.pid+'.tmp';try{await fs.copyFile(source,temporary);await fs.rename(temporary,input);}finally{await fs.rm(temporary,{force:true});}
 return {copied:true,input,reset:true};
}
async function main(){try{const args=process.argv.slice(2);if(args.length>1||(args.length===1&&args[0]!=='--reset'))throw Error('사용법: node integrations/automation/prepare.cjs [--reset]');const result=await prepare({reset:args[0]==='--reset'});console.log(result.copied?'준비 완료: inbox/주간비용.xlsx':'기존 inbox/주간비용.xlsx를 보존했습니다.');}catch(e){console.error('실패: '+e.message);process.exitCode=1;}}
module.exports={prepare};if(require.main===module)main();
