# Google Sheets·Docs·일일 스케줄 공식 확인

확인일: 2026-10-07. 사용한 자료는 Google 공식 문서다. 이 파일은 소스 확인과 구현 결정을 기록하며 실제 Google 계정 연결 완료를 뜻하지 않는다.

| 확인한 내용 | 공식 출처 | 교안에서의 적용 |
| --- | --- | --- |
| Apps Script 기본 Google 서비스는 사용자 인증·접근 권한이 필요하다 | [Google 서비스 권한](https://developers.google.com/apps-script/guides/services/authorization) | 별도 API 키·MCP 없이 시작하되 최초 권한 확인을 학습한다 |
| Sheets 범위의 getValues는 2차원 셀 값을 읽고 setValues는 범위와 같은 크기의 배열을 쓴다 | [Range](https://developers.google.com/apps-script/reference/spreadsheet/range) | Data 4열을 읽고 Dashboard A1:B8을 한 번에 쓴다 |
| 문서 탭을 조회하고 DocumentTab body를 얻을 수 있다 | [Document](https://developers.google.com/apps-script/reference/document/document) | 첫 문서 탭만 읽고 그 안의 지정 문단만 수정한다 |
| Body의 자식 조회, Paragraph의 getText/setText로 문단 단위 처리가 가능하다 | [Body](https://developers.google.com/apps-script/reference/document/body), [Paragraph](https://developers.google.com/apps-script/reference/document/paragraph) | 소개·결론을 지우지 않고 표식 사이 단일문단을 교체한다 |
| Lock은 코드의 동시 접근을 제한한다 | [LockService](https://developers.google.com/apps-script/reference/lock/) | 수동 실행·예약 실행이 겹치면 두 번째 실행은 busy로 끝난다 |
| PropertiesService는 스크립트 범위의 키/값을 저장한다 | [PropertiesService](https://developers.google.com/apps-script/reference/properties/) | 마지막 성공 해시를 저장한다. 입력·출력 파일별 키를 분리한다 |
| computeDigest에 SHA_256과 문자셋을 지정할 수 있다 | [Utilities](https://developers.google.com/apps-script/reference/utilities/utilities) | 정렬된 업무 값의 해시로 변경을 판단한다 |
| 시간 기반 트리거는 반복 실행하며 생성자 계정으로 실행된다. 다른 계정의 트리거는 볼 수 없다 | [설치형 트리거](https://developers.google.com/apps-script/guides/triggers/installable) | 단일 설치 소유자를 지정한다. 본인 생성 일정만 조회·정리한다 |
| 일일 9시 트리거의 실제 실행시각은 해당 시간대 안에서 달라질 수 있다 | [설치형 트리거: 시간 기반](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers) | 매일9시대라고 설명하고 정각 실행을 약속하지 않는다 |
| atHour·everyDays·inTimezone로 시각/빈도/시간대를 지정할 수 있다 | [ClockTriggerBuilder](https://developers.google.com/apps-script/reference/script/clock-trigger-builder) | HOUR9, everyDays1, Asia/Seoul 설정. 기존 일정의 시간 변경은 삭제 후 재생성 |
| getProjectTriggers는 현재 프로젝트·현재 사용자 기준으로 조회한다 | [ScriptApp](https://developers.google.com/apps-script/reference/script/script-app) | syncDaily이면서 CLOCK인 트리거만 중복 정리한다. 다른 함수·이벤트 보존 |
| Google 서비스와 Apps Script에는 계정 유형별 할당량·실행 제한이 있다 | [할당량](https://developers.google.com/apps-script/guides/services/quotas) | 무제한 무료로 표현하지 않는다. 실패는 실행 화면에서 확인하고 재시도한다 |

## 구현 결정과 해석

- 수업의 기본 경로는 Apps Script 내장 SpreadsheetApp/DocumentApp이다. OAuth 앱 등록·서비스 계정·API 키·Google용 MCP를 요구하지 않는다. 사용자 로그인/권한은 필요하고 조직 계정 정책에 따라 사용이 막힐 수 있다.
- 같은 데이터여도 매번 AI에게 요약시키면 불필요한 모델 사용이 생긴다. 이 실습은 고정된 합계/건수 보고서를 코드로 갱신한다. Claude는 코드 작성·문제 해결 때 사용하며 매일의 고정 집계에는 모델 호출이 없다. 실행 중 Claude 토큰을 쓰지 않는다는 의미이지 Google 사용이 무제한이라는 의미는 아니다.
- 업무 변화는 **정규화한 4열의 값**이다. 행 순서는 제외하고 빈 데이터/잘못된 금액을 중단시킨다. 실제 업무에 날짜나 다른 지표를 추가하려면 검증·해시·보고서 계약을 함께 바꾼다.
- 첫 실행은 비교 기준이 없으므로 두 출력과 해시를 만든다. 두 출력 성공 후 해시를 저장하면 한 쪽 실패를 다음 실행에서 재시도할 수 있다. 이 방식은 두 서비스의 원자적 거래를 구현하지 않는다. 일시적 출력 불일치는 생길 수 있다.
- 실습 시간에 다음 날을 기다릴 수 없으므로 일일예약은 설치·목록 확인까지 검증하고 실제 예약실행은 다음날 실행 기록을 따로 확인한다.
- Claude Code의 내부 세션 반복과 Google 클라우드 시계는 실행 장소·인증·수명·로그가 다르다. Google 서버의 트리거는 Claude 세션을 끄더라도 돌아간다. `/loop`나 Claude Routines 지원과 요금제는 별도 Anthropic 공식 확인을 따른다.
- Google MCP를 선택 확장할 때는 해당 서버가 **Sheets 읽기뿐 아니라 쓰기와 Docs 쓰기를 제공하는지** 도구 목록으로 확인해야 한다. 이 예제는 확인되지 않은 Google MCP 능력을 가정하지 않는다.

## 검증 상태

- Node 파일 모의 연결기 및 실제 Code.gs의 Google 서비스 모형 실행을 완료했다. 결과는 `_workspace/google-sync-verification.json`.
- 확인된 동작: 첫/동일/변경, 잘못된 값/빈표/중복 ID 거부, 실패 후 재시도, 성공해시 후행 저장, 소개·결론 보존, 보고서 중복 없음, 실행 lock, 타 함수·이벤트 트리거 보존, 일일 트리거 중복 방지.
- 미검증: 실제 Google 계정 OAuth·파일 접근·원격 저장·실제 예약실행·교육장 네트워크·문서 붙여넣기 문단 구조. API 문서 읽기와 로컬 모형 검증으로 이를 통과했다고 주장하지 않는다.
