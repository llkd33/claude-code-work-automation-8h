<!-- sheets-docs:live-workbook -->
# 주 실습: 가져온 Excel의 같은 Data로 매일 확인하기

## 먼저 읽기 · 주 실습과 작은 모의의 구분

M2에서 XLSX 40건을 Workspace MCP로 가져와 E003을 수정하고 E041을 추가했다면 **같은 spreadsheet ID**를 M3 CONFIG에 넣습니다. 새 Data 탭을 만들거나 아래 보조 예제의 3건 TSV를 주 실습 표에 붙이지 않습니다. MCP 설정은 [Google MCP 준비](../google-mcp/README.md)를 봅니다.

| 확인 시점 | 건수 | 총액(원) | 완료 | 진행 |
| --- | ---: | ---: | ---: | ---: |
| 가져오기 직후 | 40 | 2,333,300 | 29 | 11 |
| E003 수정 후 | 40 | 2,338,300 | 30 | 10 |
| E041 추가 후 | 41 | 2,363,300 | 31 | 10 |

주 실습 시작 기준은 Data41건·2,363,300원·완료31·진행10입니다. 첫 수동 실행은 새 Apps Script 프로젝트에서 initialized, 두 번째는 unchanged입니다. 첫 실행 전에 Data 네 열과 수식 결과를 읽습니다. 아직 E041을 추가하지 못했다면 실제 시점/숫자를 기록하고 41건 성공으로 쓰지 않습니다.

1. M2의 Sheets URL에서 ID를 복사해 Code.gs `CONFIG.SPREADSHEET_ID`에 넣습니다. SOURCE_SHEET는 `Data`, DASHBOARD_SHEET는 `Dashboard`, TIMEZONE은 `Asia/Seoul`, HOUR는9입니다. 새 Docs ID도 넣습니다. `config.example.json`은 참고값이고 자동 로드되지 않습니다.
2. 새 Docs 첫 탭에 아래 세 줄을 각각 Enter로 나눈 일반 문단으로 둡니다. 두 표식 사이에는 정확히 일반 문단 하나만 두며 빈 문단을 더 넣지 않습니다. 소개와 결론은 밖에 사람이 작성합니다. 표/목록/Shift+Enter를 쓰지 않습니다.

```text
[[AUTO_REPORT_START]]
자동 보고서 대기
[[AUTO_REPORT_END]]
```

3. Core.gs와 Code.gs를 넣고 `syncDaily`를 수동 실행합니다. Dashboard A1:B8만 쓰며 A1 `CLAUDE_LAB_DASHBOARD`와 기존 D6:G9 부서 영역을 보호합니다. Data/상세/다른 탭을 지우지 않습니다. M2의 B3:B6 수식은 즉시 재계산되지만 첫 Apps Script 쓰기 후 A1:B8은 **마지막 sync 값**으로 바뀝니다. 이후 표만 수정하면 다음 sync까지 KPI와 Docs는 이전 값일 수 있습니다. 오른쪽 D6:G9 부서 수식은 계속 즉시 반영되므로 두 영역의 기준 시점을 구분합니다.
4. 같은 데이터 재실행에서 unchanged와 쓰기 생략을 확인합니다. E003의 ID·현재 단가를 먼저 읽고 기본 배치의 `비용내역!K4`를 15,000→16,000으로 바꿉니다. 행이 이동했다면 확인한 E003 행에 씁니다. 금액 수식과 Data 링크를 보존합니다. 재계산 후 41건·2,364,300원·완료31·진행10을 확인하고 `syncDaily`에서 changed를 봅니다. 이후15,000으로 원복하고 재실행하면2,363,300원으로 돌아옵니다. 같은 값 재입력은 변화가 아닙니다. 별도 모의의35,000/48,000원과 구분합니다.
5. 오류/Docs 실패 후 이전 성공 해시와 재시도를 확인합니다. 상세/수식은 복구하고 소개·결론·부서 영역이 보존되는지 확인합니다. 해시·잠금·비원자적 두 출력의 실패 계약은 아래 원문을 따릅니다.
6. 별도 25분 스케줄 시간에 `installDailyTrigger`, 목록, 단일 소유자, 9시대 실행, `removeDailyTrigger`를 확인합니다. 다음 날 실제 예약 실행은 별도 기록합니다.

