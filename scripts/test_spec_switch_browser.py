"""TALENT-01 spec selector (owner 2026-11-27, mock-up A) in the built hero-mode game: one selector in the hero tab (talents button, points per spec)
and the party tab (spec only); switching is a 5-second cast with a bar, cancellable, saved after it ends; each spec keeps its own talent build.
Synthetic isolated save; Chromium only, not physical-device acceptance. Screenshots go to test-results/spec-switch/."""
import functools, http.server, json, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

html = Path('preview/arms-hero.html').read_text(encoding='utf-8')
out = Path('test-results/spec-switch'); out.mkdir(parents=True, exist_ok=True)
q = {k: 3 for k in ['tutorial57_train', 'tutorial57_hire', 'tutorial57_party', 'tutorial57_team']}
hero = {'id': 'ss-hero', 'name': 'Торвин', 'race': 'human', 'cls': 'warrior', 'level': 30, 'hxp': {'me': 2000000}, 'party': ['me'], 'specs': {'me': 'prot'},
        'tav': {'st': 0, 'coll': {}}, 'q': q, 'qprog': {}, 'zone': 'elwynn', 'at': 'goldshire', 'v57onboarding': True, 'v57migrated': True, 'intro': {'elwynn': 1},
        'items': {}, 'gear': {}, 'money': 0, 'xpCurve': 2, 'armsTalents': {'imprend': 3}, 'specTalents': {'prot': {'shieldspec': 5, 'impbloodrage': 2, 'toughness': 1}}}
KEY = 'azeroth-ab-setup-v5'
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = 'http://127.0.0.1:%d/' % srv.server_port
def stored(pg):
    vals = pg.evaluate("Object.keys(localStorage).map(k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}}).filter(v=>v&&Array.isArray(v.chars))")
    return [c for v in vals for c in v['chars'] if c['id'] == 'ss-hero']
def tab(pg, name):
    pg.locator('#bnav [data-tab="%s"]' % name).click(); pg.wait_for_timeout(400)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for name, w, h in [('phone', 390, 844), ('desktop', 1280, 800)]:
            c = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if name == 'phone' else 1); pg = c.new_page(); errors = []
            pg.on('pageerror', lambda e: errors.append(str(e)))
            pg.route(url, lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=html))
            pg.goto(url, wait_until='load', timeout=90000)
            pg.evaluate('(d)=>{localStorage.clear();localStorage.setItem(d.k,d.v)}', {'k': KEY, 'v': json.dumps({'chars': [hero], 'cur': 'ss-hero', 'compAll': False, 'sound': False}, ensure_ascii=False)})
            pg.reload(wait_until='load')
            pg.locator('#sel-enter').click(timeout=30000); pg.locator('#bnav [data-tab="hero"]').wait_for(state='visible', timeout=30000)
            tab(pg, 'hero')
            sel = pg.locator('#w-hero [data-spec-switch="hero"]')
            assert sel.count() == 1, 'one selector in the hero tab'
            assert pg.locator('#w-hero [data-tw-launch]').count() == 1, 'talents button inside the selector, no separate launcher'
            cards = sel.locator('[data-spec-pick]')
            assert cards.count() == 3 and sel.locator('[data-spec-pick="prot"]').get_attribute('aria-checked') == 'true'
            assert '8/21' in sel.locator('[data-spec-pick="prot"]').inner_text() and '3/21' in sel.locator('[data-spec-pick="arms"]').inner_text(), 'points per spec'
            assert 'Защита' in sel.locator('[data-tree-view]').inner_text()
            sel.scroll_into_view_if_needed(); sel.screenshot(path=str(out / (name + '-hero.png')))
            # pick, then cancel the cast
            sel.locator('[data-spec-pick="fury"]').click()
            go = pg.locator('#w-hero [data-spec-activate="fury"]'); assert go.count() == 1 and '5 с' in go.inner_text()
            assert stored(pg)[0]['specs']['me'] == 'prot', 'picking alone changes nothing'
            go.click()
            bar = pg.locator('#az-spec-cast'); bar.wait_for(state='visible')
            pg.wait_for_timeout(1500)
            assert pg.locator('#w-hero [data-spec-pick]').first.is_disabled(), 'cards locked during the cast'
            bar.screenshot(path=str(out / (name + '-cast.png')))
            bar.locator('[data-spec-cancel]').click(); pg.wait_for_timeout(300)
            assert pg.locator('#az-spec-cast').count() == 0 and all(x['specs']['me'] == 'prot' for x in stored(pg)), 'cancel keeps the spec'
            # full cast
            pg.locator('#w-hero [data-spec-pick="fury"]').click(); pg.locator('#w-hero [data-spec-activate="fury"]').click()
            t0 = time.time(); pg.locator('#az-spec-cast').wait_for(state='detached', timeout=9000); took = time.time() - t0
            assert 4.0 <= took <= 7.5, 'cast takes about 5 s: %.1f' % took
            assert any(x['specs']['me'] == 'fury' for x in stored(pg)), 'switch saved'
            sel = pg.locator('#w-hero [data-spec-switch="hero"]')
            assert sel.locator('[data-spec-pick="fury"]').get_attribute('aria-checked') == 'true' and '0/21' in sel.locator('[data-tree-view]').inner_text(), 'Fury build is its own'
            assert all(x.get('specTalents', {}).get('prot') == {'shieldspec': 5, 'impbloodrage': 2, 'toughness': 1} for x in stored(pg)), 'Protection build kept'
            # party tab: same selector without talents
            tab(pg, 'party')
            ps = pg.locator('[data-spec-switch="party"]')
            assert ps.count() == 1 and ps.locator('[data-tree-view]').count() == 0 and ps.locator('[data-spec-pick="fury"]').get_attribute('aria-checked') == 'true'
            assert '/21' not in ps.inner_text(), 'no talent points in the party tab'
            ps.scroll_into_view_if_needed(); ps.screenshot(path=str(out / (name + '-party.png')))
            ps.locator('[data-spec-pick="prot"]').click()
            pg.locator('[data-spec-switch="party"] [data-spec-activate="prot"]').click()
            pg.locator('#az-spec-cast').wait_for(state='detached', timeout=9000)
            assert any(x['specs']['me'] == 'prot' for x in stored(pg)), 'switch from the party tab'
            assert not errors, errors
            print('ok', name)
            c.close()
        b.close()
finally:
    srv.shutdown(); srv.server_close()
