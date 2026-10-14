
## 2026-10-14 · 상세 데이터와 @경로 동기화

- Excel 원본의 `비용내역` 시트에서 실제 데이터 행과 금액 열을 합산: 40건·2,333,300원, 41건·2,363,300원, 다음 주 12건·1,130,900원으로 확인.
- HTML에서 뽑은 14개 `@` 파일 참조가 자료 폴더에 존재함을 확인. `내주간비용.xlsx`, `내업무비용.xlsx`는 수강생이 먼저 사본을 만들어 사용하도록 앞 단계에서 생성되는 별칭이라 예외로 확인.
- 비용 Excel·고객관리·회의록·보고서·팀 프롬프트의 TXT 및 JSON 카탈로그 문구 일치 9/9.
- 실습핸드북의 고유 ID 253개, 로컬 이미지·링크 181개를 검사. 누락 링크·중복 ID 0.
- `git diff --check`, `node tests/knowledge-offline.cjs`, `node tests/knowledge-browser.cjs` 통과.
- Chromium에서 핸드북의 P69/P82/P125 `@` 참조가 렌더링되는 것과 1440/768/375px 가로 넘침 없음, JavaScript 오류 없음 확인.
- 복붙 템플릿·실습 자료·수강생 ZIP·강사용 ZIP 네 파일의 CRC 검사 통과. Excel 파일과 계산 코드는 변경하지 않음.
- GitHub Pages run `38479431400` 성공. 공개 핸드북과 두 ZIP 파일 HTTP 200, 공개 페이지에 다음 주 Excel·파일 안내·고객 CSV `@` 경로가 반영됨.

## 2026-10-14 · 자료 색인·로컬 앱 심화·Excel 실습

- 120행 가상 Excel: 고유 전표 120건, 원본 합계 20,168,700원, 수식 재계산 확인. 제공 도구로 실행해 `완료: 120건 / 20,168,700원` 확인. X001 단가 수정 실습의 기대 합계 20,169,700원.
- 제공 비용 보고서 도구 자동화 테스트: 33/33 통과(40건 원본, 41건 수정본, 다음 주, 오류·열누락, 보존·복구 사례 포함).
- HTML: 고유 ID 264개, 섹션 제목·내부 링크·이미지 경로 검사 통과. 지식 인덱스 39 nodes / 52 edges / 158 search entries. 오프라인 검색과 Chromium 인터랙션(375/768px 포함) 테스트 통과.
- 프롬프트 P65의 색인 경로와 `CLAUDE.md` 우선 참고 지시를 HTML·교안·TXT·JSON에서 대조. P141 로컬 Excel 드롭 앱 프롬프트는 자료/교안/검색 인덱스에 반영.
- 실습자료.zip 243개, 복붙템플릿.zip 75개, 수강생 ZIP 556개, 강사용 ZIP 618개: CRC 및 AI 색인·CLAUDE.md·120건 workbook·Windows 설치 자료 포함 확인. 임시 `_workspace`와 `.inspect.ndjson` 미포함 확인.
- `git diff --check` 통과. 로컬 드래그 앤 드롭 앱은 강의용 제작 실습으로 추가했으며, 앱 자체를 구현·실행한 것은 아님.


## 2026-10-14 · GitHub Pages 재배포 확인

- 커밋 `e2dd2c7` push 후 Pages run `38485267309` 성공.
- 공개 핸드북 200, AI 참고 색인·Effort·Excel 드롭 문구 표시 확인. 실습자료.zip, 복붙템플릿.zip, 수강생 ZIP 모두 200.
- Windows 설치 스크립트 3개는 Downloads 원본과 해시 일치.
- 공개 자료 링크를 `livelikekingdavid@gmail.com`으로 발송.

## 2026-10-14 · 수강생 통합 ZIP 확인

- `수강생_통합자료.zip`: 378개 항목, 중복 항목 없음, CRC 통과. HTML 핸드북, AI 참고 색인, CLAUDE.md, 120건 workbook, Windows 설치 파일, Excel 드롭 실습 프롬프트와 PRD/IA/Journey·슬라이드 예시 포함.
- 구 ZIP 2개(실습/복붙)와 기존 수강생 ZIP을 새 패키지 내부에 넣지 않고, 단일 `실습자료/claude-work-lab` 경로에 파일을 정리했다. `node_modules`, 실행 결과 파일 없음.
- `node tests/knowledge-offline.cjs`, `node tests/knowledge-browser.cjs`, `git diff --check` 통과.
- 로컬 다운로드 안내는 단일 ZIP과 실습 폴더 경로만 안내하도록 업데이트했다. GitHub Pages 배포 후 실제 링크 상태를 추가 확인한다.


- 배포 확인: Pages run `38488679419` 성공. 공개 핸드북에 단일 다운로드 링크 3곳 표시, 통합 ZIP HTTP 200 및 원격 다운로드 SHA-256 일치. 기존 실습·프롬프트·수강생 ZIP URL은 모두 404.

## 2026-10-14 · 체크리스트 디자인 참고 실습