50분 배분: 0–5 흐름과 M2 ID 확인 / 5–15 Docs·코드 / 15–25 권한·첫 실행 / 25–35 같음·변경 / 35–45 오류·재시도 / 45–50 보존·기록. OAuth와 XLSX 가져오기는 사전 준비와 M2에서 진행합니다.

이 반복 실행은 Apps Script가 Sheets/Docs 서비스를 직접 호출하므로 Google MCP가 매일 실행할 필요가 없습니다. M2의 대화/MCP 호출은 모델 토큰을 쓰고, LLM을 호출하지 않는 수식/Apps Script 실행은 모델 토큰을 쓰지 않습니다. Google 할당량은 별도입니다.

이 자료의 작성·정적 검증은 실제 계정 인증, XLSX의 Google 가져오기, Excel/Sheets의 네이티브 재계산 성공을 증명하지 않습니다.
수업 전 강사 계정과 수강생의 허용된 실습 계정에서 가져오기·수식·쓰기·보고서 권한을 확인합니다.
실패하면 오류와 미확인을 기록하고 강사 시연 또는 별도 모의를 사용합니다. 모의를 실제 Google 성공으로 표시하지 않습니다.


## 아래 원문은 별도 3건·35,000원 보조 예제와 공통 코드 계약

아래 `Data 탭 채우기`와 TSV 교체 절차는 **새 보조 Sheets 또는 로컬 모의**에서만 사용합니다. 주 실습의 40→41건 Data를 덮어쓰는 절차가 아닙니다. 3건/35,000과 4건/48,000은 모의 테스트 정답입니다. 문서 표식·CONFIG·잠금·해시·저장/재시도·트리거 규칙은 주 실습에도 동일하게 적용합니다. 원문을 남겨 코드 계약과 실패 재현 명령을 보존합니다.

<!-- sheets-docs:legacy-contract -->

# 매일 확인하는 업무판: Sheets → 대시보드 → Docs

오늘의 목표는 **업무 표가 바뀌었을 때만 대시보드와 보고서를 고치는 도구**입니다. Claude Code가 코드를 만들고 고칩니다. Google Apps Script가 실제 Google 파일을 읽고 쓰고, Google의 시계가 매일 실행합니다. 이 경로는 Google용 MCP 설치나 API 키가 필요하지 않습니다. Google 로그인과 파일 접근 권한은 필요합니다. Claude Code 내부 `/loop`와 비교하는 설명은 핸드북 스케줄 절을 함께 봅니다.

완료 기준: 첫 실행 → 같은 데이터 재실행 → 값 변경 후 실행을 확인하고, 소개·결론이 유지되며 실패 후 다시 실행할 수 있으면 완료입니다. 실제 Google을 쓰지 못하면 로컬 모의 실습을 완료하고 기록에 **모의 실행만 완료**라고 적습니다.

## 수업 전 준비

- 개인별 실습 Google 계정, Sheets·Docs 편집 권한, Apps Script 실행 허용. 회사 계정 정책으로 차단되면 강사 시연/모의 경로를 사용합니다. 제한을 우회하지 않습니다.
- 가상 데이터만 넣는 새 Sheets 1개와 새 Docs 1개. 실무 공유 문서를 연결하지 않습니다.
- 입력 탭 이름 `Data`. 출력은 전용 `Dashboard` 탭입니다. 자동화는 이 탭 A1:B8만 씁니다. 다른 자료가 있는 탭을 출력으로 설정하지 않습니다.
- 금액은 원 단위 숫자, 상태는 `진행` 또는 `완료`. `id`는 T001처럼 고유한 문자입니다. Google Sheets에서 머리글은 정확히 `id`, `team`, `amount`, `status` 4개를 유지합니다.

## 50분 실습 순서

