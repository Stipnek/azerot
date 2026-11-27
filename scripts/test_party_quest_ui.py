import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

out=Path('results/party-quest-ui')
out.mkdir(parents=True,exist_ok=True)
server=http.server.ThreadingHTTPServer(('127.0.0.1',8767),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
threading.Thread(target=server.serve_forever,daemon=True).start()
checks=[]
key='azeroth-ab-setup-v5'
def setup_script(owned=True):
    coll={
        'ghighcommon':{'cls':'warrior','sp':'prot','br':0,'r':0,'k':1,'n':'Common','race':'human'},
        'ghighrare':{'cls':'warrior','sp':'prot','br':2,'r':2,'k':2,'n':'Rare','race':'human'},
        'glowlegend':{'cls':'warrior','sp':'arms','br':1,'r':4,'k':5,'n':'Promoted','race':'human'}
    } if owned else {}
    hxp={'me':10000 if owned else 0,**{k:0 if k=='glowlegend' else 10000 for k in coll}}
    hero={'id':'party-ui-test','name':'Проверка','race':'human','cls':'warrior','level':1,'hxp':hxp,'party':['me'],'specs':{'me':'prot',**{k:v['sp'] for k,v in coll.items()}},'tav':{'st':200 if owned else 0,'coll':coll},'q':{'ef_candles':1,'garrick':1,'kobold_camp':2,'hogger':2},'qprog':{'ef_candles':[2]},'zone':'elwynn','at':'goldshire','v57onboarding':False,'v57migrated':True,'intro':{'elwynn':1},'items':{},'gear':{},'money':0}
    saved={'chars':[hero],'cur':hero['id'],'compAll':False,'allQ':owned,'sound':False}
    return 'localStorage.setItem('+json.dumps(key)+','+json.dumps(json.dumps(saved,ensure_ascii=False))+');'
def saved_hero(page):
    return page.evaluate('key=>{const s=JSON.parse(localStorage.getItem(key));return s.chars.find(h=>h.id===s.cur);}',key)
def enter(page,script):
    page.add_init_script(script)
    page.goto('http://127.0.0.1:8767/',wait_until='load',timeout=90000)
    page.locator('#sel-enter').click(timeout=30000)
    page.locator('#bnav [data-tab="party"]').wait_for(state='visible',timeout=30000)
def open_quest(page,name):
    if page.locator('#qsheet:not([hidden])').count():
        page.locator('#qclose').click()
    page.locator('#jl [data-q="'+name+'"]').click()
    page.locator('#qsheet:not([hidden])').wait_for()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        try:
            context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            errors=[]
            try:
                page=context.new_page()
                page.on('pageerror',lambda error:errors.append(str(error)))
                enter(page,setup_script())
                page.locator('#bnav [data-tab="party"]').click()
                page.locator('#slots [data-empty-slot="1"]').click()
                picker=page.locator('.az573-pick[open]')
                candidates=picker.locator('[data-candidate]')
                assert candidates.evaluate_all('(nodes)=>nodes.map(n=>n.dataset.candidate)')==['ghighrare','ghighcommon','glowlegend']
                assert picker.locator('[data-candidate="ghighrare"]').evaluate('(n)=>getComputedStyle(n).borderTopColor')=='rgb(0, 112, 221)'
                # PARTY-02: no visible rarity line; rarity and bonus stay in the accessible name
                assert picker.locator('.az-picker-rarity').count()==0
                assert 'Легендарный' in picker.locator('[data-candidate="glowlegend"]').get_attribute('aria-label')
                assert '% к характеристикам' in picker.locator('[data-candidate="glowlegend"]').get_attribute('aria-label')
                # PLAY-17: filters in a compact block, nothing spills out of a card
                assert picker.locator('[data-picker-sort]').bounding_box()['y']-picker.locator('[data-role="all"]').bounding_box()['y']<70
                assert picker.locator('[data-candidate]').evaluate_all('(ns)=>ns.every(n=>n.scrollHeight<=n.clientHeight+1)')
                picker.locator('[data-picker-sort]').select_option('rarity')
                assert candidates.first.get_attribute('data-candidate')=='glowlegend'
                picker.locator('[data-picker-sort]').select_option('power')
                assert candidates.count()==3
                picker.locator('[data-picker-rarity]').select_option('4')
                assert candidates.count()==1
                picker.locator('[data-role="heal"]').click()
                assert candidates.count()==0
                assert picker.locator('[data-picker-rarity]').input_value()=='4'
                picker.locator('[data-role="all"]').click()
                assert candidates.count()==1
                picker.locator('[data-picker-rarity]').select_option('all')
                picker.locator('[data-picker-sort]').select_option('level')
                page.screenshot(path=str(out/'picker-rarity.png'),full_page=True)
                picker.locator('[data-candidate="ghighrare"]').click()
                assert saved_hero(page)['party']==['me','ghighrare']
                checks.append('Real slot picker: current-rarity frame/label, level/rarity ordering, power mode, combined filters and manual selection')
                page.locator('#bnav [data-tab="map"]').click()
                page.locator('#az-services-toggle').click()
                page.locator('#az-services-menu button').filter(has_text='Таверна').first.click()
                page.evaluate('window.__originalRandom=Math.random;let n=0;const values=[0.1,0.2,0,0.4];Math.random=()=>values[Math.min(n++,values.length-1)];')
                page.locator('#tav-pull').click()
                page.wait_for_function('key=>Object.keys(JSON.parse(localStorage.getItem(key)).chars[0].tav.coll).length===4',arg=key,timeout=15000)
                page.evaluate('Math.random=window.__originalRandom;')
                hero=saved_hero(page)
                assert hero['party']==['me','ghighrare']
                assert hero['tav']['st']==150
                page.locator('#tavclose').click()
                checks.append('Paid new summon saves to collection, charges once and leaves the manually selected party unchanged')
                open_quest(page,'ef_candles')
                panel=page.locator('#jd')
                assert panel.locator('.jparty').count()==0
                assert panel.locator('.hint.tip').count()==0
                assert '2 / 8' in panel.inner_text()
                assert panel.locator('.az-quest-rewards').count()==1
                assert 'Вильям Пест' in panel.inner_text()
                page.screenshot(path=str(out/'quest-goals-rewards.png'),full_page=True)
                open_quest(page,'garrick')
                assert page.locator('#q-party').is_visible()
                assert page.locator('#jd .jparty').count()==0
                open_quest(page,'kobold_camp')
                assert 'Жилет Североземья' in page.locator('#jd .az-quest-rewards').inner_text()
                open_quest(page,'hogger')
                assert page.locator('#q-turn').is_disabled()
                assert page.locator('#jd .az-quest-rewards input[type="radio"]').count()==2
                page.locator('#jd .az-quest-rewards input[type="radio"]').last.check()
                assert page.locator('#q-turn').is_enabled()
                open_quest(page,'tutorial57_hire')
                assert 'гарантированный спутник' in page.locator('#jd .az-quest-rewards').inner_text()
                checks.append('Actual quest panels: no party strip/enemy-stat block, preserved counters/giver/group action, grouped item rewards, explicit Hogger choice and onboarding reward override')
                assert not errors,errors
            finally:
                context.close()
            context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
            try:
                page=context.new_page()
                errors=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                enter(page,setup_script(False))
                page.locator('#az-services-toggle').click()
                page.locator('#az-services-menu button').filter(has_text='Таверна').first.click()
                page.locator('#tav-pull').click()
                page.wait_for_function('key=>Object.keys(JSON.parse(localStorage.getItem(key)).chars[0].tav.coll).length===1',arg=key,timeout=15000)
                hero=saved_hero(page)
                assert hero['party']==['me']
                assert hero['tav']['st']==0
                assert not errors,errors
                checks.append('First free summon remains free and requires manual party selection')
            finally:
                context.close()
        finally:
            browser.close()
finally:
    (out/'results.json').write_text(json.dumps({'checks':checks,'scope':'Isolated Chromium mobile viewport with synthetic saved characters and real built game UI/storage; not physical-phone validation or complete gameplay balance testing.'},ensure_ascii=False,indent=2),encoding='utf-8')
    server.shutdown();server.server_close()
