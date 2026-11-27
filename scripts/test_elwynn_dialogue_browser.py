import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

OUT = Path('results/elwynn-dialogue')
OUT.mkdir(parents=True, exist_ok=True)
KEY = 'azeroth-ab-setup-v5'
html = Path('preview/index.html').read_text(encoding='utf-8')
anchor = '  if (S.chars.length) showSelect(); else openCreate();'
assert html.count(anchor) == 1, 'Test instrumentation anchor must be unique'
hook = r'''
  window.__elwynnTest = {
    prepare: function(allowed, state) {
      const q=elwynnStoryQuest();
      if (!q) throw Error('Eagan quest missing from built game');
      S.hero.v57onboarding=true;
      (q.need||[]).forEach(k=>{S.hero.q[k]=3;});
      S.hero.q.tutorial57_team=allowed?3:0;
      S.hero.q[q.k]=state;
      S.hero.at=state===2?(q.e||q.d):q.t;
      S.hero.pos=spot(S.hero.at);
      S.qsel=q.k; S.qopen=true; S.hub=null;
      if(save()!==true) throw Error('Fixture save failed');
      renderMap();
    },
    take: function(){goTake('ef_eagan');},
    open: function(){S.qsel='ef_eagan'; S.hub=null; S.qopen=true; renderMap();},
    card: function(k){const d=document.createElement('div'); d.innerHTML=questStoryHtml(k, encOf(k).text); return d.innerText;},
    perform: function(){goDo('ef_eagan');},
    turn: function(){goTurn('ef_eagan');},
    switchIdentity: function(){S.hero=Object.assign({},S.hero,{id:'other-test-hero'});},
    state: function(){return qState('ef_eagan');},
    rewards: function(){return JSON.parse(JSON.stringify({money:S.money,xp:S.hero.hxp,stones:S.hero.tav?.st,items:S.hero.items}));}
  };
'''
html = html.replace(anchor, hook + anchor, 1)
hero = {'id':'eagan-browser','name':'Проверка','race':'human','cls':'warrior','level':1,'hxp':{'me':10000},'party':['me'],'specs':{'me':'prot'},'tav':{'st':0,'coll':{}},'q':{},'qprog':{},'zone':'elwynn','at':'abbey','v57onboarding':True,'v57migrated':True,'intro':{'elwynn':1},'items':{},'gear':{},'money':0}
saved = {'chars':[hero],'cur':hero['id'],'compAll':False,'allQ':False,'sound':False}
server = http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
threading.Thread(target=server.serve_forever,daemon=True).start()
url = 'http://127.0.0.1:' + str(server.server_port) + '/'
checks = []
def evaluate(page, expression):
    return page.evaluate('()=>{const t=window.__elwynnTest;'+expression+'}')
def dialog(page):
    return page.locator('#elwynn-story-dialog[open]')
def enter(page):
    page.locator('#sel-enter').click(timeout=30000)
    page.locator('#bnav [data-tab="map"]').wait_for(state='visible',timeout=30000)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        try:
            for name,width,height in [('desktop',1280,900),('mobile',390,844)]:
                context=browser.new_context(viewport={'width':width,'height':height})
                try:
                    page=context.new_page()
                    errors=[]
                    page.on('pageerror',lambda error:errors.append(str(error)))
                    page.route(url,lambda route:route.fulfill(status=200,content_type='text/html; charset=utf-8',body=html))
                    page.add_init_script('Math.random=()=>0.99;')
                    page.goto(url,wait_until='load',timeout=90000)
                    page.evaluate('(data)=>localStorage.setItem(data.key,data.value)',{'key':KEY,'value':json.dumps(saved,ensure_ascii=False)})
                    page.reload(wait_until='load')
                    enter(page)
                    # QUEST-07: no separate dialogue window; the quest card is the only presentation.
                    evaluate(page,'t.prepare(false,0);')
                    title=page.locator('#jd h3').inner_text() if page.locator('#jd h3').count() else ''
                    assert not ('Иган' in title and page.locator('#jd #q-take').count()), 'Onboarding must not offer Eagan: '+title
                    assert evaluate(page,'return t.state();')==0
                    evaluate(page,'t.prepare(true,0);')
                    story=page.locator('#jd .az-quest-story')
                    story.wait_for(timeout=15000)
                    assert 'Иган' in story.inner_text(), 'Eagan card shows the short retelling'
                    assert page.locator('#jd .az-quest-story + p').count()==0, 'PLAY-10: card shows only the retelling, not the old line'
                    assert story.evaluate('(p)=>{const r=p.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1;}'), 'Retelling must fit the viewport width'
                    page.screenshot(path=str(OUT/(name+'-card.png')),full_page=True)
                    page.locator('#jd #q-take').click()
                    page.wait_for_function('()=>window.__elwynnTest.state()===1',timeout=15000)
                    assert dialog(page).count()==0, 'Accepting must not open a dialogue window'
                    page.reload(wait_until='load')
                    enter(page)
                    assert evaluate(page,'return t.state();')==1, 'Accepted quest must survive reload'
                    before=evaluate(page,'return t.rewards();')
                    evaluate(page,'t.open();')
                    page.locator('#jd #q-go').click()
                    page.wait_for_function('()=>window.__elwynnTest.state()===3',timeout=20000)
                    assert dialog(page).count()==0, 'Completing must not open a dialogue window'
                    after=evaluate(page,'return t.rewards();')
                    assert after!=before, 'First hand-in must grant reward'
                    evaluate(page,'t.turn(); t.perform();')
                    page.wait_for_timeout(1500)
                    assert evaluate(page,'return t.rewards();')==after, 'Repeat calls must not duplicate rewards'
                    page.reload(wait_until='load')
                    enter(page)
                    assert evaluate(page,'return t.state();')==3, 'Completed quest must survive reload'
                    assert evaluate(page,'return t.rewards();')==after
                    stub=evaluate(page,"return t.card('ef_candles');")
                    assert 'Вильям Пест' in stub and 'Выполни цель' not in stub, 'Stub description is replaced by the retelling: '+stub
                    assert not errors, errors
                    checks.append({'viewport':name,'passed':['onboarding gate','card retelling','accept with card button','no dialogue window','acceptance persistence','complete with card button','single reward','completion persistence','stub text hidden','only the retelling (PLAY-10)']})
                finally:
                    context.close()
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
    (OUT/'results.json').write_text(json.dumps({'checks':checks,'scope':'QUEST-07 card pattern for the Eagan pilot: real built game, Chromium DOM/storage, synthetic saves, real card buttons plus test-only hooks for setup and repeat calls. Travel randomness fixed to avoid road ambushes. Not a full onboarding walkthrough, ambush test or physical-device test.'},ensure_ascii=False,indent=2),encoding='utf-8')