| 시간 | 작업 | 눈으로 확인할 결과 |
| --- | --- | --- |
| 0–5분 | 데이터·문서·경로 이해 | 표 → 판단 → 두 결과물 그림 설명 |
| 5–15분 | 파일 복제, 표 붙여 넣기, Claude에 구현 요청 | Data 탭과 Apps Script 코드 |
| 15–25분 | ID 설정, 권한 확인, 첫 실행 | initialized, 3건·35,000원 |
| 25–35분 | 같은 데이터와 변경 데이터 각각 실행 | unchanged 다음 changed |
| 35–45분 | 잘못된 금액/보고서 표식 오류 확인 | 중단, 기존 완료 해시 유지 |
| 45–50분 | 소개·결론 보존 확인, 실습 기록 | 정상/실패/재시도 증거 3개 |

스케줄 생성·정리는 뒤의 별도 시간에 진행합니다. 코드 생성이 오래 걸리면 강사가 검증한 `Core.gs`·`Code.gs`를 제공하고 한 가지 규칙만 수정합니다.

### 1. Data 탭 채우기

`input/sheets-snapshots/01-initial.tsv`를 텍스트 편집기로 열어 전체 내용을 복사하고 Data 탭 A1에 붙입니다. JSON은 로컬 모의 실습용이고 TSV는 Sheets 붙여넣기용입니다. 탭 구분이 제대로 들어갔는지 4열을 확인합니다. 입력 범위에 별도 메모 열을 추가하지 않습니다.

| 스냅샷 | 기대 결과 |
| --- | --- |
| 01-initial | 3건, 35,000원, 완료 2건, 진행 1건, initialized |
| 02-same | 행 순서만 다름. unchanged, 대시보드·보고서 다시 쓰지 않음 |
| 03-changed | 4건, 48,000원, 완료 3건, 진행 1건, changed |
| 04-malformed | 잘못된 금액 때문에 중단. 직전 성공 결과 유지 |

다음 표로 바꿀 때 Data의 기존 A:D 내용을 지우고 새 TSV를 A1에 붙입니다. 빈 상태에서 실행하지 않습니다. 전체 삭제는 데이터 유실일 수도 있으므로 이 예제는 빈 표를 오류로 처리합니다. 정상적으로 일부 행이 삭제된 표는 변경으로 처리합니다.

### 2. 보고서 문서 만들기

새 Docs의 **첫 탭**에 `docs-template.txt`의 내용을 붙입니다. 다음 세 줄은 각자 별도의 일반 문단이어야 합니다. Enter로 줄을 나누고, 표/목록/Shift+Enter 줄바꿈을 사용하지 않습니다. 표식 사이에는 `자동 보고서 자리` 문단 하나만 둡니다.

```text
[[AUTO_REPORT_START]]
자동 보고서 자리
[[AUTO_REPORT_END]]
```

시작과 끝 표식은 정확히 한 번씩 씁니다. 문서 앞의 소개와 뒤의 결론은 직접 작성한 영역입니다. 도구는 표식 사이 문단 하나만 바꿉니다. 첫 탭 밖은 이 실습에서 다루지 않습니다.

### 3. Claude Code에 짧게 요청하기

아래 요청을 작은 작업 단위로 사용합니다. 생성→로컬 검증→Google 수동 실행 순서입니다. 토큰을 줄이려면 오류 전체와 전체 코드를 반복해서 붙이지 말고 함수명·관련 오류·기대값만 줍니다.

