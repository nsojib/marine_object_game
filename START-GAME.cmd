@echo off
cd /d "%~dp0"
if exist ".runtime\node.exe" (
  ".runtime\node.exe" "node_modules\vite\bin\vite.js" --host 127.0.0.1 --open
) else (
  call npm run dev -- --open
)
