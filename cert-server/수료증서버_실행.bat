@echo off
chcp 65001 > nul
title 수료증 PDF 서버

echo 수료증 PDF 서버를 시작합니다...
echo.

cd /d "%~dp0"

if not exist node_modules (
  echo 패키지 설치 중... (최초 1회)
  npm install
  echo.
)

echo 서버 실행 중: http://localhost:3456
echo 이 창을 닫으면 수료증 발급이 중단됩니다.
echo.

node index.js

pause
