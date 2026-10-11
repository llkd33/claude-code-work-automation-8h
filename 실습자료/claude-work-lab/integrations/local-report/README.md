# Excel 한 장으로 주간 비용 보고서 만들기

내가 고른 기준으로 비용을 확인하고 다음 주 파일로 다시 실행하는 도구입니다. Google 계정 연결 없이 같은 실습 Excel을 사용합니다. 원본을 검사한 뒤 보고서와 공유 문안을 만들며 원본은 바꾸지 않습니다.

## 1. 사전 준비 · 한 번만

Claude Code에서 `claude-work-lab` 폴더를 열고 다음처럼 요청하세요.

> 이 폴더의 로컬 비용 보고서 실습을 준비해 줘. Node 20 이상인지 확인하고, 아래 사전 준비 명령을 실행한 다음 Excel 읽기 도구가 설치됐는지 알려 줘. 설치가 안 되면 이유를 알려 주고 멈춰.

```bash
node --version
npm ci --prefix integrations/local-report
```

최초 설치에는 인터넷이 필요합니다. 교육장에서는 수업 전에 설치를 끝내 주세요. 설치가 끝나면 실행 중 외부 API·Google 계정을 사용하지 않습니다. Mac과 Windows 모두 같은 `node` 명령을 사용합니다. Node가 없다면 강사와 사전 준비 시간에 설치합니다.

## 2. 첫 결과 만들기

> workbooks/주간비용_실습.xlsx를 읽고 원본의 중복·빈 항목·금액을 확인해 줘. 통과하면 output/local-initial에 보고서와 공유 문안을 만들어 줘. 아래 명령을 실제로 실행하고 verification.json을 확인해 줘. 원본 Excel은 수정하지 마.

```bash
node integrations/local-report/weekly-report.cjs workbooks/주간비용_실습.xlsx output/local-initial
```

`output/local-initial/report.html`을 브라우저에서 엽니다. 첫 결과는 **40건 · 2,333,300원**이어야 합니다. 완료 29건 / 진행 11건도 함께 확인합니다. 문안 복사 버튼을 눌러 복사합니다. 브라우저가 복사를 허용하지 않으면 문안이 선택되므로 Ctrl+C 또는 ⌘C로 복사합니다.

## 3. 내 기준 하나 바꾸기

> 나는 5만 원 이상인 비용을 먼저 확인하고 싶어. 기준을 50000으로 바꿔 다시 실행해 줘. 전체 합계가 그대로인지, 확인할 건수·문안·보고서가 실제로 달라졌는지 보여 줘.

```bash
node integrations/local-report/weekly-report.cjs workbooks/주간비용_실습.xlsx output/local-personal --threshold 50000
```

기본 기준은 10만 원입니다. `--threshold 50000`은 **5만 원 이상**인 건을 표시합니다. 내 업무에 맞는 금액 하나를 정하고 선택한 이유를 실행 카드에 적습니다. 기준을 바꾸면 총액은 그대로이고 확인할 목록이 바뀝니다.

## 4. 다시 쓰고 오류도 확인하기

> 수정후 파일, 다음주 파일로 같은 도구를 다시 실행해 줘. 입력과 출력 경로만 바꾸고 내 기준은 유지해 줘. 다음주 결과는 원본 행·부서 합계·완료/진행으로 검증하고 실행 기록에 적어 줘.

```bash
node integrations/local-report/weekly-report.cjs workbooks/주간비용_수정후.xlsx output/local-changed --threshold 50000
node integrations/local-report/weekly-report.cjs workbooks/주간비용_다음주.xlsx output/local-next --threshold 50000
```

수정후는 E003 단가·상태 변경과 E041 추가를 반영한 파일입니다. 다음주 파일은 열 순서가 달라도 **헤더 이름**으로 읽습니다.

오류를 확인할 때는 마지막 성공 결과가 있는 `output/local-initial`을 그대로 사용해 봅니다.

```bash
node integrations/local-report/weekly-report.cjs workbooks/주간비용_오류.xlsx output/local-initial
```

