<#
.SYNOPSIS
    Windows용 Claude Code CLI 자동 설치 + PATH 자동 등록 + 검증 반복 스크립트

.DESCRIPTION
    공식 네이티브 설치기(https://claude.ai/install.ps1)는 claude.exe 를
    %USERPROFILE%\.local\bin 에 설치하지만 PATH 에는 추가하지 않습니다.
    이 스크립트는 아래를 "새 터미널에서 claude --version 이 성공할 때까지" 반복합니다.

      1. 사전 점검  : Windows 버전, 64비트, TLS 1.2, 네트워크/프록시, 한글 사용자명 등
      2. 충돌 점검  : npm / WinGet / 구버전(.claude\local) 설치본 중복 탐지
      3. Git Bash   : Git for Windows 확인(없으면 설치 제안), CLAUDE_CODE_GIT_BASH_PATH 등록
      4. 설치       : 공식 설치기 -> 실패 시 WinGet -> 실패 시 npm 순으로 대체
      5. PATH 등록  : 사용자 PATH 에 REG_EXPAND_SZ 형식을 보존하며 추가 + 전체 프로그램에 변경 알림
      6. 검증       : 레지스트리 기준의 "새 터미널" 환경으로 claude --version / claude doctor 실행

.PARAMETER Channel
    latest(기본) | stable | 2.1.89 같은 특정 버전

.PARAMETER Yes
    모든 질문에 자동으로 "예" (무인 설치)

.PARAMETER SkipGit
    Git for Windows 점검/설치 건너뛰기

.PARAMETER MaxRounds
    전체 설치-검증 반복 최대 횟수 (기본 3)

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Install-ClaudeCode.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Install-ClaudeCode.ps1 -Channel stable -Yes
#>
[CmdletBinding()]
param(
    [string]$Channel = 'latest',
    [switch]$Yes,
    [switch]$SkipGit,
    [ValidateRange(1, 10)][int]$MaxRounds = 3
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'   # PS 5.1 의 느린 진행 표시줄 끄기

# ---------------------------------------------------------------------------
# 상수
# ---------------------------------------------------------------------------
$INSTALL_SCRIPT_URL = 'https://claude.ai/install.ps1'
$RELEASES_URL       = 'https://downloads.claude.ai/claude-code-releases/latest'
$WINGET_ID          = 'Anthropic.ClaudeCode'
$GIT_WINGET_ID      = 'Git.Git'
$NPM_PACKAGE        = '@anthropic-ai/claude-code'
$MIN_WIN_BUILD      = 17763                          # Windows 10 1809
$NATIVE_BIN_DIR     = Join-Path $env:USERPROFILE '.local\bin'
$NATIVE_EXE         = Join-Path $NATIVE_BIN_DIR 'claude.exe'
$CLAUDE_HOME        = Join-Path $env:USERPROFILE '.claude'
$WINGET_LINKS_DIR   = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links'
$LEGACY_BIN_DIR     = Join-Path $env:USERPROFILE '.claude\bin'          # 일부 구버전/블로그 안내 경로
$VERIFY_TIMEOUT_MS  = 60000
$LOG_FILE           = Join-Path $env:TEMP ("claude-install-{0:yyyyMMdd-HHmmss}.log" -f (Get-Date))

$script:Warnings = New-Object System.Collections.Generic.List[string]
$script:PermissionDenied = $false
$script:InstalledExe = $null       # 이번 실행에서 실제로 설치에 성공한 실행 파일
$script:AllowWinget = $null        # 대체 설치 질문은 한 번만
$script:AllowNpm = $null
$PERMISSION_PATTERN = 'Access( to the path .*)? is denied|UnauthorizedAccess|EACCES|EPERM|액세스가 거부|권한이 없'

# ---------------------------------------------------------------------------
# 출력 도우미
# ---------------------------------------------------------------------------
function Write-Step([string]$m) { Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host "  [OK]   $m" -ForegroundColor Green }
function Write-Info([string]$m) { Write-Host "  [..]   $m" -ForegroundColor Gray }
function Write-Warn([string]$m) { Write-Host "  [주의] $m" -ForegroundColor Yellow; $script:Warnings.Add($m) }
function Write-Fail([string]$m) { Write-Host "  [실패] $m" -ForegroundColor Red }

function Confirm-Action([string]$question) {
    if ($Yes) { Write-Info "$question -> 자동 예(-Yes)"; return $true }
    $answer = Read-Host "  $question [Y/n]"
    return ($answer -eq '' -or $answer -match '^(y|yes|예|ㅇ)$')
}

# ---------------------------------------------------------------------------
# 0. 32비트 PowerShell 에서 실행된 경우 64비트로 재실행
# ---------------------------------------------------------------------------
function Test-IsAdmin {
    return ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-RelaunchArgs {
    $a = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-Channel', $Channel, '-MaxRounds', $MaxRounds)
    if ($Yes)     { $a += '-Yes' }
    if ($SkipGit) { $a += '-SkipGit' }
    return $a
}

function Restart-AsAdminIfAllowed {
    # 공식 문서상 관리자 권한은 불필요. "권한 오류"가 실제로 났을 때만 마지막 수단으로 사용
    if (Test-IsAdmin) { return $false }
    Write-Warn "권한 오류(액세스 거부)가 감지되었습니다. 백신/회사 정책이 사용자 폴더 쓰기를 막는 경우입니다."
    if (-not (Confirm-Action "관리자 권한 PowerShell 로 다시 실행할까요? (같은 계정일 때만 같은 위치에 설치됨)")) { return $false }
    $psExe = (Get-Process -Id $PID).Path
    try {
        $p = Start-Process -FilePath $psExe -ArgumentList (Get-RelaunchArgs) -Verb RunAs -Wait -PassThru -ErrorAction Stop
        $script:ExitCode = $p.ExitCode
        return $true
    } catch {
        Write-Fail "관리자 권한 실행이 취소되었거나 실패했습니다: $($_.Exception.Message)"
        return $false
    }
}

function Restart-In64BitIfNeeded {
    if ([Environment]::Is64BitOperatingSystem -and -not [Environment]::Is64BitProcess) {
        $ps64 = Join-Path $env:SystemRoot 'Sysnative\WindowsPowerShell\v1.0\powershell.exe'
        if (Test-Path $ps64) {
            Write-Host "32비트 PowerShell 감지 -> 64비트 PowerShell 로 다시 실행합니다." -ForegroundColor Yellow
            $p = Start-Process -FilePath $ps64 -ArgumentList (Get-RelaunchArgs) -Wait -NoNewWindow -PassThru
            exit $p.ExitCode
        }
    }
}

# ---------------------------------------------------------------------------
# 환경 변수(레지스트리) 도우미
#   [Environment]::SetEnvironmentVariable 은 PATH 를 REG_SZ 로 덮어써서
#   %JAVA_HOME%\bin 같은 항목을 깨뜨릴 수 있으므로 레지스트리를 직접 다룹니다.
# ---------------------------------------------------------------------------
function Get-RawUserPath {
    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment')
    if ($null -eq $key) { return '' }
    try {
        $val = $key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)
        return [string]$val
    } finally { $key.Close() }
}

function Set-RawUserPath([string]$value) {
    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
    try { $key.SetValue('Path', $value, [Microsoft.Win32.RegistryValueKind]::ExpandString) }
    finally { $key.Close() }
}

function Set-UserEnvVar([string]$name, [string]$value) {
    $key = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $true)
    try { $key.SetValue($name, $value, [Microsoft.Win32.RegistryValueKind]::String) }
    finally { $key.Close() }
    Set-Item -Path "Env:$name" -Value $value
}

function Get-NormalizedPathEntry([string]$entry) {
    return [Environment]::ExpandEnvironmentVariables($entry.Trim().Trim('"')).TrimEnd('\').ToLowerInvariant()
}

function Send-EnvironmentChangeBroadcast {
    # 탐색기 등 이미 실행 중인 프로그램에 "환경 변수 바뀜" 알림 (새로 여는 터미널이 바로 반영)
    try {
        if (-not ('Win32.NativeEnv' -as [type])) {
            Add-Type -Namespace Win32 -Name NativeEnv -MemberDefinition @'
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
'@ -ErrorAction Stop
        }
        $result = [UIntPtr]::Zero
        [void][Win32.NativeEnv]::SendMessageTimeout([IntPtr]0xffff, 0x1A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)
        Write-Ok "환경 변수 변경을 시스템에 알렸습니다 (WM_SETTINGCHANGE)"
    } catch {
        Write-Warn "환경 변수 변경 알림 실패(제한된 언어 모드일 수 있음). 로그아웃 후 다시 로그인하면 반영됩니다."
    }
}

function Get-FreshSessionPath {
    # "지금 새 터미널을 연다면" 가지게 될 PATH (Machine + User, 변수 확장)
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user    = [Environment]::ExpandEnvironmentVariables((Get-RawUserPath))
    return (@($machine, $user) | Where-Object { $_ }) -join ';'
}

function Add-DirToUserPath([string]$dir) {
    $raw = Get-RawUserPath
    $entries = @($raw -split ';' | Where-Object { $_.Trim() -ne '' })
    $target = Get-NormalizedPathEntry $dir
    $already = $entries | Where-Object { (Get-NormalizedPathEntry $_) -eq $target }
    if ($already) {
        Write-Ok "사용자 PATH 에 이미 있음: $dir"
    } else {
        # 가능한 경우 %USERPROFILE% 형태로 저장 (사용자 폴더 이동/한글 경로에 안전)
        $toStore = $dir
        if ($dir.StartsWith($env:USERPROFILE, [StringComparison]::OrdinalIgnoreCase)) {
            $toStore = '%USERPROFILE%' + $dir.Substring($env:USERPROFILE.Length)
        }
        $backup = Join-Path $env:TEMP ("user-path-backup-{0:yyyyMMdd-HHmmss}.txt" -f (Get-Date))
        Set-Content -Path $backup -Value $raw -Encoding UTF8
        Write-Info "기존 사용자 PATH 백업: $backup"
        $newValue = ((@($entries) + $toStore) -join ';')
        if ($newValue.Length -gt 32000) { Write-Fail "사용자 PATH 가 너무 깁니다($($newValue.Length)자). 불필요한 항목을 정리하세요."; return $false }
        try { Set-RawUserPath $newValue }
        catch { Write-Fail "PATH 레지스트리 쓰기 실패: $($_.Exception.Message)"; $script:PermissionDenied = $true; return $false }
        Write-Ok "사용자 PATH 에 추가: $toStore"
        Send-EnvironmentChangeBroadcast
    }
    # 현재 세션에도 즉시 반영
    $sessionEntries = @($env:Path -split ';' | ForEach-Object { Get-NormalizedPathEntry $_ })
    if ($sessionEntries -notcontains $target) { $env:Path = "$dir;$env:Path" }
    return $true
}

# ---------------------------------------------------------------------------
# 1. 사전 점검
# ---------------------------------------------------------------------------
function Test-Prerequisites {
    Write-Step "1/6 사전 점검"
    $ok = $true

    $build = [Environment]::OSVersion.Version.Build
    if ($build -lt $MIN_WIN_BUILD) { Write-Fail "Windows 10 1809(빌드 $MIN_WIN_BUILD) 이상 필요. 현재 빌드: $build"; $ok = $false }
    else { Write-Ok "Windows 빌드 $build" }

    if (-not [Environment]::Is64BitOperatingSystem) { Write-Fail "32비트 Windows 는 지원되지 않습니다."; $ok = $false }
    else { Write-Ok "64비트 OS ($env:PROCESSOR_ARCHITECTURE)" }

    Write-Ok "PowerShell $($PSVersionTable.PSVersion) / 언어 모드: $($ExecutionContext.SessionState.LanguageMode)"
    if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
        Write-Warn "회사 보안 정책(ConstrainedLanguage)으로 일부 기능이 제한될 수 있습니다."
    }

    # TLS 1.2 (Windows PowerShell 5.1 기본값이 낮은 경우 대비)
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        Write-Ok "TLS 1.2 활성화"
    } catch { Write-Warn "TLS 1.2 설정 실패: $($_.Exception.Message)" }

    # 프록시: 환경변수 우선, 없으면 시스템(IE) 프록시 + 기본 자격 증명 사용
    if ($env:HTTPS_PROXY) { Write-Info "HTTPS_PROXY 사용: $env:HTTPS_PROXY" }
    try { [Net.WebRequest]::DefaultWebProxy.Credentials = [Net.CredentialCache]::DefaultNetworkCredentials } catch { }

    # 사용자명/경로 점검
    if ($env:USERPROFILE -match '[^\x00-\x7F]') {
        Write-Warn "사용자 폴더 경로에 한글(비ASCII) 문자가 있습니다: $env:USERPROFILE`n         대부분 동작하지만 일부 도구에서 문제가 생기면 영문 사용자 계정을 고려하세요."
    }
    if ($env:USERPROFILE -match ' ') { Write-Info "사용자 경로에 공백 포함 (따옴표 처리로 대응)" }

    if (Test-IsAdmin) { Write-Info "관리자 권한으로 실행 중 (필수 아님). 다른 관리자 계정으로 승격했다면 그 계정 폴더에 설치되니 주의하세요." }

    $drive = Get-PSDrive -Name ($env:USERPROFILE.Substring(0,1)) -ErrorAction SilentlyContinue
    if ($drive -and $drive.Free -and $drive.Free -lt 1GB) { Write-Warn ("디스크 여유 공간 부족: {0:N0} MB" -f ($drive.Free / 1MB)) }

    [void](Test-Network)
    return $ok
}

