"""Issue 24 pilot: Raelen's wood gathering on the map, in the real built game (preview/index.html).
Synthetic saves; test-only hooks are injected into the served HTML, not into sources. Battles are ended through the
game's own toPrep() after forcing the result, so no combat balance is tested here."""
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

OUT = Path('test-results/elwynn-gather')
OUT.mkdir(parents=True, exist_ok=True)
KEY = 'azeroth-ab-setup-v5'
html = Path('preview/index.html').read_text(encoding='utf-8')
anchor = '  if (S.chars.length) showSelect(); else openCreate();'
assert html.count(anchor) == 1, 'Test instrumentation anchor must be unique'
hook = r'''
  window.__gatherTest = {
    prepare: function(state, have) {
      const q=QUESTS.find(x=>x.k==='ef_bundle');
      if (!q) throw Error('ef_bundle missing from built game');
      if (QUESTS.filter(x=>x.k==='ef_bundle').length!==1) throw Error('ef_bundle must be registered once');
      (q.need||[]).forEach(k=>{S.hero.q[k]=3;});
      S.hero.q[q.k]=state; S.hero.items=have?{'quest:ef_bundle:wood':have}:{}; S.hero.qprog={};
      S.hero.zone='elwynn'; S.hero.at='goldshire'; S.hero.pos=spot('goldshire'); S.qsel=q.k; S.qopen=false;
      if(save()!==true) throw Error('Fixture save failed');
      renderMap();
    },
    info: function(){const g=elwynnGatherState();return {state:qState('ef_bundle'),have:elwynnGatherHave(),nodes:elwynnGatherNodes(),pending:g.pending,mask:g.mask,at:S.hero.at,walking:!!S.walk,busy:!!S.gatherBusy,amb:!!S.amb,battle:!$('battle').hidden,count:QUESTS.filter(x=>x.k==='ef_bundle').length,text:B.ENCOUNTERS.ef_bundle.text};},
    saved: function(){const o=JSON.parse(localStorage.getItem('azeroth-ab-setup-v5'));const h=o.chars.find(c=>c.id===o.cur);return {q:h.q.ef_bundle||0,items:h.items||{},g:(h.qprog||{})['ef_bundle:gather']||null};},
    go: function(){goDo('ef_bundle');},
    turn: function(){goTurn('ef_bundle');},
    turnNow: function(){turnIn('ef_bundle');},
    click: function(i){elwynnGatherClick(i);},
    roll: function(v){window.__AZ_GATHER_ROLL=v;},
    endBattle: function(win){if(!st)throw Error('no battle');st.over=true;st.result=win?'win':'lose';toPrep();},
    breakSave: function(on){if(on){window.__realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota');};}else Storage.prototype.setItem=window.__realSet;},
    rewards: function(){return JSON.parse(JSON.stringify({money:S.money,xp:S.hero.hxp.me,stones:S.hero.tav?.st||0}));}
  };
'''
html = html.replace(anchor, hook + anchor, 1)
hero = {'id':'gather-browser','name':'Сборщик','race':'human','cls':'warrior','level':5,'xpCurve':2,'hxp':{'me':6000},'party':['me'],'specs':{'me':'prot'},'tav':{'st':0,'coll':{}},'q':{'tutorial57_team':3},'qprog':{},'zone':'elwynn','at':'goldshire','v57onboarding':False,'v57migrated':True,'intro':{'elwynn':1},'items':{},'gear':{},'money':0}
saved = {'chars':[hero],'cur':hero['id'],'compAll':False,'allQ':False,'sound':False}
server = http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
threading.Thread(target=server.serve_forever,daemon=True).start()
url = 'http://127.0.0.1:' + str(server.server_port) + '/'
checks = []
def T(page, expr):
    return page.evaluate('()=>{const t=window.__gatherTest;'+expr+'}')
def info(page):
    return T(page, 'return t.info();')
def enter(page):
    page.locator('#sel-enter').click(timeout=30000)
    page.locator('#bnav [data-tab="map"]').wait_for(state='visible', timeout=30000)
def settle(page):
    page.wait_for_function('()=>{const i=window.__gatherTest.info();return !i.walking&&!i.busy;}', timeout=20000)
