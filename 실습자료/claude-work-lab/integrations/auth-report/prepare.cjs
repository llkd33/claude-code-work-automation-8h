'use strict';
const {prepare}=require('./launch.cjs');
if(process.argv.length!==2){console.error('사용법: node integrations/auth-report/prepare.cjs');process.exitCode=1;}
else prepare().then(r=>console.log(`입력 폴더: ${r.inbox} · ${r.created?'샘플 Excel을 복사했습니다.':'기존 Excel을 유지했습니다.'}`)).catch(()=>{console.error('입력 폴더 준비 실패: 실습 폴더와 샘플 Excel을 확인해 주세요.');process.exitCode=1;});
