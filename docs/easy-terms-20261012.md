# 용어·자연어 연결·그림 개편 · 2026-10-12

## 바꾼 흐름
- 용어를 시작 직후로 옮겼다. 프롬프트·에이전트·스킬·CLAUDE.md·MCP·하네스를 한 줄 뜻과 업무 예시로 소개한다. AI·머신러닝·딥러닝·LLM도 짧게 설명한다.
- 다른 용어는 초반의 펼침 항목에 모았다. 스킬·규칙·팀·Gmail 실습에서 한 줄로 다시 연결한다.
- Gmail P104는 /mcp 대신 자연어로 연결 확인과 도움을 부탁한다. Google 로그인·권한 허용은 수강생이 직접 한다. 설정 화면 경로는 막혔을 때 펼쳐 본다.
- Gmail과 스킬 그림을 쉽게 바꿨다. 중복 팀 기술 도식을 빼고 쉬운 역할 그림을 유지했다. PRD·IA·사용자 여정은 고객 한 명의 이야기로 먼저 연결하고 실제 문서 그림은 펼쳐 본다.

## 이미지 제작
내장 image_gen 사용. 두 결과를 assets에 복사했다. 기존 그림은 삭제하지 않았다.

### 41-Gmail-쉽게보기.png · 생성 프롬프트
Warm watercolor three-panel beginner Korean office comic. Worker asks connection help; worker handles browser login and approval. Robot places an email into a draft tray, no sending. Human opens and checks the saved draft. Ivory background, orange and sage accents, large clear Korean labels only: “Gmail 초안 만들기”, “연결을 도와줘”, “초안으로 저장해줘”, “내가 열어 확인”. No code, API/MCP/OAuth, filenames, tiny text, outbound send arrows or automatic login claims. Explanatory illustration, not real software screenshot.

### 42-스킬-쉽게보기.png · 편집 프롬프트
Edit existing 32-스킬저장과재사용.png, preserve watercolor and same worker in three panels. Remove English/code/file names/name/description/SKILL.md. Papers use simple bullets/checkmarks. Large Korean heading “스킬 = 다시 쓰는 업무 설명서”. Panels: “내 기준 말하기” with “결정과 할 일만”; “정리 방법 저장”; “다음 메모에도 쓰기”. Show two different notes using the same instruction card to make similarly structured reports. No training-model or guaranteed-accuracy claims.

## 검증
독립 읽기 검수에서 목차 위치 한 건을 발견해 수정했다. 기존 메모 키와 장·프롬프트 ID는 보존했다. 실제 브라우저에서 이미지 18개·복사 54개·팀 3개·계획 탭 3개·메모 저장·기존 기본값 이관·375/768/1280px 화면 확인. JavaScript 오류 없음. 계산·인증·감시 실행 소스와 Excel 변경 없음.

실제 Gmail 로그인·도구 호출은 수행하지 않았다. 설명 근거: [Claude Code MCP](https://code.claude.com/docs/en/mcp#use-mcp-servers-from-claudeai), [Google Workspace 연결](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors).
