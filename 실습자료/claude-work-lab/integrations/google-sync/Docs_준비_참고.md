# 선택 Google 갱신용 Docs 준비

Gmail 실습과 별개입니다. 기존 선택 Sheets→Docs 자동 갱신을 할 때만 사용합니다. integrations/google-mcp/README.md의 Google 연결과 Google 조회·수정 실습을 먼저 마칩니다.

1. 교육용 Google Docs 문서를 만들고 제목을 내이름_주간비용보고서로 정합니다.
2. 다음 다섯 내용을 각각 Enter로 나눈 일반 문단에 씁니다.

```text
소개
[[AUTO_REPORT_START]]
자동 보고서 대기
[[AUTO_REPORT_END]]
결론
```

표식은 각각 정확히 한 번, 사이의 일반 문단은 정확히 하나여야 합니다. Shift+Enter 줄바꿈이나 표 안에 넣지 않습니다.

3. URL의 /d/와 다음 / 사이를 document_id로 기록합니다. 교육용 계정의 편집 권한을 확인합니다.
4. 설치된 workspace-mcp의 get_doc_content로 실제 문단과 표식을 조회합니다. 이 자료 제작에서는 실계정 조회를 검증하지 않았습니다.
5. 기존 Google 갱신 부록의 Apps Script 절차로 이어갑니다. Gmail 초안 실습은 이 문서를 요구하지 않습니다.
