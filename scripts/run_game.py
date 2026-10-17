"""Start the API and Vite together; Ctrl+C stops both."""
import os, shutil, subprocess, sys, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
node=str(ROOT/'.runtime/node.exe') if (ROOT/'.runtime/node.exe').exists() else shutil.which('node')
if not node:
    raise SystemExit('Install Node.js to run the development frontend.')
children=[]
try:
    for command in [[sys.executable,'-m','uvicorn','backend.app:app','--host','127.0.0.1','--port','8000'],[node,'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort']]:
        children.append(subprocess.Popen(command,cwd=ROOT,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0))
    print('Game: http://127.0.0.1:5173  |  API: http://127.0.0.1:8000/docs',flush=True)
    while all(p.poll() is None for p in children):time.sleep(.5)
except KeyboardInterrupt:
    pass
finally:
    for child in children:
        if child.poll() is None:child.terminate()
    for child in children:
        try:child.wait(timeout=5)
        except subprocess.TimeoutExpired:child.kill()
