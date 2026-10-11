# Gmail에 메일 초안 저장하기

MCP는 AI와 외부 도구를 잇는 연결 방식입니다. 이번에는 Gmail에 보고서 초안을 남깁니다.

## 1. Claude Code에서 연결 도움받기

```text
Gmail에 메일 초안을 저장하고 싶어. 연결을 도와줘.
이미 연결돼 있는지 확인하고, 안 돼 있으면 내가 할 일을 하나씩 알려줘.
로그인과 권한 허용은 내가 할게. 끝나면 초안 저장이 가능한지 확인해줘.
아직 메일을 만들거나 보내지는 마.
```

안내받은 브라우저에서 Google 로그인과 권한 허용은 직접 합니다. Claude Code와 같은 Claude 계정으로 연결합니다. 돌아와 “연결했어. 초안을 저장할 수 있는지 확인해줘”라고 말합니다.

연결 화면을 못 찾으면 [Claude 연결 설정](https://claude.ai/customize/connectors)에서 Gmail을 고릅니다. 연결이 안 보이면 같은 실습 폴더에서 Claude Code를 다시 켭니다. 조직에서 막혀 있으면 운영진에게 확인합니다. 비밀번호·인증 파일을 대화에 붙이지 않습니다.

## 2. 초안 저장하기

```text
앞에서 만든 메일 초안을 Gmail 임시보관함에 넣어줘.
어느 보고서인지 먼저 보여주고, 내가 확인하면 저장해줘.
수신자: [교육용 Gmail 주소]
메일은 보내지 마.
```

Claude는 현재 대화에서 확인한 보고서의 파일명·건수·총액을 먼저 보여 줍니다. 여러 보고서라면 하나를 고르게 하고, 확인받은 보고서의 email-draft.md 또는 share.txt로 6줄 이내 초안을 만듭니다. 다시 저장하기 전 기존 초안을 확인합니다.

## 3. Gmail에서 열어 보기

임시보관함에서 수신자·제목·내용·숫자를 확인합니다. 보내지는 않습니다. 로컬 문서만 생기면 Gmail 저장 완료가 아닙니다. Claude는 실제 저장 결과와 초안 ID를 확인하고, 저장 도구가 없으면 미완료라고 알려줍니다.

[Claude Code 연결 안내](https://code.claude.com/docs/en/mcp#use-mcp-servers-from-claudeai) · [Gmail 안내](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors)
