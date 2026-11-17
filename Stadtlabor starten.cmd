@echo off
cd /d "%~dp0"
if not exist dist\index.html (
  echo Bitte zuerst npm install und npm run build ausfuehren.
  pause
  exit /b 1
)
start "" http://127.0.0.1:4173
node scripts/serve.mjs
pause
