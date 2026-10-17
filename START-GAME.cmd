@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Install the backend first:
  echo python -m venv .venv
  echo .venv\Scripts\python.exe -m pip install -r backend\requirements.txt
  exit /b 1
)
".venv\Scripts\python.exe" "scripts\run_game.py"
