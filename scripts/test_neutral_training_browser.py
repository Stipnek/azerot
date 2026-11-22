import functools
import http.server
import json
import os
import threading
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path('test-results/neutral-training-browser')
KEY = 'azeroth-arms-hero-v1'
NORMAL_KEY = 'azeroth-ab-setup-v5'
NORMAL = '{"chars":[],"sound":false,"marker":"KEEP_NORMAL_NEUTRAL_TEST"}'
CLASSES = ['warrior','paladin','druid','priest','mage','hunter','rogue','warlock']
OBSERVER = """(() => {
 let value;
 Object.defineProperty(window,'Battle',{configurable:true,get(){return value;},set(api){
  value=api;if(!api || typeof api.createBattle!=='function')return;
  const original=api.createBattle;
  api.createBattle=function(opts){const state=original.apply(this,arguments);
   if(opts.test)window.__neutralLiveBattle=state;else window.__neutralPreview=state;
   return state;
  };
 }});
})();"""
server = http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE = f'http://127.0.0.1:{server.server_port}'


def saved(page,key=KEY):
    return page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',key)


def create(page,cls):
    page.wait_for_selector('#create:visible, #select:visible')
    if not page.locator('#create').is_visible():
        page.locator('#sel-new').click()
    race = 'nelf' if cls=='druid' else 'dwarf' if cls=='hunter' else 'human'
    page.locator(f'#cr48-races [data-race="{race}"]').click()
    page.locator('#cr-go').click()
    button=page.locator(f'[data-crcls="{cls}"]')
    expect(button).to_have_attribute('aria-disabled','false')
    button.click()
    page.locator('#cr-go').click()
    page.locator('#cr-name').fill('Учебник')
    page.locator('#cr-go').click()
    expect(page.locator('#select')).to_be_visible()


def enter(page,hero_id):
    page.locator(f'#sel-chars [data-char="{hero_id}"]').click()
    page.locator('#sel-enter').click()
    page.locator('#bnav [data-tab="hero"]').click()
    expect(page.locator('#w-hero .hname')).to_have_text('Учебник')


def level_fixture(page,level):
    page.evaluate("""({key,level})=>{
     const data=JSON.parse(localStorage.getItem(key)),h=data.chars[0];
     h.level=level;h.hxp={...h.hxp,me:Battle.xpAt(level)};h.party=['me'];
     h.v57onboarding=false;h.v57migrated=true;data.cur=h.id;
     localStorage.setItem(key,JSON.stringify(data));
    }""",{'key':KEY,'level':level})
    page.reload(wait_until='domcontentloaded')


def live_battle(page,cls,folder):
    page.locator('#bnav [data-tab="map"]').click()
    page.locator('[data-poly]').click()
    page.locator('#poly-go').click()
    page.wait_for_function('!!window.__neutralLiveBattle')
    actor=page.evaluate("""()=>{const s=window.__neutralLiveBattle,h=s.heroes.find(h=>h.isMain);
     return {id:h.id,skills:h.skills,pids:h.pids,neutral:h.neutralTraining,role:h.role};}""")
    assert actor['neutral'] and actor['role']=='training' and actor['pids']==[],actor
    assert len(actor['skills'])==3,actor
    first=actor['skills'][0]
    page.locator(f'#skillbar [data-sk="{first}"]').click()
    expect(page.locator('#card')).to_be_visible()
    expect(page.locator('#card h3')).to_have_text(page.evaluate('(id)=>Battle.SKILLS[id].name',first))
    expect(page.locator('#card')).not_to_contain_text('undefined')
    if cls=='warrior':
        expect(page.locator('#card')).to_contain_text('не резервирует')
    titles=page.locator('#skillbar .pass[data-sk^="passive:"]').evaluate_all('(els)=>els.map(e=>e.title)')
    racial=page.evaluate('()=>window.__neutralLiveBattle.heroes.find(h=>h.isMain).racePassive?.name')
    assert all(title==racial for title in titles),titles
    page.locator('#cardx').click()
    page.locator('#t-'+actor['id']).click()
    expect(page.locator('#card')).to_contain_text('Без специализации')
    for name in page.evaluate('(ids)=>ids.map(id=>Battle.SKILLS[id].name)',actor['skills']):
        expect(page.locator('#card')).to_contain_text(name)
    page.wait_for_function('window.__neutralLiveBattle.actions>0')
    page.screenshot(path=str(folder/'live-training-card.png'),full_page=True)


