"""Double-click launcher for the self-contained Windows release."""
import argparse
import os
import socket
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path
import uvicorn

ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)
os.environ.setdefault('NOMAD_DB_PATH',str(ROOT/'backend/data/scores.sqlite3'))

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--port',type=int,default=8000)
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    from backend.app import app,GameConfig
    GameConfig.model_validate_json((ROOT/'backend/game_config.json').read_text())
    port=None
    for candidate in range(args.port,args.port+11):
        with socket.socket() as probe:
            try:probe.bind(('127.0.0.1',candidate));port=candidate;break
            except OSError:pass
    if port is None:raise RuntimeError('No free local port. Close another copy of the game and try again.')
    url=f'http://127.0.0.1:{port}/'
    print('NOMaD Explorer - Windows portable release',flush=True)
    print('Game: '+url+'\nKeep this window open while playing. Press Ctrl+C to stop.\nSettings: backend/game_config.json',flush=True)
    if not args.no_browser:
        def open_browser():
            for _ in range(60):
                try:
                    urllib.request.urlopen(url+'api/health',timeout=.5).close()
                    webbrowser.open(url);return
                except Exception:time.sleep(.25)
        threading.Thread(target=open_browser,daemon=True).start()
    uvicorn.run(app,host='127.0.0.1',port=port,log_level='warning')

if __name__=='__main__':
    try:main()
    except KeyboardInterrupt:pass
    except Exception as error:
        print('Could not start the game:',error,flush=True)
        raise SystemExit(1)