function Test-Network {
    # 실패해도 설치를 중단하지 않음 (WinGet/npm 은 다른 서버를 쓰고, 일부 프록시는 HEAD 만 막음)
    for ($i = 1; $i -le 3; $i++) {
        foreach ($method in @('Head', 'Get')) {
            try {
                $r = Invoke-WebRequest -Uri $RELEASES_URL -Method $method -UseBasicParsing -TimeoutSec 20
                Write-Ok "다운로드 서버 연결 정상 (HTTP $($r.StatusCode))"
                return $true
            } catch {
                $code = $null
                if ($_.Exception.PSObject.Properties['Response'] -and $_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
                Write-Info "연결 시도 $i/3 ($method) 실패: $($_.Exception.Message)"
                if ($code -eq 403 -and $method -eq 'Get') {
                    Write-Warn "403 차단: 회사 방화벽/프록시 또는 지원되지 않는 지역일 수 있습니다. 대체 설치(WinGet/npm)를 시도합니다."
                    return $false
                }
            }
        }
        Start-Sleep -Seconds (2 * $i)
    }
    Write-Warn "downloads.claude.ai 연결 확인 실패. 회사망이면: `$env:HTTPS_PROXY='http://프록시주소:포트'; `$env:HTTP_PROXY=`$env:HTTPS_PROXY 후 재실행. SSL 오류면 회사 루트 인증서 등록 필요(IT팀 문의)."
    return $false
}

# ---------------------------------------------------------------------------
# 2. 기존/중복 설치 점검
# ---------------------------------------------------------------------------
function Get-NpmGlobalClaude {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) { return $false }
    $out = & $npm.Source ls -g $NPM_PACKAGE --depth=0 2>$null | Out-String
    return ($out -match [regex]::Escape($NPM_PACKAGE))
}

