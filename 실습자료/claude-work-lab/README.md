# Claude Code 실습 자료

## 프롬프트를 받으면
- 파일 목록을 보고 프롬프트와 관련된 안내·예시만 읽습니다. 폴더 전체를 매번 읽지 않습니다.
- 짧게 답하고, 필요한 기준만 사용자에게 묻습니다. 이미 받은 답은 다시 묻지 않습니다.
- 수강생이 파일 위치를 정하지 않아도 됩니다. 입력 별칭·저장 위치·설정 대상은 [Claude용 파일 안내](templates/수업_파일안내.md)에서 해당 작업만 확인합니다. 파일 이름과 여는 방법을 알려줍니다.
- 자료에 없는 설치·사용법은 필요한 경우 공식 웹 문서에서 확인합니다. 회사 사실·누락된 수치·사용자 취향은 웹검색으로 채우지 않습니다.
- 원본과 기존 정상 결과는 보존합니다. 비용 계산은 제공 도구를 사용하고 오류가 나면 멈춥니다.
- 실제로 확인하지 못한 것은 알려줍니다.

## 필요한 자료 찾기

- 입력 데이터 전체 지도: [input/자료안내.md](input/자료안내.md). 각 주제별 세부 README는 연결된 자료만 읽습니다.
- 비용 Excel 시트·열·정답 숫자: [workbooks/파일안내.md](workbooks/파일안내.md).
| 프롬프트 | 먼저 볼 안내 |
|---|---|
| 체크리스트 | templates/checklist-spec.md |
| 회의록 스킬 | input/hanbit-sales/README.md, templates/skills/meeting-minutes/스킬_빈칸양식.md |
| 비용 계산 | integrations/local-report/실행안내.md |
| 비용 보고서·메일 초안 | templates/수업_파일안내.md의 현재 비용 보고서 결과 위치; 검사한 같은 숫자를 사용 |
| 수신자별 결과 5종 | input/weekly-report/README.md |
| Excel 웹 도구 | workbooks/파일안내.md, templates/excel-web-app/01_웹보고서_스펙.md |
| 고객관리 | input/customer-app/README.md, templates/customer-app/01_고객관리_스펙.md |
| 회의정리·고객후속관리 팀 | templates/team-options/사용안내.md |
| 비용 보고 팀 | templates/team-starter/README.md |

## 실습 순서
1. 체크리스트를 만듭니다.
2. 회의록 스킬을 만들고 두 메모에 적용합니다.
3. 비용표 사본으로 보고서와 메일 초안을 만듭니다.
4. 같은 방식으로 다음 주 보고서를 만든 뒤, CLAUDE.md와 weekly-report 스킬로 절차를 남깁니다.
5. 서브에이전트 팀 하나를 골라 세 역할을 맡기고 결과를 확인합니다.
6. Excel 웹 도구를 만들고 보고서·발표 슬라이드를 엽니다.
7. 입력 파일을 교체해 보고서를 자동 갱신합니다.
8. 공유 문안을 Gmail 초안으로 저장합니다.

팀은 비용 보고·회의 정리·고객 후속관리 중 하나만 실행합니다. 고객관리 앱은 선택입니다.
[단계별 가이드](단계별_실습가이드.md) · [가상 회사 자료](input/hanbit-sales/README.md)
