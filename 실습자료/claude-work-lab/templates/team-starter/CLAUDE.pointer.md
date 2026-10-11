- /team-dashboard를 직접 호출하면 data-auditor → dashboard-builder → qa-reviewer를 실제 서브에이전트로 순서대로 호출한다.
- 입력은 output/local-final이며 기존 원본·보고서를 보존한다. 새 HTML과 실제 호출·검사 기록을 남긴다.
- 각 담당자 1회, 실패 시 화면 수정 1회·재검수 1회가 최대다. 실행하지 않은 검사는 성공으로 쓰지 않는다.

이 안내는 참고용이다. 설치 명령은 기존 CLAUDE.md를 수정하지 않는다.
