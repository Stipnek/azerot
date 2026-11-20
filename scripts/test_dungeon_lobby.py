import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

hero={'id':'lobby-test','name':'Проверка','race':'human','cls':'warrior','level':20,'hxp':{'me':20000,'gpriest':20000,'gmage':20000},'party':['me'],'specs':{'me':'prot','gpriest':'holy','gmage':'frost'},'items':{},'gear':{},'money':0,'q':{},'zone':'westfall','at':'sentinel','intro':{'westfall':1,'elwynn':1},'v57migrated':True,'v57onboarding':False,'tav':{'st':0,'coll':{'gpriest':{'cls':'priest','sp':'holy','br':1,'r':1,'k':1,'n':'Priest','race':'human'},'gmage':{'cls':'mage','sp':'frost','br':1,'r':1,'k':1,'n':'Mage','race':'human'}}}}
key='azeroth-ab-setup-v5'
saved={'chars':[hero],'cur':'lobby-test','compAll':False,'sound':False}
server=http.server.ThreadingHTTPServer(('127.0.0.1',8768),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        try:
            context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            page=context.new_page()
            errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.add_init_script('localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(saved,ensure_ascii=False))+');')
            page.goto('http://127.0.0.1:8768/',wait_until='load',timeout=90000)
            page.locator('#sel-enter').click(timeout=30000)
            page.locator('#dm-map-entry').wait_for(state='visible',timeout=30000)
            assert page.locator('#free-deadmines-entry').count()==0
            page.locator('#dm-map-entry').click()
            lobby=page.locator('#dm-lobby[open]')
            lobby.wait_for()
            assert page.locator('#battle').is_hidden()
            assert '6 основных комнат / боссов + 1 необязательный' in lobby.inner_text()
            assert lobby.locator('[data-dm-bosses] li').count()==7
            assert lobby.locator('[data-dm-loot] details').count()==7
            assert lobby.locator('[data-dm-loot] p').count()==21
            lobby.locator('[data-dm-add]').click()
            picker=page.locator('.az573-pick[open]')
            picker.locator('[data-candidate="gpriest"]').click()
            page.wait_for_function('key=>JSON.parse(localStorage.getItem(key)).chars[0].party.join()==="me,gpriest"',arg=key)
            lobby.locator('[data-dm-slot="1"]').click()
            picker.locator('[data-candidate="gmage"]').click()
            page.wait_for_function('key=>JSON.parse(localStorage.getItem(key)).chars[0].party.join()==="me,gmage"',arg=key)
            assert page.locator('#battle').is_hidden()
            lobby.locator('header button').click()
            assert page.locator('#battle').is_hidden()
            page.locator('#dm-map-entry').click()
            page.evaluate('Math.random=()=>0.99')
            lobby.locator('[data-dm-start]').click()
            page.locator('#battle').wait_for(state='visible',timeout=30000)
            assert 'Рахк' in page.locator('#room').inner_text()
            assert not errors,errors
            print('Dungeon lobby Chromium test passed: persistent map entry without quests, no service start, boss/loot data, add/replace/save party, close without battle, explicit start.')
            context.close()
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
