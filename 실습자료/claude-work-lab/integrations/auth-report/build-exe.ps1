# Windows PowerShell 5.1에서 실습 폴더의 실행기를 한 번 만듭니다.
$ErrorActionPreference = 'Stop'
if ($PSVersionTable.PSEdition -ne 'Desktop') {
    throw 'Windows PowerShell 5.1의 powershell.exe로 실행해 주세요.'
}
$labRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$outputExe = Join-Path $labRoot 'ExcelReport.exe'
$sourceFile = Join-Path $PSScriptRoot 'ExcelReport.cs'
Get-Command node.exe -ErrorAction Stop | Out-Null
Get-Command claude.exe -ErrorAction Stop | Out-Null
if (Test-Path -LiteralPath $outputExe) {
    throw 'ExcelReport.exe가 이미 있습니다. 기존 파일을 확인하고 필요할 때 이름을 바꾼 뒤 다시 만들어 주세요.'
}
$source = [System.IO.File]::ReadAllText($sourceFile, [System.Text.Encoding]::UTF8)
Add-Type -TypeDefinition $source -Language CSharp -OutputAssembly $outputExe -OutputType ConsoleApplication
Write-Host "만들었습니다: $outputExe"
Write-Host 'inbox-auth 안에 Excel 한 개를 넣고 ExcelReport.exe를 더블클릭하세요.'
