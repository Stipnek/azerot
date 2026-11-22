import functools
import http.server
import json
import os
import threading
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('test-results/arms-two-heroes')
OUT.mkdir(parents=True, exist_ok=True)
KEY = 'azeroth-arms-hero-v1'
NORMAL = '{"chars":[],"sound":false,"marker":"KEEP_NORMAL_SAVE_TWO_HEROES"}'
IDS = ['arms-isolation-a', 'arms-isolation-b']
NAMES = ['Альфа', 'Бета']
checks, errors = [], []
status = 'failed'
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/arms-hero.html'

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width':1280, 'height':900})
    context.tracing.start(screenshots=True, snapshots=True, sources=True)
    page = context.new_page()
    page.set_default_timeout(20000)
    expect.set_options(timeout=20000)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('https://**/*', lambda route: route.abort())
    page.route('**/favicon.ico', lambda route: route.fulfill(status=204, body=''))

    def features(index):
        dialog = page.locator('#w-hero dialog[aria-label="Умения и особенности"]')
        expect(dialog).to_have_count(1)
        if not dialog.is_visible():
            page.locator('#w-hero').get_by_role('button', name='Умения и особенности', exact=True).click()
        expect(dialog).to_be_visible()
        panel = dialog.locator(f'[data-arms-panel="{IDS[index]}"]')
        expect(panel).to_be_visible()
        return panel

    def enter(index, rank):
        card = page.locator(f'#sel-chars [data-char="{IDS[index]}"]')
        expect(card).to_be_visible()
        card.click()
        expect(page.locator(f'#sel-chars [data-char="{IDS[index]}"]')).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('#sel-enter')).to_be_enabled()
        page.locator('#sel-enter').click()
        page.locator('#bnav [data-tab="hero"]').click()
        expect(page.locator('#w-hero .hname')).to_have_text(NAMES[index])
        button = features(index).locator('[data-arms-node="ihs"]:not([data-arms-delta])')
        expect(button).to_have_count(1)
        expect(button).to_be_visible()
        expect(button).to_contain_text(f'{rank}/3')
        assert page.evaluate('(key) => JSON.parse(localStorage.getItem(key)).cur', KEY) == IDS[index]

    def leave(index):
        dialog = page.locator('#w-hero dialog[aria-label="Умения и особенности"]')
        expect(dialog).to_be_visible()
        dialog.get_by_role('button', name='Закрыть', exact=True).click()
        page.locator('#bnav [data-tab="more"]').click()
        page.locator('#tosel').click()
        expect(page.locator('#select')).to_be_visible()

    def verify(a, b):
        saved = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
        assert len(saved['chars']) == 2, saved
        ranks = {hero['id']:hero.get('armsTalents', {}).get('ihs', 0) for hero in saved['chars']}
        assert ranks == {IDS[0]:a, IDS[1]:b}, ranks
        assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')") == NORMAL

    def buy(index, rank):
        button = features(index).locator('[data-arms-node="ihs"]:not([data-arms-delta])')
        expect(button).to_contain_text(f'{rank-1}/3')
        expect(button).to_be_enabled()
        button.click()
        button = features(index).locator('[data-arms-node="ihs"]:not([data-arms-delta])')
        expect(button).to_be_visible()
        expect(button).to_contain_text(f'{rank}/3')

    try:
        page.goto(url, wait_until='domcontentloaded')
        page.wait_for_function('!!(window.Battle && Battle.armsIntegrated)')
        page.evaluate("""({key, normal, ids, names}) => {
            const chars = ids.map((id, index) => ({
                id, name:names[index], cls:'warrior', race:'human', level:15,
                hxp:{me:Battle.xpAt(15)}, specs:{me:'arms',warrior:'arms'}, party:['me'],
                armsTalents:{}, money:0, items:{}, gear:{}, tav:{st:0,coll:{}}, q:{},
                v57migrated:true, v57onboarding:false, intro:{elwynn:1},
                zone:'elwynn', at:'goldshire', pos:{x:44.7,y:45.8}
            }));
            localStorage.setItem('azeroth-ab-setup-v5', normal);
            localStorage.setItem(key, JSON.stringify({chars,cur:ids[0],enc:'hogger',sound:false,compAll:false,allSpecs:false}));
        }""", {'key':KEY, 'normal':NORMAL, 'ids':IDS, 'names':NAMES})
        page.reload(wait_until='domcontentloaded')
        enter(0, 0)
        verify(0, 0)
        buy(0, 1)
        verify(1, 0)
        checks.append('A bought rank 1; B remained rank 0')
        page.screenshot(path=str(OUT / 'a-rank-1.png'), full_page=True)
        leave(0)
        enter(1, 0)
        verify(1, 0)
        checks.append('Switched to B through character selection; B visibly remained rank 0')
        buy(1, 1)
        verify(1, 1)
        buy(1, 2)
        verify(1, 2)
        checks.append('B bought ranks 1 and 2; A remained rank 1')
        page.screenshot(path=str(OUT / 'b-rank-2.png'), full_page=True)
        leave(1)
        enter(0, 1)
        verify(1, 2)
        checks.append('Switched back to A; visible rank 1 and separate stored ranks confirmed')
        page.reload(wait_until='domcontentloaded')
        enter(0, 1)
        verify(1, 2)
        leave(0)
        enter(1, 2)
        verify(1, 2)
        checks.append('After first reload, A visibly remained rank 1 and B rank 2')
        page.reload(wait_until='domcontentloaded')
        enter(1, 2)
        verify(1, 2)
        leave(1)
        enter(0, 1)
        verify(1, 2)
        checks.append('After second reload, B visibly remained rank 2 and A rank 1')
        assert not errors, errors
        checks.append('Ordinary save unchanged throughout; no uncaught JavaScript exceptions')
        status = 'passed'
    except Exception:
        (OUT / 'failure.txt').write_text(traceback.format_exc(), encoding='utf-8')
        raise
    finally:
        (OUT / 'result.json').write_text(json.dumps({
            'status':status, 'sourceCommit':os.environ.get('SOURCE_COMMIT'),
            'checks':checks, 'pageErrors':errors,
            'scope':'Two desktop Arms heroes in one isolated save. Real UI purchases and switching, two reloads. Dialog may be reopened after purchase. No mobile, combat, dungeon or live acceptance.'
        }, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        try:
            page.screenshot(path=str(OUT / 'final.png'), full_page=True)
        finally:
            context.tracing.stop(path=str(OUT / 'trace.zip'))
            browser.close()
            server.shutdown()
print(json.dumps({'status':status, 'checks':checks}, ensure_ascii=False))
