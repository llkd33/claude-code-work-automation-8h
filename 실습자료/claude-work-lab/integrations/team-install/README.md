# 팀 설치·검수 도구

학생 안내는 [작은 팀 시작하기](../../templates/team-starter/README.md)를 사용합니다.

- 설치: `node integrations/team-install/install-team.cjs`
- 읽기 검수: `node integrations/team-install/verify-team.cjs`
- 새 HTML 경로 검수: `node integrations/team-install/verify-team.cjs output/team-dashboard-2.html`
- 도구 검사: `node --test integrations/team-install/install-team.test.cjs integrations/team-install/verify-team.test.cjs`

검수 PASS는 현재 원본 Excel 재계산과 HTML 소스의 지정된 숫자 요소가 일치한다는 뜻입니다. 레이아웃·숨김 여부·브라우저에서 보이는 화면은 사람이 직접 확인합니다. 설치는 현재 lab에만 적용하고 기존 파일을 바꾸지 않습니다.

2026-10-10 실제 검증: 16개 검사 통과. 사용한 실제 수정후 Excel은 41건·2,363,300원·완료31·진행10이며 부서 합계는 경영지원721,300·영업586,000·마케팅1,056,000원입니다. 실행 로그는 verification-20261010.log에 있습니다. 최초 검사에서는 반환 객체의 null prototype과 일반 객체의 비교 때문에 테스트 1개가 실패했고, 비교 대상을 JSON 값으로 변환한 뒤 전체 재실행했습니다. 실제 값은 처음부터 같았습니다.

제공 계정에서 Claude Code의 실제 Agent 호출·모델 응답·브라우저 화면은 이번 도구 검사에 포함하지 않았습니다. 수업 리허설에서 3개 담당자의 실제 호출과 결과 기록을 확인합니다.

team-starter-snapshot.json은 교안 생성기가 이전 안내로 덮어쓰는 경우 동일한 현재 자료를 복원할 수 있는 원본 묶음입니다. 설치 도구는 이 묶음을 사용하지 않습니다.
