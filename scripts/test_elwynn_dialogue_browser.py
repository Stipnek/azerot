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
      S.qsel=q.k; S.qopen=false;
      if(save()!==true) throw Error('Fixture save failed');
      renderMap();
    },
    take: function(){goTake('ef_eagan');},
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
                    evaluate(page,'t.prepare(false,0); t.take();')
                    assert dialog(page).count()==0, 'Onboarding must block taking Eagan quest'
                    assert evaluate(page,'return t.state();')==0
                    evaluate(page,'t.prepare(true,0); t.take();')
                    dialog(page).wait_for()
                    dialog(page).get_by_role('button',name='Закрыть',exact=True).click()
                    page.locator('#elwynn-story-dialog').wait_for(state='detached')
                    assert evaluate(page,'return t.state();')==0, 'Closing offer must not accept'
                    evaluate(page,'t.take();')
                    dialog(page).get_by_role('button',name='Принять',exact=True).click()
                    assert evaluate(page,'return t.state();')==1
                    page.reload(wait_until='load')
                    enter(page)
                    assert evaluate(page,'return t.state();')==1, 'Accepted quest must survive reload'
                    before=evaluate(page,'return t.rewards();')
                    evaluate(page,'t.perform();')
                    dialog(page).wait_for(timeout=15000)
                    assert evaluate(page,'return t.state();')==1, 'Travel must not hand in quest'
                    page.keyboard.press('Escape')
                    page.locator('#elwynn-story-dialog').wait_for(state='detached')
                    assert evaluate(page,'return t.state();')==1
                    assert evaluate(page,'return t.rewards();')==before, 'Closing completion must not grant rewards'
                    evaluate(page,'t.perform();')
                    dialog(page).wait_for(timeout=15000)
                    assert dialog(page).evaluate('(d)=>{const r=d.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;}'), 'Dialog must fit viewport'
                    page.screenshot(path=str(OUT/(name+'-completion.png')),full_page=True)
                    dialog(page).get_by_role('button',name='Завершить задание',exact=True).evaluate('(button)=>{button.click();button.click();}')
                    page.locator('#elwynn-story-dialog').wait_for(state='detached')
                    assert evaluate(page,'return t.state();')==3, 'Explicit completion must hand in quest'
                    after=evaluate(page,'return t.rewards();')
                    assert after!=before, 'First hand-in must grant reward'
                    evaluate(page,'t.turn(); t.perform();')
                    assert dialog(page).count()==0
                    assert evaluate(page,'return t.rewards();')==after, 'Repeat calls must not duplicate rewards'
                    page.reload(wait_until='load')
                    enter(page)
                    assert evaluate(page,'return t.state();')==3, 'Completed quest must survive reload'
                    assert evaluate(page,'return t.rewards();')==after
                    evaluate(page,'t.prepare(true,2); t.turn();')
                    dialog(page).wait_for(timeout=15000)
                    dialog(page).get_by_role('button',name='Закрыть',exact=True).click()
                    page.locator('#elwynn-story-dialog').wait_for(state='detached')
                    assert evaluate(page,'return t.state();')==2, 'Existing ready-to-turn state must remain ready after close'
                    evaluate(page,'t.prepare(true,0); t.take();')
                    dialog(page).wait_for()
                    stale_before=evaluate(page,'return t.rewards();')
                    evaluate(page,'t.switchIdentity();')
                    dialog(page).get_by_role('button',name='Принять',exact=True).click()
                    assert evaluate(page,'return t.state();')==0, 'Stale dialog must not act after hero identity changes'
                    assert evaluate(page,'return t.rewards();')==stale_before
                    assert not errors, errors
                    checks.append({'viewport':name,'passed':['onboarding gate','offer cancellation','acceptance persistence','real travel without auto hand-in','completion cancellation','viewport bounds','single reward despite double click','completion persistence','existing state 2','stale hero identity guard']})
                finally:
                    context.close()
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
    (OUT/'results.json').write_text(json.dumps({'checks':checks,'scope':'Real built game and Chromium DOM/storage with synthetic saves and test-only internal action hooks. Travel randomness fixed to avoid road ambushes. Not a full onboarding walkthrough, quest-list click-through, ambush test, physical-device test or collection implementation.'},ensure_ascii=False,indent=2),encoding='utf-8')
