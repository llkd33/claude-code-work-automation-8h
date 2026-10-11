'use strict';
const fs=require('node:fs/promises'),path=require('node:path');
const LAB_ROOT=path.resolve(__dirname,'../..');
function within(file,root){const rel=path.relative(root,file);return !!rel&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel);}
async function noSymlinks(target,labRoot){
 const rel=path.relative(labRoot,target);let cursor=labRoot;
 for(const segment of rel.split(path.sep)){cursor=path.join(cursor,segment);try{if((await fs.lstat(cursor)).isSymbolicLink())throw Error('실습 경로에는 바로가기·심볼릭 링크를 사용할 수 없습니다: '+cursor);}catch(e){if(e.code==='ENOENT')return;throw e;}}
}
async function safePaths(input,output,labRoot=LAB_ROOT){
 const source=path.resolve(labRoot,input),destination=path.resolve(labRoot,output);
 if(!within(source,path.join(labRoot,'inbox'))||path.extname(source).toLowerCase()!=='.xlsx')throw Error('입력은 이 실습 폴더의 inbox 안에 있는 .xlsx 파일이어야 합니다.');
 if(!within(destination,path.join(labRoot,'output')))throw Error('출력은 이 실습 폴더의 output 아래 별도 폴더여야 합니다.');
 await noSymlinks(source,labRoot);await noSymlinks(destination,labRoot);
 for(const name of ['summary.json','report.html','share.txt','verification.json','run-log.jsonl','watch-state.json','.watch.lock'])await noSymlinks(path.join(destination,name),labRoot);
 return {source,destination};
}
module.exports={LAB_ROOT,within,noSymlinks,safePaths};