function Get-WingetClaude {
    $wg = Get-Command winget.exe -ErrorAction SilentlyContinue
    if (-not $wg) { return $false }
    $out = & $wg.Source list --id $WINGET_ID --exact --accept-source-agreements 2>$null | Out-String
    return ($out -match [regex]::Escape($WINGET_ID))
}

function Resolve-Conflicts {
    Write-Step "2/6 기존·중복 설치 점검"
    $found = @(& where.exe claude 2>$null)
    if ($found.Count -gt 0) { $found | ForEach-Object { Write-Info "PATH 상 claude: $_" } }
    else { Write-Info "현재 PATH 에서 claude 를 찾지 못함" }

    if (Test-Path $NATIVE_EXE) { Write-Ok "네이티브 설치본 있음: $NATIVE_EXE" }

    $legacy = Join-Path $CLAUDE_HOME 'local'
    if (Test-Path $legacy) {
        Write-Warn "구버전 로컬 npm 설치본 발견: $legacy"
        if (Confirm-Action "구버전 설치본을 삭제할까요? (설정/대화기록은 유지)") {
            Remove-Item -Recurse -Force $legacy -ErrorAction SilentlyContinue
            Write-Ok "삭제 완료"
        }
    }

    if (Get-NpmGlobalClaude) {
        Write-Warn "npm 전역 설치본($NPM_PACKAGE)이 있습니다. 네이티브 설치와 충돌(구버전 실행)할 수 있습니다."
        if (Confirm-Action "npm 전역 설치본을 제거할까요? (권장)") {
            & npm.cmd uninstall -g $NPM_PACKAGE 2>&1 | ForEach-Object { Write-Info $_ }
        }
    }

    if (Get-WingetClaude) {
        Write-Warn "WinGet 설치본($WINGET_ID)이 있습니다. 네이티브 설치와 중복됩니다."
        if (Confirm-Action "WinGet 설치본을 제거하고 네이티브(자동 업데이트)로 통일할까요?") {
            & winget.exe uninstall --id $WINGET_ID --exact --silent 2>&1 | ForEach-Object { Write-Info $_ }
        }
    }

    # 업데이트 도중 실패로 claude.exe 가 사라지고 백업만 남은 경우 복구
    if (-not (Test-Path $NATIVE_EXE)) {
        $bak = Get-ChildItem -Path "$NATIVE_EXE.old.*" -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -Last 1
        if ($bak) {
            Rename-Item -Path $bak.FullName -NewName 'claude.exe'
            Write-Ok "업데이트 백업에서 claude.exe 복구: $($bak.Name)"
        }
    }
}

