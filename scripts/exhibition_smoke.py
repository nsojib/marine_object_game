"""Exhibition browser soak test. Uses a temporary database and mocked hardware."""
import json, os, subprocess, tempfile, time, urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as temp:
    env=dict(os.environ,NOMAD_DB_PATH=str(Path(temp)/'scores.db'))
    code="import backend.app as m; import uvicorn; m.dispense_chocolate=lambda **kw:None; uvicorn.run(m.app,host='127.0.0.1',port=8003)"
    server=subprocess.Popen([str(ROOT/'.venv/Scripts/python.exe'),'-c',code],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW if os.name=='nt' else 0)
    try:
        for _ in range(60):
            try:urllib.request.urlopen('http://127.0.0.1:8003/api/health');break
            except Exception:time.sleep(.2)
        with sync_playwright() as p:
            browser=p.chromium.launch(channel='msedge',headless=True,args=['--enable-unsafe-swiftshader'])
            page=browser.new_page(viewport={'width':1280,'height':720});errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.add_init_script("window.pad=null;Object.defineProperty(navigator,'getGamepads',{value:()=>window.pad?[window.pad]:[]});")
            page.goto('http://127.0.0.1:8003');page.locator('#start').wait_for()
            page.locator('#start').focus();page.keyboard.press('ArrowUp');assert page.locator('#player-name').evaluate('e=>e===document.activeElement')
            page.keyboard.press('ArrowDown');assert page.locator('#start').evaluate('e=>e===document.activeElement')
            page.screenshot(path=str(ROOT/'.runtime/exhibition-landing.png'))
            page.keyboard.press('Enter');page.keyboard.down('ArrowUp')
            page.locator('#departure-reminder').wait_for(state='visible',timeout=15000);page.keyboard.up('ArrowUp')
            assert page.locator('#departure-continue').evaluate('e=>e===document.activeElement')
            page.keyboard.press('ArrowUp');page.keyboard.press('Enter');page.locator('#object-guide').wait_for(state='visible')
            page.locator('#object-guide .guide-content section').first.wait_for()
            assert page.locator('#object-guide .guide-content section').count()==15
            page.keyboard.press('Escape');page.locator('#departure-reminder').wait_for(state='visible')
            page.locator('#departure-continue').click();page.keyboard.press('Escape')
            page.locator('#pause-field-guide').click();page.keyboard.press('Escape');page.locator('#pause-menu').wait_for(state='visible')
            page.locator('#resume-game').click()
            page.evaluate("window.pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}")
            page.wait_for_function("document.querySelector('#predictions').classList.contains('controller-layout')")
            page.evaluate('window.pad=null');page.locator('#pause-menu').wait_for(state='visible')
            page.wait_for_function("!document.querySelector('#predictions').classList.contains('controller-layout')")
            page.locator('#end-game').click();page.wait_for_function("document.querySelector('#score-save-status').textContent.includes('Score saved')")
            page.locator('#restart').click()
            cdp=page.context.new_cdp_session(page);cdp.send('HeapProfiler.collectGarbage');before=cdp.send('Runtime.getHeapUsage')['usedSize']
            for i in range(25):
                page.locator('#start').click();page.keyboard.press('Escape');page.locator('#end-game').click()
                page.wait_for_function("document.querySelector('#score-save-status').textContent.includes('Score saved')")
                page.locator('#restart').click()
                assert page.locator('#player-name').input_value()==''
            cdp.send('HeapProfiler.collectGarbage');after=cdp.send('Runtime.getHeapUsage')['usedSize']
            page.locator('.landing-leaderboard').click();page.wait_for_function("document.querySelectorAll('.board-list li').length===10")
            page.keyboard.press('Escape')
            page.route('**/api/leaderboard*',lambda r:r.fulfill(status=503,body='unavailable'))
            page.locator('.landing-leaderboard').click();page.wait_for_function("document.querySelector('.board-status').textContent.includes('temporarily unavailable')")
            page.keyboard.press('Escape')
            for width,height in [(1024,768),(800,600),(390,844)]:
                page.set_viewport_size({'width':width,'height':height})
                page.locator('#start').scroll_into_view_if_needed();assert page.locator('#start').is_visible()
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            assert not errors,errors
            print(json.dumps({'games_completed':26,'browser_errors':errors,'heap_before_mb':round(before/1048576,1),'heap_after_mb':round(after/1048576,1),'checks':['name navigation','reminder focus','15 guide categories','guide return','controller disconnect/fallback','top ten','leaderboard failure','three viewport sizes']}))
            browser.close()
    finally:server.terminate();server.wait(timeout=10)