이 명령은 실패하는 것이 정답입니다. `verification.json`의 문제 행·항목을 읽고 마지막 정상 보고서·요약·공유 문안이 그대로 남았는지 확인합니다. 잘못된 파일에서 성공한 것처럼 보고서를 만들지 않습니다. 오류 파일을 복사해 한 번 수정하고 재검사하는 과정은 Claude Code와 진행합니다.

## 가져갈 결과 4개

| 파일 | 확인할 내용 |
|---|---|
| `report.html` | 열어서 보는 보고서와 내 기준에 해당하는 비용 |
| `share.txt` | 동료에게 공유할 문안 |
| `summary.json` | 계산 숫자·완료/진행·부서별 합계·내 기준·원본 검사 상태 |
| `verification.json` | 이번 실행의 통과/실패, 검사 항목과 문제 행 |

성공 보고서가 남아 있어도 **이번 실행의 `verification.json`이 실패이면 최신 입력의 보고서가 아닙니다.** 입력을 고치고 다시 실행해야 합니다. 원본은 읽기만 합니다. Excel 수정 후에는 저장을 마치고 실행하세요.

## 도구가 받는 입력

- `.xlsx` 파일의 `비용내역` 탭, 첫 행이 헤더입니다.
- 필수 헤더: 전표번호, 부서, 품목, 수량, 단가, 금액, 처리상태. 열 위치는 바뀌어도 됩니다. 헤더 중복은 오류입니다.
- 전표번호는 같은 파일 안에서 중복되면 안 됩니다. 부서·품목·처리상태가 비면 중단합니다. 상태는 `완료` 또는 `진행`입니다.
- 수량은 양의 정수, 단가는 0 이상의 원화 정수입니다. 숫자 서식으로 표시하는 쉼표는 괜찮지만 `'1,000'` 같은 문자 숫자나 수량·단가 수식은 중단합니다. 소수 수량은 이 실습 도구에서 지원하지 않습니다.
- 금액은 같은 행의 수량×단가 수식 또는 그 계산과 같은 정수여야 합니다. 빈 금액·다른 계산·다른 행 참조는 중단합니다. 수식은 `J2*K2`, `K2*J2`, 절대 참조 `$J$2*$K$2`, 같은 식의 괄호를 지원합니다. 열 순서를 바꾸면 수식도 해당 헤더의 셀을 참조해야 합니다.
- 금액은 수량×단가로 다시 계산합니다. 허용 수식의 오래된 저장 결과나 비어 있는 계산 결과를 합계로 믿지 않습니다. Excel 전체 수식, 회계 규칙, 날짜 유효성을 검사하는 도구는 아닙니다.

## 강사·검수용

```bash
npm test --prefix integrations/local-report
```

실제 Excel 5종과 합성 Excel을 읽어 정상/수정/다음주/열순서/중복/빈값/누락/수식/원본불변/실패시 마지막 성공 결과 보존을 검사합니다. 실행 시각은 재실행할 때 달라집니다. 공개 파일 교체나 검증 기록 저장에 실패하면 이전 보고서·요약·문안의 바이트를 복구하고 실제 파일을 다시 읽어 보존 여부를 확인합니다. 복구 자체도 실패하면 `outputStateRestored`와 `lastSuccessfulResultPreserved`를 `false`로 기록합니다. 공유 문안에는 실제 생성 시각과 입력 파일·탭 이름을 함께 담습니다.

ExcelJS 4.4.0과 ZIP 처리용 JSZip 3.10.1을 고정하고 전체 종속 버전을 `package-lock.json`에 저장합니다. 실습 원본의 SpreadsheetML namespace 표기는 ExcelJS가 읽는 형태로 정규화합니다. 이 정규화는 메모리에서만 합니다. 보고서와 관계없는 원본 Excel의 표·그림 배치는 읽지 않습니다. 셀과 수식 해석은 ExcelJS가 담당합니다. 원본 파일을 재저장하지 않습니다. 설치된 `node_modules`는 배포 ZIP에 넣지 않고 수업 전에 `npm ci`로 설치합니다.