```text
Google Apps Script V8로 교육용 업무 자동화를 만들어줘.
입력: Data 탭 4열 id/team/amount/status. id 고유문자, amount는 0 이상 정수,
status는 진행/완료. 빈 표·중복 id·잘못된 열·잘못된 값이면 오류로 중단.
행을 id 순서로 정규화하고 SHA-256 해시로 마지막 성공 데이터와 비교해.
처음에는 기준을 만들고, 같으면 출력에 쓰지 말고, 다르면 두 출력을 갱신해.
출력1: 전용 Dashboard 탭 A1:B8에 갱신시각·건수·총액·완료·진행·해시.
출력2: Docs 첫 탭의 [[AUTO_REPORT_START]]와 [[AUTO_REPORT_END]]
사이 일반문단 하나만 교체. 소개/결론/다른 탭은 보존. append 금지.
출력 전 표식과 전용 Dashboard 여부를 점검하고, LockService로 중복 실행 방지.
Sheets flush와 Docs saveAndClose 성공 후에만 성공 해시를 저장.
실패하면 이전 성공 해시를 유지해서 다음 실행에서 재시도.
CONFIG에 두 파일 ID와 탭명·Asia/Seoul·HOUR:9를 둬.
순수 검증·변경판단 로직은 Core.gs, Google 연결은 Code.gs로 분리해.
syncDaily / installDailyTrigger / removeDailyTrigger 함수를 만들고,
현재 사용자의 syncDaily CLOCK 트리거만 1개 유지, 다른 트리거는 보존해.
실제 계정 연결/예약 설치는 하지 말고 필요한 수동 단계만 안내해.
```

```text
검사만 해줘. 정상 3건/35000원, 행순서만 변경하면 unchanged,
변경 후 4건/48000원, 빈표/금액문자 오류, Docs 저장실패 후 재시도를
Google 서비스 모형으로 실행해. 소개·결론과 성공해시 보존을 확인해.
실제 Google 실행과 모의 검증을 구분해 5줄로 보고해.
```

### 4. Apps Script에 설정하고 첫 실행

1. Sheets에서 **확장 프로그램 → Apps Script**를 엽니다. Code.gs에 Google 연결 코드를 붙이고, 새 스크립트 파일 Core.gs에 핵심 로직을 붙입니다. 강사 완성본은 `core.js` 내용을 Core.gs로 사용합니다. `.cjs` 모의 실행기를 여기에 붙이지 않습니다.
2. 두 파일 URL의 `/d/` 다음 ID를 CONFIG에 넣습니다. Sheets 예: `/spreadsheets/d/파일ID/edit`, Docs 예: `/document/d/파일ID/edit`. `config.example.json`은 값 참고용입니다. JSON 파일을 Apps Script에서 자동으로 읽는 구조가 아닙니다. 키/토큰을 입력할 필요가 없습니다.
3. 프로젝트 설정 시간대를 Asia/Seoul로 맞춥니다. CONFIG의 TIMEZONE도 같습니다. 함수 선택에서 `syncDaily`를 고르고 **실행**합니다.
4. 권한 화면에서 계정과 읽기/쓰기 범위를 확인합니다. 본인이 만든 교육 코드를 본인의 가상 파일에 쓰는 경우에만 진행합니다. 조직 정책에 막히면 강사에게 알리고 모의 실습으로 전환합니다.
5. 실행 로그에 `initialized`, Dashboard에 35,000, Docs에 갱신 내용이 있는지 확인합니다. 이 단계는 Google 계정에서 직접 실행해야 검증됩니다.

### 5. 같은 것·다른 것·오류 확인

- Data를 `02-same.tsv`로 바꾸고 실행: `unchanged`. 데이터 행 순서는 업무 값의 변화로 보지 않습니다. 대시보드의 갱신시각과 문서도 그대로입니다.
- Data를 `03-changed.tsv`로 바꾸고 실행: `changed`. Dashboard와 Docs 모두 48,000원입니다. 문서의 소개·결론도 그대로입니다.
- Data의 한 금액을 `숫자가 아님`으로 바꾸고 실행: 오류로 중단. 입력을 정상 숫자로 되돌려 다시 실행합니다. **빈 금액을 0으로 간주하지 않습니다.**
- 변경 데이터인데 문서 표식이 없어도 출력 전에 중단합니다. 표식 수정 후 다시 실행하면 반영됩니다. 같은 데이터일 때는 출력 영역을 다시 검사/수리하지 않습니다.
- 보고서 저장만 실패하면 대시보드가 먼저 바뀔 수 있습니다. 두 Google 파일을 하나의 거래로 묶지는 못합니다. 성공 해시는 이전 값이라 다음 수동/일일 실행이 두 출력을 다시 맞춥니다. 원인 수정 후 `syncDaily`를 실행합니다.

### 6. 하루 한 번 예약하고 정리하기