# ---------------------------------------------------------------------------
# 3. Git for Windows (Git Bash)
# ---------------------------------------------------------------------------
function Find-GitBash {
    $candidates = New-Object System.Collections.Generic.List[string]
    if ($env:CLAUDE_CODE_GIT_BASH_PATH) { $candidates.Add($env:CLAUDE_CODE_GIT_BASH_PATH) }
    $git = Get-Command git.exe -ErrorAction SilentlyContinue
    if ($git) {
        # ...\Git\cmd\git.exe 또는 ...\Git\mingw64\bin\git.exe -> ...\Git\bin\bash.exe
        $root = Split-Path (Split-Path $git.Source -Parent) -Parent
        $candidates.Add((Join-Path $root 'bin\bash.exe'))
        $candidates.Add((Join-Path (Split-Path $root -Parent) 'bin\bash.exe'))
    }
    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'Programs'), (Join-Path $env:USERPROFILE 'scoop\apps\git\current'))) {
        if ($base) { $candidates.Add((Join-Path $base 'Git\bin\bash.exe')); $candidates.Add((Join-Path $base 'bin\bash.exe')) }
    }
    foreach ($c in $candidates) {
        # WSL 의 System32\bash.exe 는 Git Bash 가 아니므로 제외
        if ($c -and (Test-Path $c) -and ($c -notmatch '\\System32\\')) { return (Resolve-Path $c).Path }
    }
    return $null
}

