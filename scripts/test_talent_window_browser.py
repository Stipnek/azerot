"""Classic talent window in the built hero-mode game: open from the hero tab, allocate, persist after reload, view-only trees,
fits the screen in portrait, landscape and desktop. Synthetic isolated save; not physical-device acceptance."""
import functools, http.server, json, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

html = Path('preview/arms-hero.html').read_text(encoding='utf-8')
q = {k: 3 for k in ['tutorial57_train', 'tutorial57_hire', 'tutorial57_party', 'tutorial57_team']}
hero = {'id': 'tw-hero', 'name': 'Проверка', 'race': 'human', 'cls': 'warrior', 'level': 25, 'hxp': {'me': 400000}, 'party': ['me'], 'specs': {'me': 'arms'},
        'tav': {'st': 0, 'coll': {}}, 'q': q, 'qprog': {}, 'zone': 'elwynn', 'at': 'goldshire', 'v57onboarding': True, 'v57migrated': True, 'intro': {'elwynn': 1},
        'items': {}, 'gear': {}, 'money': 0, 'xpCurve': 2, 'armsTalents': {'imprend': 3, 'deflection': 5, 'impthunder': 3, 'deepwounds': 3, 'ihs': 2}}
other = dict(hero, id='tw-other', name='Второй', armsTalents={'imprend': 1})
saved = {'chars': [hero, other], 'cur': hero['id'], 'compAll': False, 'allQ': False, 'sound': False}
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/' % srv.server_port
def enter(pg):
    pg.locator('#sel-enter').click(timeout=30000)
    pg.locator('#bnav [data-tab="hero"]').wait_for(state='visible', timeout=30000)
    pg.locator('#bnav [data-tab="hero"]').click(); pg.wait_for_timeout(500)
