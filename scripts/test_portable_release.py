"""Test the ZIP in a clean temporary directory using only its bundled runtime."""
import json,os,subprocess,tempfile,time,urllib.request,zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
archive=ROOT/'releases/NOMaD-Explorer-1.0.0-Windows-x64.zip'
with tempfile.TemporaryDirectory(prefix='NOMaD portable test ') as temp:
    with zipfile.ZipFile(archive) as z:z.extractall(temp)
    package=next(Path(temp).iterdir())
    assert not (package/'backend/data').exists()
    config_path=package/'backend/game_config.json'
    config=json.loads(config_path.read_text());config['dispenser']['enabled']=False
    config_path.write_text(json.dumps(config))
    env={k:v for k,v in os.environ.items() if k not in ['PYTHONPATH','PYTHONHOME','NOMAD_DB_PATH','VIRTUAL_ENV']}
    env['PATH']=os.path.join(os.environ['SystemRoot'],'System32')
    log=open(Path(temp)/'server.log','w')
    server=subprocess.Popen([str(package/'runtime/python.exe'),str(package/'launch.py'),'--no-browser','--port','8015'],cwd=temp,env=env,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        for _ in range(80):
            try:urllib.request.urlopen('http://127.0.0.1:8015/api/health');break
            except Exception:
                if server.poll() is not None:raise RuntimeError((Path(temp)/'server.log').read_text())
                time.sleep(.2)
        else:raise RuntimeError('Portable server did not start')
        assert json.load(urllib.request.urlopen('http://127.0.0.1:8015/api/leaderboard'))['entries']==[]
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True,args=['--enable-unsafe-swiftshader','--disable-extensions','--disable-component-extensions-with-background-pages'])
            page=browser.new_page();errors=[];external=[];failed=[]
            page.on('pageerror',lambda e:errors.append(e.stack))
            page.on('requestfailed',lambda r:failed.append((r.url,r.failure)))
            def offline(route):
                if not route.request.url.startswith('http://127.0.0.1:8015/'):
                    external.append(route.request.url);route.abort()
                else:route.continue_()
            page.route('**/*',offline)
            page.goto('http://127.0.0.1:8015/')
            page.locator('.object-guide-open').click();page.locator('.guide-content section').first.wait_for()
            assert page.locator('.guide-content section').count()==15
            page.keyboard.press('Escape');page.locator('#start').click()
            page.keyboard.press('Escape');page.locator('#end-game').click()
            page.wait_for_function("document.querySelector('#score-save-status').textContent.includes('Score saved')")
            page.locator('#restart').click();page.locator('.landing-leaderboard').click()
            page.wait_for_function("document.querySelectorAll('.board-list li').length===1")
            assert not errors,{'errors':errors,'external':external,'failed':failed}
            assert not external,external
            browser.close()
        print('PASS: clean extraction, bundled Python only, no system Python/Node PATH, offline assets, 15 example categories, gameplay, save/replay/leaderboard, empty initial database')
    finally:server.terminate();server.wait(timeout=10);log.close()