function Install-GitIfNeeded {
    Write-Step "3/6 Git for Windows (Git Bash) 점검"
    if ($SkipGit) { Write-Info "-SkipGit 지정 -> 건너뜀"; return }

    $bash = Find-GitBash
    if (-not $bash) {
        Write-Warn "Git Bash 가 없습니다. 없어도 실행되지만(PowerShell 도구 사용), Bash 도구·Monitor 기능에 Git Bash 가 필요합니다."
        $wg = Get-Command winget.exe -ErrorAction SilentlyContinue
        if ($wg -and (Confirm-Action "WinGet 으로 Git for Windows 를 설치할까요? (Git 라이선스 동의 포함)")) {
            & $wg.Source install --id $GIT_WINGET_ID --exact --silent --accept-package-agreements --accept-source-agreements 2>&1 | ForEach-Object { Write-Info $_ }
            $env:Path = "$(Get-FreshSessionPath);$env:Path"
            $bash = Find-GitBash
        } elseif (-not $wg) {
            Write-Info "WinGet 이 없습니다. https://git-scm.com/downloads/win 에서 직접 설치 후 이 스크립트를 다시 실행하세요."
        }
    }

    if ($bash) {
        Write-Ok "Git Bash: $bash"
        if ($env:CLAUDE_CODE_GIT_BASH_PATH -ne $bash) {
            Set-UserEnvVar 'CLAUDE_CODE_GIT_BASH_PATH' $bash
            Write-Ok "환경변수 CLAUDE_CODE_GIT_BASH_PATH = $bash 등록 (수동 '환경 변수 편집'과 동일 효과)"
        }
    }
}

