# Module 3 · Gmail MCP로 메일 초안

교육용 Gmail을 연결하고, 만든 공유 문안을 초안 한 개로 저장합니다. Claude 계정과 별도로 Google 계정 인증이 필요합니다.

1. claude.ai → Customize → Connectors → Gmail에서 교육용 Google 계정을 연결합니다. 조직 계정의 커넥터 허용은 운영진이 준비합니다.
2. 같은 Claude 계정으로 로그인한 Terminal Claude Code에서 /mcp를 입력합니다. Gmail과 초안 저장 도구가 실제로 보이는지 확인합니다.
3. 초안 프롬프트에 교육용 수신자를 적습니다. Claude는 현재 대화에서 마지막으로 확인한 보고서의 파일명·건수·총액을 먼저 보여 줍니다. 여러 보고서라면 하나를 고르게 하고, 사용자가 확인한 보고서의 email-draft.md 또는 share.txt로 6줄 이내 초안을 만듭니다.
4. 초안 저장 프롬프트는 한 번만 보냅니다. 다시 보내기 전 기존 초안을 확인합니다. 발송하지 않습니다.
5. 초안 ID와 Gmail 임시보관함의 수신자·제목·숫자·미발송 상태를 확인합니다. 쓰기 도구가 없거나 권한이 막히면 미완료를 기록합니다.

```text
앞에서 만든 메일 초안을 Gmail 임시보관함에 넣어줘.
어느 보고서인지 먼저 보여주고, 내가 확인하면 저장해줘.
수신자: [교육용 Gmail 주소]
메일은 보내지 마.
```

[Terminal MCP 공식 안내](https://code.claude.com/docs/en/mcp#use-mcp-servers-from-claudeai) · [Gmail 공식 안내](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors).