def run_case(browser,label,options,cls):
    folder=ROOT/label/cls
    folder.mkdir(parents=True,exist_ok=True)
    context=browser.new_context(**options)
    context.add_init_script(OBSERVER)
    context.tracing.start(screenshots=True,snapshots=True,sources=False)
    page=context.new_page()
    page.set_default_timeout(20000)
    errors,checks=[],[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.route('https://**/*',lambda route:route.abort())
    page.route('**/favicon.ico',lambda route:route.fulfill(status=204,body=''))
    status='failed'
    try:
        page.goto(BASE+'/arms-hero.html',wait_until='domcontentloaded')
        page.wait_for_function('!!window.Battle?.neutralTraining')
        page.evaluate('({key,normalKey,normal})=>{localStorage.setItem(normalKey,normal);localStorage.setItem(key,JSON.stringify({chars:[],sound:false,compAll:false,allSpecs:false}));}',{'key':KEY,'normalKey':NORMAL_KEY,'normal':NORMAL})
        page.reload(wait_until='domcontentloaded')
        create(page,cls)
        initial=saved(page)['chars'][0]
        assert initial['cls']==cls and initial['autoSpec15']['version']==1
        roll=initial['autoSpec15']['roll']
        assert 0<=roll<1 and initial['autoSpec15']['chosen'] is None
        hero_id=initial['id']
        for level in [1,2,5,9,14,15,15]:
            level_fixture(page,level)
            enter(page,hero_id)
            hero=saved(page)['chars'][0]
            assert hero['id']==hero_id and hero['autoSpec15']['roll']==roll
            assert hero['hxp']['me']==page.evaluate('(level)=>Battle.xpAt(level)',level)
            for field in ['money','items','gear']:
                assert hero.get(field,{ } if field!='money' else 0)==initial.get(field,{ } if field!='money' else 0),(field,hero,initial)
            page.locator('#w-hero').get_by_role('button',name='Умения и особенности',exact=True).click()
            dialog=page.locator('#w-hero dialog[aria-label="Умения и особенности"]')
            expect(dialog).to_be_visible()
            training=dialog.locator('[data-neutral-training]')
            if level<15:
                assert hero['autoSpec15']['chosen'] is None
                expect(training).to_have_count(1)
                expect(training).to_have_attribute('data-neutral-training',cls)
                expect(training).to_have_attribute('data-own-level',str(level))
                slots=page.evaluate('({cls,level})=>Battle.neutralTraining.slots(cls,level)',{'cls':cls,'level':level})
                expect(training.locator('[data-neutral-skill]')).to_have_count(3)
                for slot in slots:
                    row=training.locator('[data-neutral-skill="'+slot['id']+'"]')
                    expect(row).to_have_attribute('data-available',str(slot['available']).lower())
                    expect(row).to_contain_text(slot['name'])
                    if not slot['available']:
                        expect(row).to_contain_text('Откроется на '+str(slot['unlockLevel'])+' уровне')
                assert training.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),'Horizontal training overflow'
                expect(dialog.locator('[data-arms-panel]')).to_have_count(0)
            else:
                expect(training).to_have_count(0)
                expected=page.evaluate('({cls,roll})=>Object.keys(Battle.CLASSES[cls].specs).filter(s=>Battle.CLASSES[cls].specs[s].role==="dd").sort()[Math.floor(roll*Object.values(Battle.CLASSES[cls].specs).filter(s=>s.role==="dd").length)]',{'cls':cls,'roll':roll})
                assert hero['autoSpec15']['chosen']==expected and hero['specs']['me']==expected,hero
            if level in [1,14,15]:
                page.screenshot(path=str(folder/f'level-{level}.png'),full_page=True)
            dialog.get_by_role('button',name='Закрыть',exact=True).click()
            if level==9:
                live_battle(page,cls,folder)
            assert page.evaluate('(key)=>localStorage.getItem(key)',NORMAL_KEY)==NORMAL
            checks.append({'ownLevel':level,'chosen':hero['autoSpec15']['chosen']})
        assert not errors,errors
        status='passed'
    except Exception:
        (folder/'failure.txt').write_text(traceback.format_exc(),encoding='utf-8')
        raise
    finally:
        (folder/'result.json').write_text(json.dumps({'status':status,'sourceCommit':os.environ.get('SOURCE_COMMIT'),'viewport':label,'class':cls,'checks':checks,'pageErrors':errors,'scope':'Chromium desktop/mobile emulation. Actual creation, entry, skill dialogs, native polygon fight and tooltips. XP injected into test saves, onboarding skipped, remote assets blocked. No earned-XP grind, physical mobile/Safari, old-save migration or ordinary-mode browser acceptance.'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        try:
            if status!='passed':
                page.screenshot(path=str(folder/'failure.png'),full_page=True)
        finally:
            context.tracing.stop(path=str(folder/'trace.zip'))
            context.close()
    print(json.dumps({'viewport':label,'class':cls,'status':status,'checks':checks},ensure_ascii=False))


failures=[]
try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        try:
            for label,options in [('desktop',{'viewport':{'width':1280,'height':900}}),('mobile',dict(p.devices['iPhone 13']))]:
                for cls in CLASSES:
                    try:
                        run_case(browser,label,options,cls)
                    except Exception:
                        failures.append({'viewport':label,'class':cls,'error':traceback.format_exc()})
        finally:
            browser.close()
finally:
    server.shutdown()
ROOT.mkdir(parents=True,exist_ok=True)
(ROOT/'summary.json').write_text(json.dumps({'sourceCommit':os.environ.get('SOURCE_COMMIT'),'cases':16,'failures':failures},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if failures:
    raise SystemExit(f'{len(failures)} of 16 browser cases failed; see artifacts')