# ---------------------------------------------------------------------------
# 4. 설치 (공식 설치기 -> WinGet -> npm)
# ---------------------------------------------------------------------------
function Install-ViaOfficialScript {
    $downloads = Join-Path $CLAUDE_HOME 'downloads'
    if (Test-Path $downloads) {
        # 이전 실패/백신 검사로 잠긴 부분 다운로드 파일 정리
        Remove-Item -Recurse -Force $downloads -ErrorAction SilentlyContinue
    }
    $tmpScript = Join-Path $env:TEMP ("claude-official-install-{0}.ps1" -f [guid]::NewGuid().ToString('N'))
    try {
        $resp = Invoke-WebRequest -Uri $INSTALL_SCRIPT_URL -UseBasicParsing -TimeoutSec 60
        # 서버가 charset 을 안 주면 5.1 은 ISO-8859-1 로 해석하므로 원본 바이트를 직접 UTF-8 로 해석
        $text = [Text.Encoding]::UTF8.GetString($resp.RawContentStream.ToArray()).TrimStart([char]0xFEFF)
    } catch {
        Write-Fail "설치 스크립트 다운로드 실패: $($_.Exception.Message)"
        return $false
    }
    if ([string]::IsNullOrWhiteSpace($text) -or $text.TrimStart().StartsWith('<')) {
        Write-Fail "설치 스크립트 대신 웹페이지(HTML)를 받았습니다. 지역 제한/프록시/보안 필터 가능성이 높습니다."
        return $false
    }
    # 공식 설치기가 내부에서 exit 해도 이 스크립트가 같이 종료되지 않도록 별도 프로세스로 실행
    # (UTF-8 BOM 으로 저장해야 Windows PowerShell 5.1 이 올바르게 읽음)
    [IO.File]::WriteAllText($tmpScript, $text, (New-Object Text.UTF8Encoding $true))
    $psExe = (Get-Process -Id $PID).Path
    $out = & $psExe -NoProfile -ExecutionPolicy Bypass -File $tmpScript $Channel 2>&1
    $code = $LASTEXITCODE
    Remove-Item $tmpScript -Force -ErrorAction SilentlyContinue
    $out | ForEach-Object { Write-Info "$_" }
    if (($out | Out-String) -match $PERMISSION_PATTERN) { $script:PermissionDenied = $true }
    if (($out | Out-String) -match 'being used by another process') {
        Write-Info "백신이 다운로드 파일을 검사 중일 수 있습니다. 15초 대기 후 재시도합니다."
        Start-Sleep -Seconds 15
    }
    if ($code -ne 0) { Write-Info "공식 설치기 종료 코드: $code"; return $false }
    if (-not (Test-Path $NATIVE_EXE)) { return $false }
    $script:InstalledExe = $NATIVE_EXE
    return $true
}

function Get-NpmClaudeCmd {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) { return $null }
    $prefix = & $npm.Source prefix -g 2>$null | Select-Object -First 1
    if (-not $prefix) { return $null }
    # npm 의 .ps1 런처는 실행 정책에 막힐 수 있으므로 .cmd 를 사용
    $cmd = Join-Path ([string]$prefix).Trim() 'claude.cmd'
    if (Test-Path $cmd) { return $cmd }
    return $null
}

function Install-ViaWinget {
    $wg = Get-Command winget.exe -ErrorAction SilentlyContinue
    if (-not $wg) { Write-Info "WinGet 없음 -> 건너뜀"; return $false }
    & $wg.Source install --id $WINGET_ID --exact --silent --accept-package-agreements --accept-source-agreements 2>&1 | ForEach-Object { Write-Info "$_" }
    $code = $LASTEXITCODE
    $exe = Join-Path $WINGET_LINKS_DIR 'claude.exe'
    if ($code -ne 0 -or -not (Test-Path $exe)) { Write-Info "WinGet 종료 코드: $code"; return $false }
    $script:InstalledExe = $exe
    return $true
}

function Install-ViaNpm {
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) { Write-Info "npm 없음 -> 건너뜀"; return $false }
    & $npm.Source install -g "$NPM_PACKAGE@latest" 2>&1 | ForEach-Object { Write-Info "$_" }
    $code = $LASTEXITCODE
    $cmd = Get-NpmClaudeCmd
    if ($code -ne 0 -or -not $cmd) { Write-Info "npm 종료 코드: $code"; return $false }
    $script:InstalledExe = $cmd
    return $true
}

function Find-ClaudeExe {
    if (Test-Path $NATIVE_EXE) { return $NATIVE_EXE }
    $legacyExe = Join-Path $LEGACY_BIN_DIR 'claude.exe'
    if (Test-Path $legacyExe) { return $legacyExe }
    $wingetExe = Join-Path $WINGET_LINKS_DIR 'claude.exe'
    if (Test-Path $wingetExe) { return $wingetExe }
    $npmCmd = Get-NpmClaudeCmd
    if ($npmCmd) { return $npmCmd }
    return $null
}

