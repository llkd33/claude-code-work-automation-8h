'use strict';
// Local static files only. Customer records stay in browser localStorage.
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.csv':'text/csv; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
function createHandler(directory){
 const base=fs.realpath(path.resolve(directory));
 return async(req,res)=>{
  const reply=(code,text)=>{res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end(text)};
  if(!['GET','HEAD'].includes(req.method))return reply(405,'읽기만 지원합니다.');
  try{
   const root=await base;
   const route=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
   if(route.includes('\0')||route.includes('\\'))return reply(400,'잘못된 경로입니다.');
   const candidate=path.resolve(root,'.'+(route==='/'?'/index.html':route));
   if(candidate!==root&&!candidate.startsWith(root+path.sep))return reply(403,'실습 폴더 밖은 열 수 없습니다.');
   const file=await fs.realpath(candidate);
   if(!file.startsWith(root+path.sep))return reply(403,'실습 폴더 밖은 열 수 없습니다.');
   const type=MIME[path.extname(file).toLowerCase()];
   if(!type||(await fs.stat(file)).isDirectory())return reply(404,'화면 파일이 없습니다.');
   const data=await fs.readFile(file);
   res.writeHead(200,{'Content-Type':type,'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(req.method==='HEAD'?undefined:data);
  }catch(error){reply(error instanceof URIError?400:404,'화면 파일을 확인해 주세요.');}
 };
}
if(require.main===module){
 const [directory,rawPort='4318',...extra]=process.argv.slice(2),port=Number(rawPort);
 if(!directory||extra.length||!Number.isInteger(port)||port<1024||port>65535){console.error('화면 폴더와 로컬 포트를 확인해 주세요.');process.exitCode=1;}
 else fs.realpath(path.resolve(directory)).then(root=>{
  const server=http.createServer(createHandler(root));
  server.on('error',()=>{console.error('로컬 화면을 열 수 없습니다. 같은 포트를 쓰는 앱이 있는지 확인해 주세요.');process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`고객관리 화면: http://127.0.0.1:${port}/ · 종료: Ctrl+C`));
 }).catch(()=>{console.error('생성된 화면 폴더가 없습니다. 먼저 앱을 만들어 주세요.');process.exitCode=1;});
}
module.exports={createHandler};