def gather(page, i):
    T(page, 't.click(%d);' % i); settle(page)
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for name, width, height in [('desktop',1280,900),('mobile',390,844)]:
                context = browser.new_context(viewport={'width':width,'height':height})
                try:
                    page = context.new_page(); errors = []
                    page.on('pageerror', lambda e: errors.append(str(e)))
                    page.route(url, lambda route: route.fulfill(status=200, content_type='text/html; charset=utf-8', body=html))
                    page.add_init_script('Math.random=()=>0.99;')  # no road ambush; gather rolls set explicitly
                    page.goto(url, wait_until='load', timeout=90000)
                    page.evaluate('(d)=>localStorage.setItem(d.key,d.value)', {'key':KEY,'value':json.dumps(saved,ensure_ascii=False)})
                    page.reload(wait_until='load'); enter(page)
                    # 1. registry and blocking before acceptance
                    T(page, 't.prepare(0,0);')
                    i0 = info(page); assert i0['count'] == 1 and i0['nodes'] == [] and '4 связки' in i0['text'], i0
                    T(page, 't.click(0);'); assert info(page)['have'] == 0 and not info(page)['busy']
                    # 2. accept through the quest action (travel to Eastvale), nodes appear
                    T(page, 't.go();'); settle(page)
                    i1 = info(page); assert i1['state'] == 1 and i1['at'] == 'goldshire' or i1['state'] == 1, i1
                    T(page, 't.go();'); settle(page)
                    i1 = info(page); assert i1['at'] == 'eastvale' and len(i1['nodes']) == 4, i1
                    assert page.locator('#map [data-az-gather]').count() == 4
                    page.locator('#map').screenshot(path=str(OUT / (name + '-nodes.png')))
                    box = page.locator('#map').bounding_box()
                    for b in page.locator('#map [data-az-gather]').all():
                        r = b.bounding_box(); assert r and r['x'] >= box['x'] - 1 and r['x'] + r['width'] <= box['x'] + box['width'] + 1, (name, r, box)
                    # 3. success gives exactly one; a second node tapped meanwhile is ignored
                    first = i1['nodes'][0]
                    T(page, 't.click(%d); t.click(%d);' % (first, i1['nodes'][1]))
                    assert info(page)['have'] == 0, 'no item before the bar completes'
                    page.locator('.az-gather-bar').wait_for(state='attached')
                    page.wait_for_timeout(900); page.locator('#map').screenshot(path=str(OUT / (name + '-gathering.png')))
                    settle(page)
                    i2 = info(page); assert i2['have'] == 1 and first not in i2['nodes'] and len(i2['nodes']) == 3, i2
                    assert T(page, 'return t.saved();')['items'].get('quest:ef_bundle:wood') == 1
                    # 4. cancel gives nothing and keeps the node
                    n = i2['nodes'][0]
                    T(page, 't.click(%d); t.click(%d);' % (n, n)); settle(page)
                    i3 = info(page); assert i3['have'] == 1 and n in i3['nodes'], i3
                    # 5. attack interrupts: no item, pending saved, fight opens; reload keeps it and does not reroll
                    T(page, 't.roll(0); t.click(%d);' % n)
                    page.wait_for_function('()=>window.__gatherTest.info().battle', timeout=20000)
                    i4 = info(page); assert i4['have'] == 1 and i4['pending'] == n, i4
                    assert T(page, 'return t.saved();')['g'][1] == n + 1
                    page.reload(wait_until='load'); enter(page)
                    T(page, 't.roll(0.99);')
                    i5 = info(page); assert i5['pending'] == n and n in i5['nodes'], i5
                    assert page.locator('#map [data-az-gather="%d"].pend' % n).count() == 1
                    other = [x for x in i5['nodes'] if x != n][0]
                    T(page, 't.click(%d);' % other); assert not info(page)['busy'], 'other nodes wait for the pending fight'
                    T(page, 't.click(%d);' % n)
                    page.wait_for_function('()=>window.__gatherTest.info().battle', timeout=20000)
                    T(page, 't.endBattle(false);')
                    i6 = info(page); assert i6['pending'] == n and i6['have'] == 1, ('loss keeps the mandatory fight', i6)
                    T(page, 't.click(%d);' % n)
                    page.wait_for_function('()=>window.__gatherTest.info().battle', timeout=20000)
                    T(page, 't.endBattle(true);')
                    i7 = info(page); assert i7['pending'] == -1 and i7['have'] == 1 and n in i7['nodes'], ('win frees the node, no free item', i7)
                    # 6. save failure stops gathering without an item
                    T(page, 't.breakSave(true); t.click(%d);' % n); settle(page)
                    T(page, 't.breakSave(false);')
                    assert info(page)['have'] == 1, 'failed save must not count'
                    # 7. 3/4 cannot be handed in; 4/4 can, once, taking 4 bundles
                    gather(page, info(page)['nodes'][0]); gather(page, info(page)['nodes'][0])
                    i8 = info(page); assert i8['have'] == 3 and i8['state'] == 1, i8
                    before = T(page, 'return t.rewards();')
                    T(page, 't.turnNow();'); assert info(page)['state'] == 1 and T(page, 'return t.rewards();') == before
                    gather(page, info(page)['nodes'][0])
                    i9 = info(page); assert i9['have'] == 4 and i9['state'] == 2 and i9['nodes'] == [], i9
                    page.reload(wait_until='load'); enter(page)
                    assert info(page)['have'] == 4 and info(page)['state'] == 2, 'progress survives reload'
                    page.screenshot(path=str(OUT / (name + '-ready.png')))
                    T(page, 't.turn();'); settle(page)
                    page.wait_for_function('()=>window.__gatherTest.info().state===3', timeout=20000)
                    after = T(page, 'return t.rewards();')
                    assert info(page)['have'] == 0 and after != before, (info(page), before, after)
                    T(page, 't.turn(); t.turnNow();'); settle(page)
                    assert T(page, 'return t.rewards();') == after and info(page)['have'] == 0, 'no duplicate reward or deduction'
                    page.reload(wait_until='load'); enter(page)
                    assert info(page)['state'] == 3 and T(page, 'return t.saved();')['items'].get('quest:ef_bundle:wood') is None
                    assert not errors, errors
                    checks.append({'viewport': name, 'passed': ['single registry entry, 4 of 8', 'blocked before acceptance', 'travel then markers', 'one item per completed bar', 'parallel tap ignored', 'cancel gives nothing', 'attack interrupts without item', 'pending attack survives reload without reroll', 'loss keeps fight, win frees node without item', 'save failure counts nothing', '3/4 hand-in refused', '4/4 survives reload', 'hand-in takes 4 once', 'no duplicate reward']})
                finally:
                    context.close()
        finally:
            browser.close()
finally:
    server.shutdown(); server.server_close()
    (OUT / 'results.json').write_text(json.dumps({'checks': checks, 'scope': 'Built preview/index.html in Chromium with synthetic saves and injected test hooks; road ambush disabled via Math.random; fights ended through toPrep() with a forced result.'}, ensure_ascii=False, indent=2), encoding='utf-8')
print('Elwynn gather browser test passed:', json.dumps(checks, ensure_ascii=False))
