@echo off
cd /d "%~dp0"
start "" powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Set-Location -LiteralPath '%~dp0'; $s=[IO.File]::ReadAllText('%~dp0start.ps1',[Text.Encoding]::UTF8); . ([ScriptBlock]::Create($s))"
