"""PLAY-18 (owner 2026-11-27): Classic starter set per class. Real built game (preview/index.html), Chromium, isolated synthetic saves.
Checks: a new hero is created in the set; an old save without the flag gets the set once, into empty slots only (equipped quest gear stays);
the flag persists; an unequipped and sold starter item is not granted again after reload. Not covered: hero-mode key, physical devices."""
import functools, http.server, json, threading
from playwright.sync_api import sync_playwright

KEY = 'azeroth-ab-setup-v5'
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/index.html' % srv.server_port
MAGE = {'chest': 920041, 'legs': 920042, 'feet': 920043, 'mainhand': 920044}
WARRIOR = {'chest': 920001, 'legs': 920002, 'feet': 920003, 'mainhand': 920004}

def stored(pg):
    return pg.evaluate('(k)=>JSON.parse(localStorage.getItem(k))', KEY)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        c = b.new_context(viewport={'width': 390, 'height': 844}); pg = c.new_page(); errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.route('https://**/*', lambda r: r.abort())
        pg.goto(URL, wait_until='domcontentloaded', timeout=120000); pg.wait_for_function('!!window.Battle', timeout=120000)
        # 1. Old save: warrior with quest chest equipped, no flag.
        hero = {'id': 'kit-old', 'name': 'Старый', 'race': 'human', 'cls': 'warrior', 'level': 5, 'xpCurve': 2, 'hxp': {'me': 3000}, 'party': ['me'], 'specs': {'me': 'prot'},
                'items': {'910001': 1}, 'gear': {'chest': 910001}, 'money': 7, 'q': {}, 'zone': 'elwynn', 'at': 'goldshire', 'intro': {'elwynn': 1},
                'v57migrated': True, 'v57onboarding': False, 'tav': {'st': 0, 'coll': {}}}
        pg.evaluate('(d)=>localStorage.setItem(d.k,JSON.stringify({chars:[d.h],cur:d.h.id,sound:false,compAll:false}))', {'k': KEY, 'h': hero})
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_function('!!window.Battle', timeout=120000)
        pg.locator('#sel-enter').click(); pg.wait_for_function('(k)=>JSON.parse(localStorage.getItem(k)).chars[0].starterKit===1', arg=KEY, timeout=20000)
        h = stored(pg)['chars'][0]
        assert h['gear']['chest'] == 910001, 'equipped quest gear stays: %s' % h['gear']
        assert all(h['gear'][s] == WARRIOR[s] for s in ('legs', 'feet', 'mainhand')), h['gear']
        assert all(h['items'][str(i)] == 1 for i in WARRIOR.values()) and h['items']['910001'] == 1 and h['money'] == 7, h
        # 2. Unequip and drop the starter weapon; reload must not grant it again.
        pg.evaluate('(k)=>{const s=JSON.parse(localStorage.getItem(k));const h=s.chars[0];delete h.gear.mainhand;delete h.items["920004"];localStorage.setItem(k,JSON.stringify(s));}', KEY)
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_function('!!window.Battle', timeout=120000)
        pg.locator('#sel-enter').click(); pg.wait_for_timeout(1500)
        h = stored(pg)['chars'][0]
        assert 'mainhand' not in h['gear'] and '920004' not in h['items'] and h['starterKit'] == 1, h
        # 3. New mage hero is created in the set.
        pg.evaluate('(k)=>localStorage.removeItem(k)', KEY)
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_function('!!window.Battle', timeout=120000)
        pg.locator('#cr-go').click(); pg.locator('[data-crcls="mage"]').click(); pg.locator('#cr-go').click()
        pg.locator('#cr-name').fill('Новичок'); pg.locator('#cr-go').click()
        pg.wait_for_function('(k)=>{const s=JSON.parse(localStorage.getItem(k)||"null");return s&&s.chars&&s.chars.length===1}', arg=KEY, timeout=20000)
        h = stored(pg)['chars'][0]
        assert h['cls'] == 'mage' and h['starterKit'] == 1 and h['gear'] == {k: v for k, v in MAGE.items()}, h
        assert all(h['items'][str(i)] == 1 for i in MAGE.values()), h
        assert not errors, errors
        c.close(); b.close()
    print('Starter kit browser test passed: old save once into empty slots, flag persists, no re-grant, new hero in the set.')
finally:
    srv.shutdown(); srv.server_close()
