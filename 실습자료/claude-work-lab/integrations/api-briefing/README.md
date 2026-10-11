# 외부 API 필수 실습: 비용 보고서에 USD 참고액 추가

오늘 만든 비용 요약을 읽고 외부 API가 반환한 USD → KRW 기준환율로 **교육용 100 USD의 참고금액**을 계산합니다. 국내비용과 외화 참고액은 별도 항목입니다. 두 금액을 합산하지 않습니다.

제공 도구를 직접 실행한 뒤 금액만 바꿔 다시 실행합니다. 전체 코드를 새로 작성하거나 API 키를 발급받을 필요가 없습니다. API가 현재 환율 데이터를 제공하고 도구가 값을 검증·계산해 파일에 저장합니다. `share.txt`는 문안 파일이며 메일이나 메시지를 보내지 않습니다.

## 준비

- Node.js 22 또는 24 LTS. `node --version`으로 숫자를 확인합니다. 이 도구는 추가 `npm install` 없이 동작합니다.
- 터미널의 현재 폴더는 압축을 푼 **claude-work-lab**입니다. Claude 대화창 대신 일반 터미널에서 아래 명령을 실행합니다.
- `output/local-final/summary.json`이 이미 있어야 합니다. 직전 비용 보고서 결과이며 입력 파일을 덮어쓰지 않습니다.
- 인터넷 연결. 학교·회사 네트워크에서 `api.frankfurter.dev`에 접속할 수 있어야 합니다.
- `--amount`는 교육용 USD 금액입니다. 0 이상, 소수 둘째 자리까지 입력합니다.

## 1. 100 USD로 한 번 실행

아래 한 줄을 터미널에 붙여넣고 Enter를 누릅니다. 결과가 나타날 때까지 최대 10초 기다립니다.

```sh
node integrations/api-briefing/briefing.cjs --amount 100 --summary output/local-final/summary.json --output output/api
```

정상 화면: `"ok": true`, `"mode": "LIVE"`, `"apiConnectionVerified": true`.

이 명령은 인터넷에서 기준환율을 한 번 조회하고 기존 요약의 건수·합계를 확인한 뒤 네 결과 파일을 만듭니다. Excel 원본을 수정하거나 Google에 업로드하지 않습니다.

## 2. 파일을 열고 세 가지 확인

파일 탐색기 또는 Finder에서 `claude-work-lab/output/api`로 이동합니다.

| 열 파일 | 확인할 내용 |
|---|---|
| `briefing.html` | 브라우저로 열기. `LIVE` 표시, 국내비용 총액, 100 USD의 참고 원화금액이 따로 보이는가? |
| `rate.json` | 편집기로 열기. `base: USD`, `quote: KRW`, 0보다 큰 `rate`, 기준일 `date`, 조회시각 `queriedAt`이 있는가? |
| `share.txt` | 국내비용·USD 참고액·출처·기준일·조회시각이 모두 있는가? `합산하지 않습니다` 문장이 있는가? |
| `verification.json` | `status: PASS`, `mode: LIVE`, `apiConnectionVerified: true`인가? |

고정 정답 환율은 없습니다. 정상 금액은 `100 × rate`를 원 단위로 반올림한 값입니다. 국내비용은 수정 후 파일을 보고서로 만들었다면 **41건 / 2,363,300원**이어야 합니다. 주말·휴일에는 기준일이 오늘보다 앞설 수 있습니다. 10일보다 오래된 값은 보고서에 확인 문구가 나타납니다.

## 3. 200 USD로 바꿔 다시 실행

명령의 `100`을 `200`으로 바꿉니다. 다른 부분은 그대로 둡니다.

```sh
node integrations/api-briefing/briefing.cjs --amount 200 --summary output/local-final/summary.json --output output/api
```

`briefing.html`을 새로고침합니다. USD 금액이 200으로 바뀌었는지, 참고 원화금액이 **이번 실행의 rate × 200**인지 확인합니다. 반올림과 환율 갱신 때문에 첫 결과의 정확한 두 배와 1원 차이가 나거나 환율 자체가 달라질 수 있습니다. 국내비용 41건·2,363,300원은 그대로여야 합니다.

Claude 요청이 필요하면 이 한 문장만 사용합니다. 이미 결과를 직접 확인했다면 요청하지 않아도 됩니다.

> output/api/verification.json을 읽고 LIVE 연결 여부와 기준일만 알려줘.

## 막히면

