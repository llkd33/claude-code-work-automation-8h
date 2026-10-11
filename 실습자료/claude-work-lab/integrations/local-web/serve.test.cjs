'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {createHandler}=require('./serve.cjs');
test('실제 임시 파일의 읽기·HEAD·없는 파일·POST와 폴더 밖 symlink를 확인한다',async t=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'customer-static-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));
 const root=path.join(directory,'app');await fs.mkdir(root);await fs.writeFile(path.join(root,'index.html'),'<h1>가상 고객</h1>');
 await fs.writeFile(path.join(directory,'private.txt'),'outside');await fs.symlink(path.join(directory,'private.txt'),path.join(root,'leak.html'));
 const handler=createHandler(root);
 async function request(url,method='GET'){const result={};await handler({url,method},{writeHead(code,headers){result.code=code;result.headers=headers},end(body){result.body=body}});return result;}
 const index=await request('/');assert.equal(index.code,200);assert.equal(index.body.toString(),'<h1>가상 고객</h1>');assert.match(index.headers['Content-Type'],/html/);
 assert.equal((await request('/','HEAD')).body,undefined);assert.equal((await request('/missing.html')).code,404);
 assert.equal((await request('/','POST')).code,405);assert.equal((await request('/leak.html')).code,403);
 assert.equal((await request('/%00')).code,400);assert.equal((await request('/%E0')).code,400);
});
