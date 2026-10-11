---
name: meeting-team
description: 회의정리 자료 한 묶음을 세 담당자에게 나눠 확인·작성·검수할 때 사용한다.
disable-model-invocation: true
---

입력: input/hanbit-sales/meetings/01_외부유통사미팅.txt
출력: output/meeting-team/회의록.md, output/meeting-team/검수.md, notes/meeting-team-호출기록.md

메인은 다음 순서로 실제 서브에이전트를 호출한다. 서로 의존하므로 순서대로 진행한다.
1. meeting-team-checker에게 지정 원문을 주고 사실·제안·미정을 확인시킨다.
2. meeting-team-writer에게 같은 원문과 확인 결과를 주고 초안 파일을 쓰게 한다.
3. meeting-team-reviewer에게 원문과 실제 초안을 독립 비교시키고 수정 필요와 미확인을 받는다.
4. 메인은 검수.md와 호출기록.md에 실제 위임 이름·받은 결과·미확인을 남긴다. 검수 실패면 수정은 한 번만, 남은 문제는 기록한다.
5. 원본과 기존 결과를 보존한다. 다른 팀과 파일을 섞지 않는다. 메인이 혼자 쓴 결과를 세 명의 호출이라고 기록하지 않는다. 자료 밖 정보나 외부 검색을 쓰지 않는다.

완료 기준: 지정 자료의 내용이 초안에 반영되고, 없는 날짜·담당자·약속을 만들지 않는다. 사람은 원문과 표를 직접 비교한다. 세 이름이 실제 위임 기록에 있어야 팀 실행을 확인한 것이다.
