# 입력을 바꾸면 보고서가 다시 만들어지는 자동화

켜 둔 Node 프로그램이 `inbox/주간비용.xlsx`를 반복 확인합니다. 첫 입력과 변경된 입력은 보고서를 만들고 같은 입력은 건너뜁니다. 잘못된 입력은 마지막 정상 결과를 보존하며 다음 확인에서 다시 시도합니다.

이 실습은 **이미 만든 보고서 도구를 Node가 반복 실행하는 자동화**입니다. Claude가 계속 판단하고 수정하는 AI 에이전트 루프와 구분합니다. 노트북이 켜져 있고 터미널이 열려 있는 동안만 동작합니다.

## 준비

`claude-work-lab` 폴더에서 시작합니다. 사전 준비 때 다음 두 명령을 실행합니다.

```bash
npm ci --prefix integrations/local-report
node integrations/automation/prepare.cjs
```

원본 Excel을 감시할 학생 사본 `inbox/주간비용.xlsx`로 복사합니다. 기존 사본이 있으면 보존합니다. 기본 원본으로 되돌릴 때만 `node integrations/automation/prepare.cjs --reset`을 사용합니다. `workbooks` 안의 제공 원본은 수정하지 않습니다.

## 1. 터미널 두 개 열고 자동 확인 시작

Claude Code에서 터미널을 두 개 열고 모두 `claude-work-lab` 폴더인지 확인합니다. **첫 번째 터미널**에 붙여 넣습니다.

```bash
node integrations/automation/watch.cjs --input inbox/주간비용.xlsx --output output/auto --interval 5 --checks 12 --threshold 50000
```

첫 확인은 바로 실행합니다. 이후 5초 간격으로 최대 12번, 약 1분 동안 확인합니다. 60초가 지나면 새 검사를 시작하지 않으며 진행 중인 검사는 안전하게 마무리합니다. `generated`가 나오면 `output/auto/report.html`을 엽니다. 사본이 기본 원본이면 **40건 · 2,333,300원**입니다. 내가 정한 5만 원 이상 기준도 보입니다.

## 2. 두 번째 터미널에서 입력 바꾸기

프로그램이 돌아가는 동안 **두 번째 터미널**에서 입력 사본을 바꿉니다.

```bash
node integrations/automation/input-copy.cjs next
```

다음 확인에서 `generated`가 나오면 `report.html`을 새로고침합니다. 다음주 파일의 건수·총액이 반영되어야 합니다. 이후에는 `skipped`가 나오며 보고서를 불필요하게 다시 만들지 않습니다. `output/auto/run-log.jsonl`에서 `generated`와 `skipped`를 확인합니다.

이 명령은 학생 사본만 명시적으로 교체합니다. 제공 Excel은 그대로 둡니다. 수업에서는 다음주 교체를 먼저 준비하고 실행해 약 1분 안에 변경과 건너뛰기를 확인합니다.

## 3. 종료하고 개인 기록 남기기

첫 번째 터미널에서 **Ctrl+C**를 누릅니다. 검사 중이면 현재 결과의 저장·복구를 안전하게 마친 뒤 종료합니다. 최대 횟수에 도달하면 스스로 종료합니다.

`output/auto/watch-state.json`의 `status`는 `stopped`가 됩니다. `outcome`은 정상 예산 종료 `completed`, 내가 중단한 경우 `interrupted`입니다. 생성·건너뛰기·오류 횟수가 `counts`에 남습니다.

실행 카드에 다음 세 줄을 적습니다.

- 내가 감시한 입력과 선택한 금액 기준
- 입력 변경 → 자동 생성 → 같은 입력 건너뛰기를 확인한 로그
- 종료 이유와 마지막 결과 파일

## 두 번째 실행에서 오류와 복구 확인

첫 번째 실행을 종료한 뒤 다시 시작합니다. 다음주 정상 결과가 이미 있으면 첫 확인은 `skipped`일 수 있습니다.

```bash
node integrations/automation/watch.cjs --input inbox/주간비용.xlsx --output output/auto --interval 5 --checks 12 --threshold 50000
```

