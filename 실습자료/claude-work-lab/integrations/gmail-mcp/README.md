# Module 3 · Gmail MCP로 메일 초안

교육용 Gmail을 연결하고, 만든 공유 문안을 초안 한 개로 저장합니다. Claude 계정과 별도로 Google 계정 인증이 필요합니다.

1. claude.ai → Customize → Connectors → Gmail에서 교육용 Google 계정을 연결합니다. 조직 계정의 커넥터 허용은 운영진이 준비합니다.
2. 같은 Claude 계정으로 로그인한 Terminal Claude Code에서 /mcp를 입력합니다. Gmail과 초안 저장 도구가 실제로 보이는지 확인합니다.
3. 09_Claude_Gmail초안.txt의 경로는 output/my-work/share.txt, 수신자는 내 교육용 주소로 바꿉니다. 내 업무 실행기가 미완료라면 검사한 output/local-final/share.txt를 사용합니다.
4. 초안 저장 요청은 한 번만 합니다. 다시 요청하기 전 기존 초안을 확인합니다. 발송하지 않습니다.
5. 초안 ID와 Gmail 임시보관함의 수신자·제목·숫자·미발송 상태를 확인합니다. 쓰기 도구가 없거나 권한이 막히면 미완료를 기록합니다.

```text
[검사한 공유 문안 경로]를 바탕으로 Gmail MCP에 메일 초안 1개를 저장해줘. 수신자: [교육용 Gmail 주소]. 제목: [실습] 주간 비용 보고. 본문은 6줄 이내, 숫자는 원문 그대로. 발송하지 마. 초안 저장 도구가 없으면 저장하지 못했다고 알려줘. 저장되면 초안 ID를 알려줘.
```

[Terminal MCP 공식 안내](https://code.claude.com/docs/en/mcp#use-mcp-servers-from-claudeai) · [Gmail 공식 안내](https://support.claude.com/en/articles/10166901-use-google-workspace-connectors).
