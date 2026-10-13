# Windows용 Claude Code CLI 설치 도우미

## 사용법

1. 이 폴더(`install-claude.bat`, `Install-ClaudeCode.ps1`)를 Windows PC에 복사합니다.
2. `install-claude.bat`를 **더블클릭**합니다. 관리자 권한은 필요 없습니다.
3. 완료 메시지가 나오면 **열려 있는 터미널과 VS Code/Cursor를 모두 닫았다가 새로 열고** `claude`를 입력합니다.

옵션 (PowerShell에서 실행):

```powershell
.\install-claude.bat -Channel stable      # 안정 채널 (약 1주 지연, 큰 버그 버전은 건너뜀)
.\install-claude.bat -Yes                 # 질문 없이 자동 진행
.\install-claude.bat -SkipGit             # Git for Windows 점검 생략
```

## 스크립트가 반복해서 확인하는 항목

| 단계 | 확인/처리 내용 |
|---|---|
| 사전 점검 | Windows 10 1809 이상, 64비트(32비트 PowerShell이면 64비트로 다시 실행), TLS 1.2, `downloads.claude.ai` 연결(403·프록시·SSL), 한글 사용자 폴더, 관리자 권한으로 실행했는지 여부, 디스크 공간 |
| 중복 설치 | `.local\bin`(공식 경로)과 `.claude\bin`(구버전 경로) 모두 확인. npm 전역 설치본, WinGet 설치본, 구버전 `~\.claude\local` 설치본 탐지 후 제거 제안. 업데이트가 실패해 `claude.exe`가 사라진 경우 `.old` 백업에서 복구 |
| Git Bash | Git for Windows를 찾고, 없으면 WinGet 설치를 제안. 찾은 `bash.exe` 경로를 `CLAUDE_CODE_GIT_BASH_PATH`에 등록 |
| 설치 | 공식 설치기(`claude.ai/install.ps1`)를 2회 시도. 실패하면 WinGet, 그다음 npm 순서로 대체 설치 |
| **PATH** | `%USERPROFILE%\.local\bin`을 **사용자 PATH**에 추가. 기존 PATH는 백업하고 `REG_EXPAND_SZ` 형식을 그대로 유지(아래 참고). 추가 후 시스템 전체에 변경 알림을 보냄 |
| 권한 오류 | 관리자 권한은 필요 없습니다(공식 문서 기준). "액세스 거부" 같은 권한 오류가 **실제로 감지됐을 때만** 관리자 PowerShell로 다시 실행할지 물어봄 |
| 검증 | 레지스트리에서 다시 읽은 PATH, 즉 "새 터미널"과 같은 환경으로 `claude --version`과 `claude doctor` 실행. 실패하면 최대 3라운드까지 재시도 |

로그는 `%TEMP%\claude-install-날짜.log`에 저장됩니다.

## PATH가 자동으로 안 잡히는 이유

공식 Windows 설치기는 `claude.exe`를 `%USERPROFILE%\.local\bin`에 설치하지만 **PATH는 수정하지 않습니다.** 설치기는 "Setup notes"에 안내 문구만 출력합니다. 이 스크립트가 그 부분을 대신 처리합니다.

인터넷에 흔히 있는 `[Environment]::SetEnvironmentVariable('PATH', ..., 'User')` 방식은 PATH를 `REG_SZ`로 바꿔 버립니다. 그러면 `%JAVA_HOME%\bin` 같은 변수형 항목이 깨질 수 있습니다. 이 스크립트는 레지스트리를 직접 수정해서 이 문제를 피합니다.

## 그래도 안 될 때

- **회사망 / 프록시**: 스크립트를 실행하기 전에 PowerShell에서 아래를 입력합니다.
  `$env:HTTPS_PROXY='http://프록시:포트'; $env:HTTP_PROXY=$env:HTTPS_PROXY`
- **SSL 인증서 오류**: 회사 루트 인증서를 Windows 인증서 저장소에 추가해야 합니다(IT팀 문의).
- **403**: 지원되지 않는 지역이거나 방화벽이 막고 있는 경우입니다.
- **백신이 파일을 잠근 경우**: 스크립트가 다운로드 폴더를 지우고 다시 시도합니다. 계속 실패하면 백신 예외에 `%USERPROFILE%\.claude`를 추가합니다.
- **VS Code 안의 터미널에서만 안 될 때**: VS Code를 완전히 종료한 뒤 다시 실행합니다.
- 공식 문서: https://code.claude.com/docs/en/troubleshoot-install