- P142/P143의 핸드북 입력란, 복사 본문, course-content/prompts JSON, 다운로드 TXT가 일치함을 확인.
- 첫 체크리스트 단원에 고유 ID 1개, 이미지 캡처 안내(macOS/Windows), 검색 예시, 시각 요소 3가지, 기능 보존·재확인 절차가 있음.
- 검색 인덱스 39 nodes / 52 edges / 161 entries로 재생성. knowledge-offline.cjs, knowledge-browser.cjs, git diff --check 통과.
- 통합 수강생 ZIP 382개 항목, 강사용 ZIP 619개 항목, CRC 정상. 새 이미지 자산은 추가하지 않았고, 참가자가 고른 이미지를 완성 앱에 복사하지 않도록 안내함.
- 배포 확인: Pages run 38503391479 성공. 공개 핸드북에 참고 디자인 실습/P142/P143 표시, 수강생 ZIP 382개 항목 CRC 및 SHA-256 일치. 과거 실습자료.zip·수강생_통합자료.zip 주소도 application/x-zip-compressed와 PK 서명을 반환.

## 2026-10-14 · 가상 회의록 스킬 실습

- P144/P145가 핸드북 화면, `course-content.json`, `prompts.json`, 각각의 복사 TXT와 동일한지 확인.
- 준비된 신제품 회의 원본의 제안·결정·담당자/기한 미정 예시 및 수업 자료 링크를 확인.
- 지식 검색 인덱스 재생성: 39 nodes / 52 edges / 165 entries. 오프라인·브라우저 지식 테스트 통과.
- 수강생 ZIP 385개, 강사용 ZIP 622개: 고유 항목·필수 프롬프트/샘플/핸드북 존재·CRC 검사 통과.
- 배포: commit `4d0e934`의 Pages run `38511374381` 성공. 공개 핸드북·통합 ZIP 모두 HTTP 200, 핸드북에 P144/P145 표시, 공개 ZIP 385개 항목 CRC 정상·SHA-256 `cc530bca8f2206e2b3ead62876a1a1c664d7e6a440bbc282149630b85f7d542a` (로컬 ZIP과 일치).

## 2026-10-14 · AI·Markdown 기초 개념과 개인 스킬 실습

- 초반 용어 단원에 AI → 머신러닝 → 딥러닝 → LLM 포함 관계와 고양이 사진 분류 예시를 추가. Markdown 원문/미리보기, `CLAUDE.md`·`SKILL.md` 사용처를 확인.
- P146이 핸드북·교안·단계별 가이드·`prompts.json`·`course-content.json`·다운로드 TXT와 일치함을 확인. 단원 로컬 링크 및 HTML ID 중복 없음.
- 지식 인덱스 39 nodes / 52 edges / 167 entries. 오프라인·브라우저 검색 테스트 통과(375/768px 포함).
- 수강생 ZIP 386개 항목 SHA-256 `3aa416c1884a5bc9dce45d1d2b88bb4e4f4d0e91f57a9c3d88afb074aba78c12`, 강사용 ZIP 624개 항목 SHA-256 `5f2f8436ac76373d5591709615fd0c202276fff94818a3492599594a98a63164`; 고유 항목 및 CRC 정상.

## 2026-10-14 · 초반 Markdown·AI 개념 및 개인 스킬 실습

- Pages run `38512384196` 성공 (commit `54ed5b4`).
- 공개 핸드북 HTTP 200, 246,428 bytes. Markdown 설명, 고양이 예시, P146 개인 업무 스킬 실습 포함을 확인.
- 공개 `student-materials.zip` HTTP 200, 23,725,378 bytes, 386개 항목 CRC 정상. 원격 SHA-256 `3aa416c1884a5bc9dce45d1d2b88bb4e4f4d0e91f57a9c3d88afb074aba78c12` 로컬 파일과 일치.

## 2026-10-14 · B2B SaaS 고객관리 단계별 기획

- P125가 B2B IT SaaS 세일즈 문제를 인터뷰하고 문제 정의 → IA 승인 → User Journey 승인 → PRD 승인 → 로컬 앱 제작으로 이어지는지 확인.
- 핸드북, 교안, prompt catalog, 구조화 수업 JSON, 복사 TXT의 P125 내용 완전 일치(610자). 실제 고객 정보 금지·최대 5문항·같은 PC 브라우저 저장·클라우드/로그인/API 제외 포함.
- 검색 인덱스 재생성(39개 개념, 52개 관계, 167개 검색 항목). 오프라인 검색·브라우저 테스트 및 `git diff --check` 통과.
- 수강생 자료 3종 각 386항목, 강사용 ZIP 624항목. 중복 항목 없음, CRC 통과, ZIP 안의 P125가 원본 TXT와 일치.
- 공개 배포 확인은 커밋 후 수행한다.
- Pages run `38517166522` 성공. 핸드북 HTTP 200, P125의 B2B SaaS·인터뷰·승인 단계·로컬 조건 표시 확인. 공개 `student-materials.zip` 386개 항목 CRC 정상, 공개 SHA-256 `883d14794260735d033de6fcc7926c2365d56dcd07aea6fe2322ad99aa54703b`가 로컬과 일치.
- 최종 공개 확인: commit `b672f22`, Pages run `38517338994` 성공. 공개 핸드북 HTTP 200에서 “로컬 전용” 및 승인 흐름을 확인했다. `student-materials.zip` HTTP 200, 386개 항목 CRC 정상, SHA-256 `70c5ad894045768dc3527b11bcc81d6bbd48cc558b68992858110fca726aa1a1` 일치.
