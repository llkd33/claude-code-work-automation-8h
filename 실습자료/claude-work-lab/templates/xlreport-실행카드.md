# xlreport · 짧은 실행 카드

이 카드는 **Bun과 이미 만든 xlreport 프로젝트가 있는 macOS 환경**용입니다. xlreport 소스는 이번 실습 ZIP에 포함하지 않습니다. 정규 수업에서는 integrations/auth-report의 Node 실행기를 사용합니다.

## 이렇게 요청하기

```text
- 엑셀 파일이 있는 폴더를 선택하고 “보고서 만들기”를 누르면 분석 보고서가 나오는 로컬 앱을 만들고 싶어.
- API 키 없이 로그인된 Claude Code를 사용해줘.
- 진행 상태와 오류를 화면에 보여주고, 결과는 선택한 폴더의 docs에 저장해줘.
```

## 프로젝트 폴더에서 한 줄씩

package.json과 sample/sales_fake.xlsx를 먼저 확인합니다. 명령 끝의 설명과 #은 함께 복사하지 않습니다. 이미 xlreport 폴더라면 cd xlreport를 또 실행하지 않습니다.

1. 최초 준비:

```text
bun install
```

로그인이 안 됐다면 셸에서 `claude auth login`을 실행합니다. `/login`은 Claude Code 안에 입력합니다.

2. CLI로 보고서 생성:

```text
bun src/cli.ts sample
```

Report written: 뒤의 실제 docs/excel-report-날짜.md 파일을 엽니다. 숫자는 Excel과 직접 대조합니다. 저장 성공만으로 분석 내용이 맞다고 판정하지 않습니다.

3. 화면 확인:

```text
bun run ui sample
```

폴더와 sales_fake.xlsx가 보이는지 확인합니다. CLI에서 이미 분석했다면 다시 “보고서 만들기”를 누르지 않아도 됩니다. 화면으로 처음 분석하는 경우에만 누릅니다. 종료는 셸에서 Ctrl+C입니다.

| 오류 | 먼저 할 일 |
| --- | --- |
| unrecognised dependency format: # | 설명을 빼고 bun install만 실행 |
| cd: no such file or directory | 이미 xlreport인지 확인, 예시 경로를 복사하지 않기 |
| No Excel files | Excel 파일이 있는 sample 폴더를 지정 |
| Not logged in | 셸에서 claude auth login |
| 화면에 폴더가 아닙니다 | 폴더 선택으로 다시 고르기, 경로 끝 # 제거 |

bun link와 언어·모델 옵션은 기본 따라하기에서 생략합니다. 제공 화면은 #이 들어간 경로 오류 장면이고, 제공 CLI 로그에는 Markdown 저장 성공이 있습니다. UI 보고서 생성 성공과 Windows exe 실행까지 확인된 것은 아닙니다.
