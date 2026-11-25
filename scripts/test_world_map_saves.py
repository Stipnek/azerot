import functools
import http.server
import json
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

KEY = 'azeroth-ab-setup-v5'
OUT = Path('test-results/world-map-saves')
OUT.mkdir(parents=True, exist_ok=True)
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=server.serve_forever, daemon=True).start()
results, errors = [], []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            page = browser.new_page(viewport={'width': 1280, 'height': 900})
            page.set_default_timeout(30000)
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.route('https://**/*', lambda route: route.abort())
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded')
            expect(page.locator('#create')).to_be_visible()
            page.locator('#cr48-races [data-race="human"]').click()
            page.locator('#cr-go').click()
            page.locator('[data-crcls="warrior"]').click()
            page.locator('#cr-go').click()
            page.locator('#cr-name').fill('Картограф')
            page.locator('#cr-go').click()
            expect(page.locator('#select')).to_be_visible()
            original = page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))', KEY)
            assert len(original['chars']) == 1, original
            original['chars'][0].setdefault('items', {})
            original['chars'][0].setdefault('gear', {})
            hero_id = original['chars'][0]['id']
            for zone, at, x, y in [('wetlands_route', 'wt_inn', 28, 28), ('tirisfal', 'tg_brill', 61, 52), ('westfall', 'lighthouse', 11, 31)]:
                for migrated in [False, True]:
                    label = zone + '-' + str(migrated).lower()
                    try:
                        page.evaluate('''({key, original, zone, at, x, y, migrated})=>{
                            const data = structuredClone(original), h = data.chars[0];
                            h.zone = zone; h.at = at; h.pos = {x, y};
                            h.intro = {[zone]: 1}; h.v57migrated = migrated;
                            h.v57onboarding = false; data.cur = h.id; data.sound = false;
                            localStorage.setItem(key, JSON.stringify(data));
                        }''', {'key': KEY, 'original': original, 'zone': zone, 'at': at, 'x': x, 'y': y, 'migrated': migrated})
                        page.reload(wait_until='domcontentloaded')
                        expect(page.locator('#select')).to_be_visible()
                        page.locator(f'#sel-chars [data-char="{hero_id}"]').click()
                        page.locator('#sel-enter').click()
                        page.locator('#bnav [data-tab="map"]').click()
                        expect(page.locator('#map')).to_be_visible()
                        expect(page.locator('#map')).to_have_attribute('data-zone', zone)
                        current = page.evaluate('(key)=>JSON.parse(localStorage.getItem(key)).chars[0]', KEY)
                        assert current['zone'] == zone, current
                        assert current['at'] == at, current
                        for field in ['id', 'money', 'items', 'gear', 'hxp']:
                            assert current.get(field) == original['chars'][0].get(field), (field, current)
                        assert not errors, errors
                        page.screenshot(path=str(OUT / (label + '.png')), full_page=True)
                        results.append({'case': label, 'status': 'passed', 'zone': current['zone'], 'at': current['at']})
                    except Exception:
                        page.screenshot(path=str(OUT / (label + '-failure.png')), full_page=True)
                        raise
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
    (OUT / 'result.json').write_text(json.dumps({'cases': results, 'pageErrors': errors, 'scope': 'Chromium desktop; ordinary production build; UI-created character and injected saved locations; both migration flag states. No physical-device or live acceptance. Does not verify that the lighthouse marker sits on the artwork.'}, ensure_ascii=False, indent=2), encoding='utf-8')
assert len(results) == 6, results
