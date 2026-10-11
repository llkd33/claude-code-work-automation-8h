# 내 Claude에 담당자 3명 붙이기 · 개인 실습

내 터미널의 메인 Claude가 데이터 확인 → 화면 제작 → 검수 담당에게 순서대로 일을 맡깁니다. 각자 자기 파일로 진행합니다.

| 담당자 name | description의 핵심 | 도구 |
|---|---|---|
| data-auditor | 보고서 제작 전 원본 검사 기록과 집계 수치를 확인 | Read, Grep, Glob |
| dashboard-builder | 확인을 통과한 집계로 HTML 한 개 제작 | Read, Grep, Glob, Write, Edit |
| qa-reviewer | 원본 재계산과 HTML 숫자를 실제로 대조 | Read, Grep, Glob, Bash |

`name`은 부를 이름, `description`은 언제 어떤 일을 맡길지 정하는 설명입니다. 세 담당자는 `model: inherit`로 메인 Claude의 모델을 따릅니다. 담당자의 요청도 제공 계정의 사용량에 포함됩니다.

## 1. 역할 확인과 설치 

먼저 `output/local-final/`에 `summary.json`, `verification.json`, `report.html`, `share.txt`가 있는지 확인합니다. 이번 실행의 `verification.json`이 실패라면 입력을 고치고 보고서를 다시 만든 뒤 진행합니다.

**Claude Code 안**에 `05a_Claude_하네스설정.txt` 전체를 붙입니다. 제공 정의를 복사하고 CLAUDE.md에 팀 호출 규칙 한 줄을 추가합니다.

현재 프로젝트의 `.claude/agents/`에 담당자 3명과 `.claude/skills/team-dashboard/`에 실행 절차가 등록됩니다. 이미 같은 파일이면 그대로 두고, 다른 내용이면 덮어쓰지 않고 멈춥니다. 기존 weekly-report·grill-me와 개인 설정은 보존합니다.

Claude Code를 종료하고 **같은 폴더**에서 `claude`로 다시 시작합니다. `/agents`의 모습은 버전에 따라 다를 수 있으므로 아래 실행 기록의 담당자 이름으로 실제 위임을 확인합니다.

## 2. 순서대로 맡기기

**터미널의 Claude Code**에 복붙합니다.

```text
/team-dashboard
```

데이터 확인 담당이 PASS를 반환하면 화면 담당, 마지막에 검수 담당을 호출합니다. 오류 수정은 한 번까지입니다. 기존 `output/team-dashboard.html`이 있다면 새 파일 경로를 묻습니다.

## 3. 내가 확인하기

1. 대화의 실제 Agent 호출에 `data-auditor`, `dashboard-builder`, `qa-reviewer` 세 이름이 각각 보이는지 확인합니다. 메인 Claude 혼자 만들었다면 팀 실행은 미완료입니다.
2. 새 `output/team-dashboard.html`을 브라우저로 엽니다. 수정 실습을 마쳤다면 **41건 · 2,363,300원 · 완료 31건 · 진행 10건**입니다. 부서 합계는 경영지원 721,300원, 영업 586,000원, 마케팅 1,056,000원입니다. 다른 원본을 썼다면 실제 집계와 비교합니다.
3. `notes/team-result.md`에서 실제 호출, 검사 명령과 결과, 확인하지 못한 부분을 읽습니다. 파일이 존재하는 것과 화면이 제대로 보이는 것은 따로 확인합니다.

**오늘 남는 결과:** 새 대시보드 1개 + 팀 실행 기록 1개. 설치 성공이 실제 위임 성공을 의미하지는 않습니다. 역할·경로 지시는 작업 범위이며 별도 접근 차단 장치가 아닙니다. 이 실습은 한 세션의 서브에이전트입니다.

[Claude Code 공식 서브에이전트 설명](https://code.claude.com/docs/en/sub-agents)
