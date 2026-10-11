---
name: team-dashboard
description: 주간 비용 집계로 대시보드를 만들 때 데이터 확인·화면 제작·검수 담당 3명을 순서대로 호출한다. 간단한 문구 수정에는 사용하지 않는다.
disable-model-invocation: true
---

# 담당자 3명에게 대시보드 맡기기

입력은 output/local-final/{summary.json,verification.json,report.html,share.txt}. 새 출력은 output/team-dashboard.html, 기록은 notes/team-result.md. 메인은 제공 계정으로 로그인된 Claude Code이고 담당자는 model: inherit를 따른다. 원본·기존 결과물·계정 설정을 보존한다.

1. 입력 4개가 있는지 확인한다. 새 HTML이나 기록 경로가 이미 있으면 덮어쓰지 말고 새 경로를 사용자와 확인한다. 기록에는 선택한 경로를 쓴다.
2. **Agent 도구로 data-auditor를 실제 호출**한다. summary.json과 verification.json 경로를 넘긴다. FAIL이면 제작을 멈추고 실제 실패 내용을 기록한다.
3. PASS 뒤 **Agent 도구로 dashboard-builder를 실제 호출**한다. 같은 summary.json, 데이터 확인 결과, 새 출력 경로를 전달한다.
4. **Agent 도구로 qa-reviewer를 실제 호출**한다. 출력 경로와 `node integrations/team-install/verify-team.cjs` 검사 절차를 전달한다. 변경 경로는 마지막 인수로 전달한다.
5. FAIL이면 화면 담당에게 지적된 문제만 한 번 수정 요청하고 검수를 한 번 다시 호출한다. 그 뒤에도 FAIL이면 미완료로 멈춘다. 입력 데이터 문제이면 원본을 임의로 고치지 않고 중단한다.
6. 메인이 notes/team-result.md(또는 확인한 새 경로)에 담당자별 실제 호출 이름·횟수·결과, 검사 명령·종료 코드·주요 출력, 새 파일 경로, 미확인을 15줄 이내로 저장한다. 브라우저 확인은 아직 사람이 해야 한다고 쓴다. 기존 기록은 덮어쓰지 않는다.

처음 각 담당자 1회, 수정 때 화면 1회 + 검수 1회가 최대다. 같은 파일에 병렬 쓰기를 시키지 않는다. 메인이 담당자 역할을 흉내 내서 완료하지 않는다. Agent 도구가 없거나 해당 이름을 호출하지 못하면 '실제 서브에이전트 실행 미완료'로 기록한다. 숫자·호출 기록·실행 결과를 만들어 내지 않는다. 결과 전체를 대화에 길게 출력하지 않는다.