def rank(pg, node):
    return pg.locator('[data-tw-node="%s"] span' % node).inner_text()
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name, w, h in [('portrait', 390, 844), ('landscape', 844, 390), ('desktop', 1280, 800)]:
            c = b.new_context(viewport={'width': w, 'height': h}); pg = c.new_page(); errors = []
            pg.on('pageerror', lambda e: errors.append(str(e)))
            pg.route(url, lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html))
            pg.goto(url, wait_until='load', timeout=90000)
            pg.evaluate('(d)=>{localStorage.clear();localStorage.setItem(d.k,d.v)}', {'k': 'azeroth-ab-setup-v5', 'v': json.dumps(saved, ensure_ascii=False)})
            pg.reload(wait_until='load'); enter(pg)
            assert pg.locator('#w-hero [data-arms-panel]').count() == 0, 'old Arms panel is replaced by the launcher'
            pg.locator('#w-hero [data-tw-launch] [data-tree-view]').click()
            dlg = pg.locator('dialog.az-talents[open]'); dlg.wait_for()
            box = pg.locator('.tw-box').bounding_box()
            assert box['x'] >= 0 and box['y'] >= 0 and box['x'] + box['width'] <= w + 1 and box['y'] + box['height'] <= h + 1, 'frame fits the screen: %s' % box
            for sel in ['.tw-tabs', '.tw-bar', '.tw-x']:
                r = pg.locator(sel).first.bounding_box()
                assert r and r['x'] >= 0 and r['y'] >= 0 and r['x'] + r['width'] <= w + 1 and r['y'] + r['height'] <= h + 1, 'control on screen: %s %s' % (sel, r)
            geo = pg.evaluate("()=>{const f=document.querySelector('.tw-frame').getBoundingClientRect(),s=f.width/362,r=e=>{const b=document.querySelector(e).getBoundingClientRect();return [(b.left-f.left)/s,(b.top-f.top)/s,b.width/s,b.height/s]};return {foot:r('.tw-foot'),por:r('.tw-portrait'),badge:r('.tw-portrait .az-badge')}}")
            fx, fy, fw, fh = geo['foot']; assert abs(fx + fw / 2 - 140.5) < 2 and 411 <= fy and fy + fh <= 428, 'PLAY-08: spent line centred in the bottom bar: %s' % geo
            px, py, pw, ph = geo['badge']; assert abs(px + pw / 2 - 37) < 2 and abs(py + ph / 2 - 36) < 2 and pw >= 54, 'PLAY-08: portrait fills the frame circle: %s' % geo
            assert pg.locator('.tw-node').count() == 18 and rank(pg, 'tactical') == '0/5' and rank(pg, 'mortal') == '0/1', 'all seven rows; Mortal Strike is a talent (TALENT-03)'
            pg.locator('[data-tw-node="mortal"]').click()
            assert pg.locator('[data-tw-add]').get_attribute('aria-disabled') == 'true' and 'Нужно 18 очков' in pg.locator('.tw-info').inner_text(), 'tier 7 needs 18 points (3 per tier)'
            pg.locator('[data-tw-node="tactical"]').click(); pg.locator('[data-tw-add]').click()
            assert rank(pg, 'tactical') == '1/5', 'point added'
            pg.locator('[data-tw-node="axe"]').click()
            assert pg.locator('[data-tw-add]').get_attribute('aria-disabled') == 'true', 'unavailable talent cannot be learned'
            pg.locator('[data-tw-add]').dispatch_event('click'); assert rank(pg, 'axe') == '0/5', 'disabled button changes nothing'
            pg.locator('.tw-tabs [data-tw-tab="fury"]').click()
            assert pg.locator('.tw-title').inner_text() == 'Неистовство' and pg.locator('[data-tw-reset]').count() == 0, 'another spec: view only'
            pg.locator('[data-tw-node="cruelty"]').click()
            assert pg.locator('[data-tw-add]').count() == 0 and 'Неистовство' in pg.locator('.tw-info').inner_text(), 'other spec tree shows the effect, no allocation'
            pg.locator('.tw-tabs [data-tw-tab="prot"]').click()
            assert pg.locator('.tw-title').inner_text() == 'Защита' and pg.locator('[data-tw-node="shieldslam"]').count() == 1, 'Protection tab opens the Protection tree'
            pg.keyboard.press('Escape'); dlg.wait_for(state='hidden'); pg.wait_for_timeout(100)
            assert pg.evaluate("document.activeElement && document.activeElement.matches('[data-tree-view]')"), 'focus returns to the launcher'
            stored = pg.evaluate("Object.keys(localStorage).map(k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}).filter(v=>v&&Array.isArray(v.chars))")
            others = [c for v in stored for c in v['chars'] if c['id'] == 'tw-other']
            assert others and all(c.get('armsTalents') == {'imprend': 1} for c in others), 'second hero untouched: %s' % others
            pg.reload(wait_until='load'); enter(pg)
            pg.locator('#specbox [data-tree-view="arms"], #w-hero [data-tree-view="arms"]').first.click()
            pg.locator('dialog.az-talents[open]').wait_for()
            assert rank(pg, 'tactical') == '1/5', 'allocation persists after reload'
            pg.locator('[data-tw-reset]').click()
            assert rank(pg, 'imprend') == '0/3', 'reset clears ranks'
            assert not errors, errors
            print('ok', name)
            c.close()
        # TALENT-01: a Protection main allocates its own tree; the build is saved per spec and the Arms build is kept.
        prot = dict(hero, id='tw-prot', name='Щит', level=30, hxp={'me': 2000000}, specs={'me': 'prot'}, armsTalents={'imprend': 3})
        c = b.new_context(viewport={'width': 1280, 'height': 800}); pg = c.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.route(url, lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html))
        pg.goto(url, wait_until='load', timeout=90000)
        pg.evaluate('(d)=>{localStorage.clear();localStorage.setItem(d.k,d.v)}', {'k': 'azeroth-ab-setup-v5', 'v': json.dumps({'chars': [prot], 'cur': 'tw-prot', 'compAll': False, 'sound': False}, ensure_ascii=False)})
        pg.reload(wait_until='load'); enter(pg)
        pg.locator('#w-hero [data-tw-launch] [data-tree-view]').click(); pg.locator('dialog.az-talents[open]').wait_for()
        assert pg.locator('.tw-title').inner_text() == 'Защита', 'launcher opens the current spec tree'
        for _ in range(3):
            pg.locator('[data-tw-node="shieldspec"]').click(); pg.locator('[data-tw-add]').click()
        assert rank(pg, 'shieldspec') == '3/5'
        pg.locator('[data-tw-node="toughness"]').click(); pg.locator('[data-tw-add]').click()
        assert rank(pg, 'toughness') == '1/5', 'tier 2 opens after 3 points'
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        stored = pg.evaluate("Object.keys(localStorage).map(k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}).filter(v=>v&&Array.isArray(v.chars))")
        me = [x for v in stored for x in v['chars'] if x['id'] == 'tw-prot']
        assert any(x.get('specTalents') == {'prot': {'shieldspec': 3, 'toughness': 1}} and x.get('armsTalents') == {'imprend': 3} for x in me), 'per-spec save: %s' % me
        pg.reload(wait_until='load'); enter(pg)
        pg.locator('#w-hero [data-tw-launch] [data-tree-view]').click(); pg.locator('dialog.az-talents[open]').wait_for()
        assert rank(pg, 'shieldspec') == '3/5' and pg.locator('.tw-foot').inner_text() == 'Потрачено в ветке: 4 из 21', 'Protection build persists after reload'
        assert not errors, errors
        print('ok protection build'); c.close()
        b.close()
finally:
    srv.shutdown(); srv.server_close()
