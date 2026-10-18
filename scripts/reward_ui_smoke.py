"""Reward UI checks with no hardware or backend calls."""
import json,subprocess,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
server=subprocess.Popen([str(ROOT/'.runtime/node.exe'),'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=subprocess.CREATE_NO_WINDOW)
try:
    for _ in range(40):
        try:urllib.request.urlopen('http://127.0.0.1:5174');break
        except Exception:time.sleep(.2)
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('http://127.0.0.1:5174/',lambda r:r.fulfill(body='<html><body></body></html>',content_type='text/html'))
        page.goto('http://127.0.0.1:5174/')
        page.evaluate("async()=>{window.reward= (await import('/src/chocolate.ts')).celebrateChocolate;}")
        for status in ['dispensed','blocked','stuck','disconnected','not_eligible','communication_timeout']:
            page.evaluate('(status)=>{window.rewardDone=false;reward(()=>Promise.resolve(status)).then(()=>window.rewardDone=true)}',status)
            page.locator('#chocolate-reward').wait_for(state='visible')
            page.wait_for_timeout(100)
            assert page.locator('.chocolate-gift').is_visible()==(status=='dispensed')
            assert page.locator('.milestone-medal').is_visible()==(status!='dispensed')
            page.keyboard.press('Enter');page.wait_for_function('window.rewardDone')
        page.evaluate("()=>{window.rewardDone=false;reward(()=>new Promise(resolve=>window.deliver=resolve)).then(()=>window.rewardDone=true)}")
        page.locator('#chocolate-continue').click();page.wait_for_function('window.rewardDone')
        page.evaluate("window.deliver('stuck')")
        page.evaluate("()=>{window.rewardDone=false;reward(()=>Promise.resolve('dispensed')).then(()=>window.rewardDone=true)}")
        page.wait_for_timeout(5500)
        assert page.locator('#chocolate-reward').is_visible()
        page.keyboard.press('Escape');page.wait_for_function('window.rewardDone')
        assert not errors,errors
        browser.close()
    print('PASS: six reward outcomes, early dismissal while pending, late result, manual-only close beyond five seconds, Enter/Escape; no hardware calls')
finally:server.terminate();server.wait(timeout=10)