| 화면 또는 상황 | 다음 행동 |
|---|---|
| `node`를 찾을 수 없음 | Node LTS 설치 후 터미널을 닫고 다시 엽니다. `node --version`부터 확인합니다. |
| `MODULE_NOT_FOUND` | 현재 폴더가 `claude-work-lab`인지 확인합니다. `integrations`와 `workbooks`가 함께 보여야 합니다. |
| `ENOENT` / `summary.json` 없음 | 앞 단계의 로컬 비용 보고서를 먼저 실행합니다. `output/local-final/summary.json` 경로를 확인합니다. |
| `fetch failed` / `ENOTFOUND` | API 주소의 DNS 또는 네트워크 문제입니다. `output/api/error.json`을 열고 실패로 기록합니다. 브라우저에서 공식 사이트가 보이는 것만으로 Node 연결 성공을 표시하지 않습니다. |
| `HTTP 429`, `503` 또는 대기 시간 초과 | 서비스 상태와 네트워크를 확인합니다. 강사 안내 후 한 번 재시도합니다. 계속 실패하면 아래 명시적 DEMO로 동선만 연습합니다. |
| 통화·환율·날짜 검증 실패 | API 응답을 성공으로 처리하지 않습니다. 오류 문구를 강사에게 보여줍니다. 컴퓨터 날짜도 확인합니다. |
| 비용 요약의 건수·합계 불일치 | 정상 Excel 입력으로 로컬 보고서를 다시 만듭니다. 오류를 숨기기 위해 summary.json 값을 손으로 바꾸지 않습니다. |
| 파일이 계속 이전 값 | 브라우저 새로고침 후 조회시각을 확인합니다. `error.json`이 있으면 최신 실행은 실패한 것입니다. |
| 실행을 멈추고 싶음 | 터미널에서 Ctrl+C. 예약 작업을 설치하지 않으며 명령을 실행할 때만 조회합니다. |

### 네트워크가 막힌 경우: DEMO임을 표시하고 연습

자동으로 예시 데이터를 대체하지 않습니다. 강사와 연결 실패를 확인한 뒤 아래 명령으로 **별도의 api-demo 폴더**에 고정 교육 예시를 만듭니다.

```sh
node integrations/api-briefing/briefing.cjs --amount 100 --summary output/local-final/summary.json --fixture integrations/api-briefing/demo-rate.json --output output/api-demo
```

정상 DEMO: `mode: DEMO`, `apiConnectionVerified: false`. `briefing.html`과 `share.txt`에 **DEMO / 실제 API 연결 미확인**이 보입니다. 고정 예시 환율 1,350으로 100 USD → 135,000원, 200 USD → 270,000원입니다. 실제 API 데이터가 아닙니다. 결과 확인 동선만 연습한 상태로 기록하고 실연동 항목은 미완료로 남깁니다.

## 결과와 실패의 구분

- 성공하면 네 파일이 함께 만들어집니다. 기존 결과를 갱신하며 이전 `error.json`은 제거합니다.
- API·입력 검증이 실패하면 기존 정상 결과 네 파일을 유지하고 `error.json`에 이번 실패를 별도로 기록합니다. 기존 보고서의 조회시각을 최신 실행으로 해석하지 않습니다.
- 파일 게시 중 오류가 나면 이전 파일 바이트를 복구합니다. 복구까지 실패한 경우 `previousOutputsPreserved: false`로 표시합니다. 이 경우 결과를 사용하지 말고 오류를 해결한 뒤 다시 실행합니다.
- 예기치 않은 전원 종료 때 파일 전체의 원자적 저장을 보장하는 도구는 아닙니다. 결과 무결성은 `verification.json`에 있는 세 파일의 SHA-256과 대조할 수 있습니다.
- `--summary` 없이 실행하면 환율 브리핑만 만듭니다. 수업에서는 기존 비용 보고서와 연결하도록 `--summary`를 포함합니다.

## 공식 근거와 도구 검증

[Frankfurter v2 공식 문서](https://frankfurter.dev/)와 [공식 OpenAPI](https://api.frankfurter.dev/v2/openapi.json)를 2026-10-08에 확인했습니다. 키가 필요 없는 API이며 ECB 제공자 경로의 단일 응답은 `date / base / quote / rate`입니다. USD/KRW는 제공자의 두 통화 기준값에서 계산될 수 있습니다. 이 실습은 기준환율을 사용한 참고 계산이며 은행·카드의 거래환율·수수료·실제 결제금액을 다루지 않습니다.

강사용 회귀 검사:

```sh
node --test integrations/api-briefing/briefing.test.cjs
```

26개 검사에는 HTTP 오류·네트워크 실패·대기 시간 초과·잘못된 응답·0 USD·명시적 DEMO·요약 보존·출력 해시·실패 시 이전 결과 복구가 포함됩니다. 테스트의 LIVE 응답은 주입된 테스트 응답입니다. 실제 외부 연결 확인은 일반 LIVE 명령을 따로 실행해야 합니다.