function Install-Claude([int]$round) {
    Write-Step "4/6 Claude Code 설치 (라운드 $round, 채널: $Channel)"
    if ((Test-Path $NATIVE_EXE) -and $round -eq 1) {
        Write-Info "네이티브 설치본이 이미 있어 최신으로 덮어써 재설치합니다(손상 복구 겸)."
    }

    Write-Info "방법 A: 공식 네이티브 설치기 ($INSTALL_SCRIPT_URL)"
    for ($i = 1; $i -le 2; $i++) {
        if (Install-ViaOfficialScript) { Write-Ok "공식 설치기 성공: $NATIVE_EXE"; return $true }
        Write-Info "공식 설치기 재시도 $i/2"
        Start-Sleep -Seconds 3
    }

    Write-Warn "공식 설치기가 실패하여 대체 설치를 시도합니다."
    if ($null -eq $script:AllowWinget) { $script:AllowWinget = Confirm-Action "WinGet($WINGET_ID)으로 설치할까요? (자동 업데이트 안 됨, 패키지 약관 동의 포함)" }
    if ($script:AllowWinget -and (Install-ViaWinget)) { Write-Ok "WinGet 설치 성공"; return $true }
    if ($null -eq $script:AllowNpm) { $script:AllowNpm = Confirm-Action "npm($NPM_PACKAGE)으로 설치할까요? (Node.js 22+ 권장)" }
    if ($script:AllowNpm -and (Install-ViaNpm)) { Write-Ok "npm 설치 성공"; return $true }
    Write-Fail "모든 설치 방법이 실패했습니다."
    return $false
}

# ---------------------------------------------------------------------------
# 5. PATH 등록
# ---------------------------------------------------------------------------
function Register-ClaudePath {
    Write-Step "5/6 PATH 환경 변수 등록"
    $exe = $script:InstalledExe
    if (-not $exe) { $exe = Find-ClaudeExe }
    if ($exe -and $exe -ne $NATIVE_EXE -and (Test-Path $NATIVE_EXE)) {
        Write-Warn "대체 설치본($exe)과 별개로 기존 네이티브 claude.exe 가 남아 있어 먼저 실행될 수 있습니다: $NATIVE_EXE"
    }
    if (-not $exe) { Write-Fail "claude 실행 파일을 찾을 수 없어 PATH 를 등록할 수 없습니다."; return $false }
    $dir = Split-Path $exe -Parent
    Write-Info "claude 위치: $exe"
    $ok = Add-DirToUserPath $dir

    # 같은 이름의 다른 claude 가 PATH 앞쪽에 있어 가로채는지 확인
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    foreach ($entry in ($machinePath -split ';' | Where-Object { $_ })) {
        $p = Join-Path ([Environment]::ExpandEnvironmentVariables($entry)) 'claude.exe'
        if ((Test-Path $p) -and ((Get-NormalizedPathEntry (Split-Path $p -Parent)) -ne (Get-NormalizedPathEntry $dir))) {
            Write-Warn "시스템 PATH 에 다른 claude.exe 가 먼저 잡힙니다: $p (시스템 PATH 가 사용자 PATH 보다 우선)"
        }
    }
    return $ok
}

# ---------------------------------------------------------------------------
# 6. 검증: "새 터미널" 과 같은 환경에서 실행
# ---------------------------------------------------------------------------
function Invoke-InFreshEnv([string]$arguments, [int]$timeoutMs) {
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = Join-Path $env:SystemRoot 'System32\cmd.exe'
    $psi.Arguments = "/d /c claude $arguments"
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.RedirectStandardInput = $true
    $psi.CreateNoWindow = $true
    $psi.EnvironmentVariables['Path'] = Get-FreshSessionPath
    $psi.EnvironmentVariables['CI'] = '1'   # 대화형 프롬프트 방지
    $p = [System.Diagnostics.Process]::Start($psi)
    $p.StandardInput.Close()   # 입력 대기로 멈추지 않도록
    $stdoutTask = $p.StandardOutput.ReadToEndAsync()
    $stderrTask = $p.StandardError.ReadToEndAsync()
    if (-not $p.WaitForExit($timeoutMs)) {
        # cmd.exe 만 죽이면 claude.exe 가 남아 파일을 잠그므로 프로세스 트리 전체 종료
        & taskkill.exe /T /F /PID $p.Id 2>&1 | Out-Null
        return @{ ExitCode = -1; Output = "시간 초과($([int]($timeoutMs/1000))초)" }
    }
    return @{ ExitCode = $p.ExitCode; Output = ($stdoutTask.Result + $stderrTask.Result).Trim() }
}