두 번째 터미널에서 오류 사본을 넣습니다.

```bash
node integrations/automation/input-copy.cjs error
```

다음 확인에서 `error`가 나오면 `verification.json`의 문제 행을 읽습니다. HTML·요약·공유 문안은 마지막 정상 결과이며 실패 입력의 결과가 아닙니다. 오류를 고치지 않으면 다음 확인도 재시도합니다.

정상 사본으로 되돌립니다.

```bash
node integrations/automation/input-copy.cjs next
```

다시 `generated`가 나오고 `verification.json`의 `ok`가 `true`가 되는지 확인합니다. Ctrl+C로 종료합니다. **실패했던 해시를 성공 처리하지 않습니다.** 실패 뒤 같은 정상 사본으로 되돌려도 다시 검사하여 성공 기록을 갱신합니다.

## 결과와 작은 설정

| 위치 | 역할 |
|---|---|
| `inbox/주간비용.xlsx` | 내가 바꿔 넣는 학생 사본 |
| `output/auto/report.html` | 마지막 정상 보고서 · 브라우저 새로고침 |
| `output/auto/summary.json`, `share.txt` | 마지막 정상 숫자와 공유 문안 |
| `output/auto/verification.json` | 최근 보고서 생성 시도의 통과/실패 |
| `output/auto/run-log.jsonl` | 이번 확인 결과를 한 줄씩 추가한 기록 |
| `output/auto/watch-state.json` | 현재 상태·종료 이유·이번 실행의 횟수·마지막 성공 해시 |

`--threshold 50000`의 숫자 하나를 내 기준으로 바꿀 수 있습니다. 기본값은 50000입니다. 간격은 0.05~5초, 검사 횟수는 1~12회입니다. 수업에서는 기본 5초/12회를 사용합니다. 경로는 이 실습 폴더의 `inbox` 안 `.xlsx`와 `output` 아래 폴더로 제한합니다. 원본 `workbooks`를 출력으로 덮어쓰거나 바로가기·심볼릭 링크를 사용하면 중단합니다.

`input-copy.cjs`의 선택은 `original`(40건 원본), `changed`(수정후), `next`(다음주), `error`(중복·빈 단가), `missing`(필수 열 누락)입니다. `missing`은 파일 삭제가 아니라 열 누락 실습입니다.

## 막히면

- **입력이 없다:** `node integrations/automation/prepare.cjs`를 실행합니다.
- **watch가 이미 있거나 잠금이 남았다:** 같은 출력 폴더에는 한 프로그램만 실행할 수 있습니다. 기존 터미널에서 Ctrl+C로 종료한 다음 재시작합니다. 비정상 강제 종료로 잠금이 남으면 강사와 기존 프로세스가 종료됐는지 확인한 뒤 `output/auto/.watch.lock`만 정리합니다. 실행 중인 잠금을 지우지 않습니다.
- **상태 파일이 깨졌다:** 결과 파일을 확인하고 기존 터미널을 종료한 뒤 시작 명령에 `--reset-state`를 붙입니다. 이전 상태는 `.previous-...json`으로 보존하고 상태만 새로 만듭니다.
- **잘못된 옵션/준비 실패:** 터미널에 `failed-setup`이 나옵니다. 입력과 설치·옵션을 확인한 뒤 다시 시작합니다. 기존 다른 프로그램의 상태나 깨진 상태를 성공 기록으로 덮지 않습니다.
- **프로그램은 꺼졌는데 보고서가 남았다:** 보고서는 마지막 결과입니다. 프로그램이 다시 실행되어야 입력 변경을 반영합니다.

## 강사 검증

```bash
node --test integrations/automation/watch.test.cjs
```

추가 패키지는 없습니다. 기존 로컬 보고서 라이브러리 설치를 사용합니다. 테스트는 임시 실습 폴더와 실제 XLSX로 원본→다음주→건너뛰기→오류 보존→재시도→복구와 Ctrl+C·재시작·깨진 상태·잠금·경로 보호를 실행합니다. 외부 예약 설치나 메시지 발송은 하지 않습니다.
