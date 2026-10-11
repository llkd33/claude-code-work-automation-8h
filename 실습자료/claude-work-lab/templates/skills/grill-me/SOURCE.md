# 교육용 grill-me 출처 · 2026-10-09

Matt Pocock의 질문 기반 기획 스킬을 참고해 이 과정의 개인 도구 실습에 맞게 새로 작성했습니다. 원본 그대로의 설치판이 아닙니다.

- [원본 grill-me](https://github.com/mattpocock/skills/blob/main/skills/productivity/grill-me/SKILL.md): grilling 호출 진입점.
- [원본 grilling](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md): 결정이 연결되는 구조를 질문하고 공통 이해를 확인하는 절차.
- [원본 MIT 라이선스](https://github.com/mattpocock/skills/blob/main/LICENSE): 동봉 LICENSE.
- [Claude Code 공식 Skill 안내](https://code.claude.com/docs/en/skills): 프로젝트 .claude/skills와 직접 호출.

교육용 변경: 한국어·한 번에 한 질문·최대 3개 질문 후 사용자 확인, 화면 1개·기능 3개 이하, 인터뷰 기록과 구현 요청 파일 생성, 앱 구현은 별도 요청. 다른 Skill이나 하위 에이전트를 호출하지 않습니다. 파일 설치에는 추가 다운로드가 없습니다. Claude Code 대화 자체에는 계정·망·사용량이 필요합니다.

name은 grill-me, description은 하는 일과 사용 시점을 설명합니다. disable-model-invocation은 수업에서 직접 호출해 확인하기 위해 true로 설정했습니다.