function Test-Installation {
    Write-Step "6/6 검증 (새 터미널과 동일한 PATH 로 실행)"
    $v = Invoke-InFreshEnv '--version' $VERIFY_TIMEOUT_MS
    if ($v.ExitCode -ne 0 -or $v.Output -notmatch '\d+\.\d+\.\d+') {
        Write-Fail "claude --version 실패 (코드 $($v.ExitCode)): $($v.Output)"
        return $false
    }
    Write-Ok "claude --version -> $($v.Output)"

    $d = Invoke-InFreshEnv 'doctor' $VERIFY_TIMEOUT_MS
    if ($d.ExitCode -eq 0) {
        Write-Ok "claude doctor 통과"
    } else {
        Write-Warn "claude doctor 경고/오류 (코드 $($d.ExitCode)). 아래 내용을 확인하세요."
    }
    if ($d.Output) { $d.Output -split "`n" | Select-Object -First 40 | ForEach-Object { Write-Info $_ } }
    return $true
}

# ---------------------------------------------------------------------------
# 메인 루프: 설치 -> PATH -> 검증 을 성공할 때까지 반복
# ---------------------------------------------------------------------------
function Invoke-Main {
    Restart-In64BitIfNeeded
    try { Start-Transcript -Path $LOG_FILE -ErrorAction Stop | Out-Null } catch { }

    Write-Host "Claude Code Windows 설치 도우미" -ForegroundColor Magenta
    Write-Host "로그: $LOG_FILE" -ForegroundColor DarkGray

    if (-not (Test-Prerequisites)) {
        Write-Fail "사전 점검 실패. 위 안내를 해결한 뒤 다시 실행하세요."
        try { Stop-Transcript | Out-Null } catch { }
        return
    }
    Resolve-Conflicts
    Install-GitIfNeeded

    $success = $false
    # 이미 설치돼 있으면 PATH 만 고치고 바로 검증 (불필요한 재설치 방지)
    if (Find-ClaudeExe) {
        Write-Info "기존 설치본 발견 -> PATH 등록 후 먼저 검증합니다."
        if (Register-ClaudePath) { $success = Test-Installation }
        if (-not $success) { Write-Warn "기존 설치본 검증 실패 -> 재설치를 진행합니다." }
    }
    for ($round = 1; $round -le $MaxRounds -and -not $success; $round++) {
        $installed = Install-Claude $round
        if (-not $installed) { continue }
        if (-not (Register-ClaudePath)) { continue }
        $success = Test-Installation
        if (-not $success -and $round -lt $MaxRounds) {
            Write-Warn "검증 실패 -> 라운드 $($round + 1) 재시도"
            Start-Sleep -Seconds 3
        }
    }

    if (-not $success -and $script:PermissionDenied) {
        if (Restart-AsAdminIfAllowed) { try { Stop-Transcript | Out-Null } catch { }; return }
    }

    Write-Host ""
    if ($success) {
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host " 설치 완료!" -ForegroundColor Green
        Write-Host " 1) 지금 열려 있는 PowerShell/CMD/터미널/VS Code/Cursor 를 '완전히' 닫고 새로 여세요." -ForegroundColor Green
        Write-Host "    같은 창에서 계속 시도하면 바뀐 환경 변수가 적용되지 않습니다." -ForegroundColor Green
        Write-Host "    (이미 열린 창은 예전 PATH 를 그대로 가지고 있습니다)" -ForegroundColor Green
        Write-Host " 2) 새 터미널에서:  claude" -ForegroundColor Green
        Write-Host "    처음 실행 시 브라우저 로그인 (Pro/Max/Team/Enterprise 또는 Console 계정 필요)" -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
    } else {
        Write-Fail "$MaxRounds 회 시도 후에도 검증에 실패했습니다."
        Write-Info "로그 파일을 확인하세요: $LOG_FILE"
        Write-Info "문서: https://code.claude.com/docs/en/troubleshoot-install"
    }
    if ($script:Warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "주의 사항 요약:" -ForegroundColor Yellow
        $script:Warnings | Select-Object -Unique | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }
    try { Stop-Transcript | Out-Null } catch { }
    if ($success) { $script:ExitCode = 0 } else { $script:ExitCode = 1 }
}

# 함수 출력이 종료 코드에 섞이지 않도록 화면으로만 내보내고, 종료 코드는 변수로 전달
$script:ExitCode = 1
Invoke-Main | Out-Host
exit $script:ExitCode
