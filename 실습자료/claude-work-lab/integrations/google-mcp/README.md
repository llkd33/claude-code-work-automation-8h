# Google Workspace MCP · Excel → Google Sheets

이 수업은 커뮤니티 프로젝트 [Workspace MCP](https://github.com/taylorwilsdon/google_workspace_mcp/tree/v2.0.1) **v2.0.1**의 local stdio 연결을 사용합니다. Google 공식 제품이 아닙니다. 실제 Google 실계정 실행은 강사가 사전 리허설합니다. 이 교안 제작 단계에서는 실계정 변환·권한·서식 호환은 미확인입니다.

## 수업 전에 준비 (강사·수강생)
1. 교육용 Google 계정과 Google Cloud 프로젝트를 준비합니다. 관리 계정이라면 조직에서 외부 OAuth·Apps Script를 허용하는지 먼저 확인합니다.
2. 같은 Cloud 프로젝트에서 Drive API, Sheets API, Docs API를 사용 설정합니다.
3. Google Auth Platform에서 앱 동의 화면·Audience를 설정합니다. 테스트 상태라면 교육 계정을 Test users에 추가합니다. 사용할 범위는 서버가 요청하는 Drive·Sheets·Docs 접근을 실제 동의 화면에서 확인합니다. 서비스만 제한했다고 모든 권한이 파일 하나로 제한되는 것은 아닙니다.
4. OAuth client ID의 앱 유형을 **Desktop application**으로 만듭니다. 다운로드한 JSON은 수업 프로젝트 밖의 개인 비밀파일 폴더에 보관합니다. 파일 내용을 AI에 붙여 넣지 않습니다. 개인별 설정 또는 기관 관리 방식을 사전 선택합니다.
5. [uv 공식 설치](https://docs.astral.sh/uv/getting-started/installation/)를 따라 설치하고 터미널에서 `uvx --version`을 확인합니다. Python3.10+ 환경을 준비합니다. 패키지는 최초 실행 때 네트워크 다운로드가 필요합니다.
6. 아래 환경 변수를 **실습 폴더의 터미널**에 설정한 후 같은 터미널에서 등록·Claude 시작을 합니다. 경로는 내 컴퓨터에 존재하는 절대 경로로 바꿉니다.

### macOS · zsh
```sh
export GOOGLE_CLIENT_SECRET_PATH="/내/개인/비밀폴더/client_secret.json"
export ALLOWED_FILE_DIRS="$PWD/workbooks"
```
### Windows · PowerShell
```powershell
$env:GOOGLE_CLIENT_SECRET_PATH="C:\내\개인\비밀폴더\client_secret.json"
$env:ALLOWED_FILE_DIRS=(Resolve-Path .\workbooks).Path
```
ALLOWED_FILE_DIRS는 import 도구가 읽을 수 있는 로컬 폴더입니다. v2.0.1 기본값에는 내 실습 폴더가 없으므로 반드시 workbooks 폴더만 추가합니다. 이 변수는 Sheets 온라인 셀 편집 권한과 다릅니다. 인증파일은 이 허용폴더 안에 두지 않습니다. 새 터미널을 열면 변수를 다시 설정합니다.

### 프로젝트 등록 · 두 운영체제 공통
```text
claude mcp add --transport stdio --scope project workspace-google -- uvx --from workspace-mcp==2.0.1 workspace-mcp --transport stdio --tools drive sheets docs --tool-tier extended
claude mcp list
claude --model claude-sonnet-5-5 --effort medium --permission-mode default
```
Claude에서 /mcp를 열어 연결·프로젝트 서버 승인을 확인합니다. 기존 서버가 있으면 등록을 반복하지 말고 해당 설정을 확인합니다. 최초 인증 도구 호출 시 서버가 안내하는 브라우저 로그인으로 위 교육용 계정을 인증합니다. 성공한 read/import 도구 응답으로 연결을 확인합니다. OAuth2.1 hosted HTTP 설정과 로컬 stdio 설정을 혼합하지 않습니다. 로컬 경로를 쓰기 위해 이번 수업은 로컬 서버를 사용합니다.

## 복사할 실습 요청
아래 [내 이메일]은 교육 계정으로 바꿉니다. 실제 spreadsheet_id는 첫 응답의 ID를 재사용합니다. file_path는 MCP 서버가 볼 수 있는 절대 경로이며, 파일을 Base64로 출력할 필요가 없습니다.
### 1. 가져오기
```text
교육용 Google 계정: [내 이메일]
workbooks/주간비용_실습.xlsx를 Google Sheets로 가져와줘.
workspace-google의 import_to_google_sheets를 사용하고, 로컬 파일의 절대 경로를 file_path로 전달해줘. source_format은 xlsx, 새 이름은 "내이름_주간비용_실습".
원본 Excel은 보존. 파일을 Base64나 전체 데이터로 대화에 출력하지 마.
새로 만든 spreadsheet_id와 URL만 알려주고 notes/sheet-link.md에 저장해줘. 이미 이 기록이 있으면 해당 ID를 확인해서 재사용. 가져오기 결과가 불명확하면 같은 파일을 다시 만들지 말고 제목으로 검색해서 확인해줘.
```

### 2. 작은 범위 조회
```text
notes/sheet-link.md에 기록한 교육용 spreadsheet_id로만 진행해줘.
get_spreadsheet_info로 탭 이름을 확인하고 read_sheet_values로 Dashboard!A1:B8, Dashboard!D6:G9, 비용내역!A1:N6만 읽어줘. 수식 변환 확인은 비용내역!L2와 Data!A2:D2만 include_formulas=true로 추가 조회.
4개 탭 존재 여부와 총액·건수·완료/진행을 5줄 안에 알려줘. 예상 초기값은 40건/2333300원/완료29/진행11.
수식 변환 문제가 있거나 값이 다르면 수정하지 말고 실제 범위와 차이를 알려줘. 전체 표를 읽지 마.
```

### 3. 단가·상태 수정
```text
같은 교육용 spreadsheet_id에서 read_sheet_values로 비용내역!A2:A41을 조회해 E003이 정확히 한 건인지 찾아줘.
해당 행 J:M을 include_formulas=true로 조회해 현재 값과 L의 수식을 확인. 수량1/단가10000/상태진행인 경우에만 modify_sheet_values로 단가(K)를 숫자15000, 상태(M)를 완료로 바꿔줘. 서로 떨어진 두 셀을 따로 수정해줘.
수량·금액(L) 수식·다른 행은 보존. 값을 비우지 마. 조건이 다르면 중단.
수정 뒤 해당 행과 Dashboard!A1:B8을 다시 읽어 40건/2338300원/완료30/진행10인지 확인해줘. 합계가 갱신되지 않으면 수식 변환과 재계산 문제를 알려줘. 변경 전후와 실제 호출 결과만 5줄로 정리.
```

### 4. 새 비용 추가
```text
같은 교육용 spreadsheet_id에서 비용내역!A2:A42로 E041 중복 여부, 비용내역!A42:N42와 Data!A42:D42가 비었는지 먼저 확인해줘. 중복/다른 내용이 있으면 쓰지 마.
modify_sheet_values(value_input_option="USER_ENTERED")로 비용내역!A42:N42에 아래 values(2차원 문자열 배열)를 넣어줘. 수량·단가는 Google이 숫자로 해석하게 해줘:
[["E041","2026-09-11","마케팅","인쇄비","행사 안내 카드","가상 서윤","가상 인쇄상사","법인카드","가을행사","1","25000","=J42*K42","완료","MCP로 추가하는 연습용 건"]]
이어 Data!A42:D42에 [["='비용내역'!A42","='비용내역'!C42","='비용내역'!L42","='비용내역'!M42"]]를 USER_ENTERED로 넣어줘.
두 범위를 include_formulas=true로 재조회해 값·수식을 확인하고 Dashboard를 다시 읽어 41건/2363300원/완료31/진행10인지 확인해줘.
둘 중 한 쓰기가 실패하면 성공한 범위를 기록하고 중단. 다음 요청은 해당 ID와 두 범위를 확인한 뒤 누락된 부분만 복구. 행을 중복 추가하지 마.
```

### 5. 내 보고서
```text
같은 교육용 spreadsheet_id에서 Dashboard!A1:B8와 Dashboard!D6:G9만 MCP로 읽어줘.
실제 값으로 output/sample/summary.json을 저장: inputRows와 validRows는 실제 건수, duplicateRows와 errorRows는0, totalAmount는 총액, byDepartment는 세 부서 합계. 이0은 오류검사 결과가 아니라 이번 정상 가상표의 계약이야.
일치 여부(총액=세 부서 합, 건수=완료+진행)를 검사하고, 값이 안 맞거나 셀이 비어 있으면 생성 중단. output/sample/snapshot-meta.json에는 sheetURL과 queriedAt을 실제 링크·조회시각으로 별도 저장.
이 JSON만 읽어 카드 4개·부서별 표·Sheet 링크·조회 시각을 보여주는 output/sample/report.html을 만들어줘. Node 기본 기능으로 JSON→HTML 만드는 scripts/report.cjs도 만들고 node scripts/report.cjs로 재생성되게 해줘. 외부 텍스트는 HTML 이스케이프.
직접 실행해서 파일과 숫자를 확인해줘. 이 파일은 조회 시점의 스냅샷이라고 표시. 변경 파일·실행 명령·검증 숫자만 알려줘. 전체 코드·표 출력 금지.
```

## 확인과 복구
- import_to_google_sheets 응답은 Drive 파일 ID와 링크를 반환합니다. ID를 기록하고 get_spreadsheet_info로 탭4개를 확인합니다. .xlsx 보관만 된 상태와 native Google Sheet를 구분합니다.
- 초기40건2333300원 → E003수정40건2338300원 → E041추가41건2363300원. 원본은 바꾸지 않습니다. 이미 추가한 E041을 다시 추가하지 않습니다.
- Excel 금액 L열 수식과 Data 연결 수식을 Google에서 실제 재조회합니다. dropdown·조건부서식·표 스타일은 변환 때 달라질 수 있으며 그대로 보존된다고 약속하지 않습니다. 값·수식·탭이 완료 기준입니다.
- E003 수정 시 K/M 두 셀만 쓰기. L금액수식/수량/다른행 보존. 빈 수량·단가 삭제는 실습하지 않습니다.
- E041 추가는 비용내역과Data 두 쓰기로 구성됩니다. 일부 성공하면 기록하고 누락된 부분만 복구합니다. 전체 요청을 맹목적으로 반복하지 않습니다.
- /rewind는 Google 변경을 복구하지 않습니다. 전표번호·현재값을 확인하고 이전값을 해당셀에 넣거나 Google 버전 기록을 사용합니다.
- `file_path` 인자가 없으면 hosted/diskless 설정일 수 있습니다. 서버의 실제 도구 스키마를 확인합니다. 도구명을 추측해서 실행하지 않습니다.
- 계정 연결·도구 호출은 모델 사용량을 쓰며 고정 절약률을 보장하지 않습니다. 필요한 범위만 읽고, 이후 수식 계산/Node재실행/Apps Script일일반복은 AI 호출 없이 수행합니다.

## 제작자·공식 근거
- [등록 방법 — Claude Code MCP](https://code.claude.com/docs/en/mcp)
- [서버 설치·OAuth 유형](https://workspacemcp.com/quick-start)
- [고정버전 CLI parser](https://github.com/taylorwilsdon/google_workspace_mcp/blob/v2.0.1/main.py)
- [import_to_google_sheets 소스](https://github.com/taylorwilsdon/google_workspace_mcp/blob/v2.0.1/gdrive/drive_tools.py)
- [read/modify_sheet_values 소스](https://github.com/taylorwilsdon/google_workspace_mcp/blob/v2.0.1/gsheets/sheets_tools.py)
- [로컬 경로 허용 검사](https://github.com/taylorwilsdon/google_workspace_mcp/blob/v2.0.1/core/utils.py)
- [OAuth JSON 경로 로드](https://github.com/taylorwilsdon/google_workspace_mcp/blob/v2.0.1/auth/oauth_config.py)
- [Google의 Excel → Sheets 변환 지원](https://developers.google.com/workspace/drive/api/guides/manage-uploads)