수동 검증 세 번을 끝낸 후 **별도 스케줄 실습 시간**에 진행합니다.

1. `installDailyTrigger`를 한 번 실행합니다. 왼쪽 트리거 화면에서 syncDaily / 시간 기반 / 일일 일정이 1개인지 확인합니다. 반복 설치해도 현재 사용자 기준 같은 함수의 시계 트리거는 1개 유지됩니다. 다른 이벤트 트리거는 건드리지 않습니다.
2. CONFIG의 `HOUR: 9`, `TIMEZONE: 'Asia/Seoul'`은 **매일 오전 9시대** 실행을 뜻합니다. 09:00 정각은 보장되지 않습니다. 이미 있는 트리거의 시각을 바꾸려면 `removeDailyTrigger`로 지우고 다시 설치합니다.
3. Google 서버에서 트리거 생성자 계정으로 실행됩니다. Claude Code와 PC가 켜져 있을 필요는 없습니다. 계정 권한·할당량·실패 여부는 Google의 Apps Script 실행 화면에서 확인합니다. 당일 수업 중 수동 실행 통과만으로 다음 날 예약 실행까지 통과했다고 쓰지 않습니다.
4. 동일 스크립트의 트리거는 **한 명의 소유자**가 설치합니다. 다른 사용자의 트리거는 조회/삭제할 수 없습니다. 여러 계정으로 같은 파일에 설치하지 않습니다.
5. 교육 종료 시 `removeDailyTrigger`를 실행하거나 트리거 화면에서 실습 항목을 삭제합니다. 필요한 운영 일정은 검증을 마친 후 소유자를 정해 별도 보존합니다. 이 함수는 현재 사용자의 syncDaily 시계 트리거만 삭제합니다.

## Google 계정이 준비되지 않았다면

강사가 제공한 `google-sync` 완성본을 `reference/google-sync`에 놓았다고 가정합니다. 터미널은 `claude-work-lab` 폴더에서 엽니다. 강사 경로가 다르면 실제 경로에 맞게 바꿉니다.

```text
node reference/google-sync/simulate.cjs input/sheets-snapshots/01-initial.json output/google-sync
node reference/google-sync/simulate.cjs input/sheets-snapshots/02-same.json output/google-sync
node reference/google-sync/simulate.cjs input/sheets-snapshots/03-changed.json output/google-sync --fail-at=docs
node reference/google-sync/simulate.cjs input/sheets-snapshots/03-changed.json output/google-sync
```

세 번째 명령은 실패 재시도 학습을 위해 일부러 실패합니다. 이전 state.json 해시가 유지되고 네 번째에서 `changed`가 나와야 합니다. `dashboard.json`, `docs.json`, `report.md`, `state.json`을 확인합니다. `.json`과 `.md` 파일은 Google 화면을 흉내 낸 **로컬 결과**입니다. 실제 Sheets/Docs/MCP 연결·클라우드 스케줄 검증으로 기록하지 않습니다. 모의 실행 중 강제 종료로 sync.lock이 남았으면 다른 실행이 없는 것을 확인하고 출력 폴더의 그 잠금 파일만 삭제합니다.

## 실습 기록

```text
실행 경로: Google 실제 / 로컬 모의 / 강사 시연
첫 실행: 건수 __ 총액 __ 상태 __
같은 데이터: unchanged 여부 __ 쓰기 생략 여부 __
변경 데이터: 건수 __ 총액 __ 소개·결론 보존 여부 __
실패와 재시도: 실패 원인 __ 이전 해시 유지 __ 재시도 결과 __
일정: 설치 안 함 / 설치 및 목록 확인 / 다음 날 실제 실행까지 확인
정리: 트리거 삭제 여부 __
```

공식 근거는 교안의 `research/Google연동_스케줄_공식확인.md`를 봅니다. 이 실습은 1,000건 이하의 표, 단일 실행 소유자, 단순 Docs 일반문단으로 범위를 제한합니다. 문서 전체 편집·실무 이메일 전송·실시간 동기화·그래프 웹서비스 배포는 별도 확장입니다.
