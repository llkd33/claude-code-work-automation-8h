# AI 참고 색인 · 필요한 자료만 찾아 읽기

이 폴더는 수업용 가상 자료 모음입니다. Claude Code는 **지금 하는 실습의 줄만** 먼저 읽고, 거기 연결된 파일만 열면 됩니다. 원본 Excel·CSV 전체를 매번 읽을 필요는 없습니다.

## 빠른 길 찾기

| 지금 할 일 | 먼저 읽을 자료 | 다음에 볼 자료 |
|---|---|---|
| 강의 개념·실습 순서 | `단계별_실습가이드.md`에서 해당 번호 | 필요한 경우에만 아래 주제별 자료 |
| 첫 실습·AI 흐름 | `templates/00_첫실습전_개념과최근흐름.md` | `templates/터미널_한장.md` |
| 체크리스트 만들기 | `templates/checklist-spec.md` | 완성 후 파일을 열어 항목 추가·완료·새로고침 확인 |
| 체크리스트 디자인 바꾸기 | 핸드북 07 심화 실습, templates/복붙텍스트/02b_Claude_A2_디자인참고.txt | Google 이미지·Pinterest에서 화면 참고를 고르고 캡처해 Claude Code에 첨부, 디자인을 바꾼 뒤 기존 기능 확인 |
| 고객 도구·기능 인터뷰 | `input/customer-app/README.md` | `input/customer-app/가상고객_5명.csv`, `templates/customer-app/01_고객관리_스펙.md` |
| 고객 도구 기획 그림 | `templates/planning/02_고객관리_PRD예시.md` | `03_고객관리_IA예시.md`, `04_고객관리_UserJourney예시.md` |
| 회의록·내 업무 스킬 만들기 | `input/hanbit-sales/README.md` | `templates/skills/meeting-minutes/` 안내, 가상 회의 메모, 반복 업무 스킬 프롬프트 P146 |
| 주간 비용 첫 보고서 | `integrations/local-report/실행안내.md` | `workbooks/파일안내.md`, `workbooks/주간비용_실습.xlsx` 사본 |
| Excel에서 금액 수정 | `workbooks/파일안내.md`의 수정 실습 | Excel에서 사본의 E003 단가 수정 후 보고서 재실행 |
| 표가 크거나 필터 연습 | `workbooks/파일안내.md`의 120건 연습 | `workbooks/주간비용_확장연습_120건.xlsx` 사본 |
| 여러 Excel을 한 보고서로 비교 | `workbooks/파일안내.md`의 비교 기준 | 원본·수정후·다음주 파일을 따로 계산, HTML 보고서와 그래프 확인 |
| 보고서 5종 만들기 | `input/weekly-report/README.md` | README가 연결하는 CSV·맥락 파일만 읽기 |
| Excel 웹 도구·슬라이드 | `templates/excel-web-app/01_웹보고서_스펙.md` | `workbooks/파일안내.md`, 제공된 예시 HTML |
| Excel 드롭 로컬 웹 앱 | 강의 19번의 심화 실습 | 로그인된 Claude Code CLI 안내, 가상 Excel 한 개로만 검증 |
| 실행 파일·watch·Gmail | 해당 `integrations/*/README.md` 또는 `실행안내.md` | 연결된 안내만 읽고, 나머지는 열지 않기 |
| 팀 역할 나누기 | `templates/team-options/사용안내.md` | 고른 팀의 README와 담당 역할 파일만 읽기 |
| 오류·막힘 | `templates/막혔을때.md` | 보고 있는 화면·오류와 관련된 실습 안내만 확인 |

## AI에게 자료를 맡길 때

1. 파일을 붙이거나 `@`로 선택하기 전에 이 색인에서 관련 자료를 찾습니다.
2. Claude Code에는 색인과 필요한 파일만 보여 줍니다. “폴더 전체를 읽어”라고 하지 않습니다.
3. 숫자 검증은 요약·데이터 사전·제공 계산 도구부터 씁니다. 원본 전체 행이 정말 필요할 때만 해당 파일을 엽니다.
4. 결과가 틀리면 정답 숫자와 비교하고, 자료에서 근거를 못 찾은 내용은 “미정”으로 둡니다.
5. 자료에 없는 **현재 버전의 설치·로그인·CLI 사용법**은 Anthropic 공식 문서만 확인합니다. 실습용 사실이나 수강생의 업무 정보는 웹에서 추측하지 않습니다.

## 수업용 기준 값

- 비용 예시 원본: 40건 · 2,333,300원
- Excel에서 E003 단가 변경: 40건 · 2,338,300원
- Excel에서 E041 한 건 추가: 41건 · 2,363,300원
- 다음 주 파일: 12건 · 1,130,900원
- 확장 연습 파일 원본: 120건 · 20,168,700원
- 확장 파일 X001 단가 변경 후: 120건 · 20,169,700원

이 값은 연결된 가상 교육 파일을 확인하는 기준입니다. 다른 파일에 같은 답을 적용하지 않습니다.
