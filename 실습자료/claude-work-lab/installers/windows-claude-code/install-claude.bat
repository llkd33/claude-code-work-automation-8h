@echo off
REM ==========================================================
REM  Claude Code CLI installer for Windows (double-click me)
REM  Runs Install-ClaudeCode.ps1 with 64-bit Windows PowerShell,
REM  bypassing the execution policy for this run only.
REM  Extra arguments are passed through, e.g.:
REM    install-claude.bat -Channel stable -Yes
REM ==========================================================
setlocal
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if exist "%SystemRoot%\Sysnative\WindowsPowerShell\v1.0\powershell.exe" set "PS_EXE=%SystemRoot%\Sysnative\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%~dp0Install-ClaudeCode.ps1" (
  echo [ERROR] Install-ClaudeCode.ps1 must be in the same folder as this .bat file.
  pause
  exit /b 1
)

"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-ClaudeCode.ps1" %*
set "RC=%ERRORLEVEL%"
echo.
if "%RC%"=="0" (echo Done. Close this window and open a NEW terminal, then type: claude) else (echo Install did not finish. See the log path printed above.)
pause
exit /b %RC%
