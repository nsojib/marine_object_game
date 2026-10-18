"""Build a self-contained Windows x64 ZIP; run with the development Python."""
import argparse, hashlib, json, shutil, subprocess, sys, urllib.request, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PYTHON_VERSION='3.13.16'
PYTHON_SHA256='97dae5274cc54867065e8d5a3226e48c35017ed332a0fdb0e27d5b5821961297'
parser=argparse.ArgumentParser();parser.add_argument('--version',default='1.0.0');args=parser.parse_args()
if not all(part.isdigit() for part in args.version.split('.')):raise SystemExit('Use a numeric release version')
name=f'NOMaD-Explorer-{args.version}-Windows-x64'
release=ROOT/'releases'/name
release.mkdir(parents=True,exist_ok=False)
cache=ROOT/'.runtime';cache.mkdir(exist_ok=True)
archive=cache/f'python-{PYTHON_VERSION}-embed-amd64.zip'
if not archive.exists():urllib.request.urlretrieve(f'https://www.python.org/ftp/python/{PYTHON_VERSION}/{archive.name}',archive)
if hashlib.sha256(archive.read_bytes()).hexdigest()!=PYTHON_SHA256:raise SystemExit('Python archive checksum mismatch')
runtime=release/'runtime';runtime.mkdir()
with zipfile.ZipFile(archive) as z:z.extractall(runtime)
(runtime/'python313._pth').write_text('python313.zip\n.\n..\nLib/site-packages\nimport site\n')
subprocess.run([sys.executable,'-m','pip','install','--disable-pip-version-check','--no-compile','--only-binary=:all:','--platform','win_amd64','--python-version','3.13','--implementation','cp','--abi','cp313','--target',str(runtime/'Lib/site-packages'),'-r',str(ROOT/'backend/requirements-release.txt')],check=True)
shutil.copytree(ROOT/'dist',release/'dist',ignore=shutil.ignore_patterns('reference-photos'))
(release/'backend').mkdir()
for file in ['__init__.py','app.py','game_config.json','requirements.txt']:
    shutil.copy2(ROOT/'backend'/file,release/'backend'/file)
shutil.copy2(ROOT/'node_modules/three/LICENSE',release/'THREE-LICENSE.txt')
shutil.copy2(ROOT/'backend/requirements-release.txt',release/'backend/requirements-release.txt')
for file in ['myarduino.py','ASSET-CREDITS.md','PHOTO-CREDITS.md','EXHIBITION-CHECKS.md','RELEASE-NOTES.md']:
    shutil.copy2(ROOT/file,release/file)
shutil.copy2(ROOT/'scripts/portable_launcher.py',release/'launch.py')
(release/'PLAY.cmd').write_text('@echo off\ncd /d "%~dp0"\n"%~dp0runtime\\python.exe" "%~dp0launch.py"\nif errorlevel 1 pause\n')
(release/'START-HERE.txt').write_text("""NOMaD Explorer - Windows x64 portable edition

1. Extract the entire ZIP to a writable folder such as Desktop or Documents.
2. Double-click PLAY.cmd. Do not run from inside the ZIP.
3. The game opens in your browser. Use current Microsoft Edge or Chrome.
4. Keep the game console window open. Press Ctrl+C there to stop it.

No Python, Node.js, pip, or internet connection is needed on this computer.
Requires Windows 10/11 x64 and a browser with WebGL hardware acceleration.
Use F11 in the browser for a full-screen exhibition display.

CONTROLS
Keyboard: arrows or WASD to sail, 1-4 to answer, Escape to pause.
Xbox: left stick to sail; A/B/X/Y to answer; Menu to pause.
Menus: arrow keys or D-pad to select, Enter or A to confirm.
Name is optional. See Example teaches the categories.

SETTINGS
Edit backend/game_config.json and refresh the browser.
Dispenser: enabled=false gives milestone celebrations without hardware.
For the Arduino sensor dispenser, select the correct COM port and close
other serial tools. USB drivers may be required for that board.
The game remains playable if the dispenser is missing or faulty.

This release starts with an empty leaderboard. Scores are stored in
backend/data/scores.sqlite3. Keep that folder when updating the game.
No personal scores from the developer computer are included.

Only a local server is started; it is not exposed to the network.
If port 8000 is busy the launcher selects the next available port.
The URL printed in the console is the correct address.

See EXHIBITION-CHECKS.md for test results and physical setup checks.
""",encoding='utf-8')
(release/'RELEASE.json').write_text(json.dumps({'version':args.version,'git_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'platform':'Windows x64','python':PYTHON_VERSION,'python_source':f'https://www.python.org/downloads/release/python-{PYTHON_VERSION.replace(".","")}/','python_sha256':PYTHON_SHA256},indent=2))
output=Path(shutil.make_archive(str(ROOT/'releases'/name),'zip',release.parent,release.name))
checksum=hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.zip.sha256').write_text(checksum+'  '+output.name+'\n')
print(json.dumps({'zip':str(output),'size_mb':round(output.stat().st_size/1048576,1),'sha256':checksum}))
