import functools
import http.server
import json
import os
import threading
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('test-results/equipment-browser')
KEY = 'azeroth-ab-setup-v5'
ITEMS = {'910001': 2, '910002': 1, '2954': 1}
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/index.html'


def run(browser, label, viewport):
    out = OUT / label
    out.mkdir(parents=True, exist_ok=True)
    context = browser.new_context(viewport=viewport)
    context.tracing.start(screenshots=True, snapshots=True, sources=True)
    page = context.new_page()
    page.set_default_timeout(20000)
    expect.set_options(timeout=20000)
    errors = []
    status = 'failed'
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('https://**/*', lambda route: route.abort())
    page.route('**/favicon.ico', lambda route: route.fulfill(status=204, body=''))
    dialog = page.locator('dialog.az-full-gear[open]')
    visible = dialog.locator('.az573-bag .az573-cell:visible')

    def slot(key):
        return dialog.locator(f'.az-slot-tabs button[data-slot="{key}"]')

    def saved():
        value = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
        return next(hero for hero in value['chars'] if hero['id'] == 'equipment-browser')

    def enter_and_open():
        page.locator('#sel-enter').click()
        page.locator('#bnav [data-tab="hero"]').click()
        page.locator('#w-hero').get_by_role('button', name='Экипировка', exact=True).click()
        expect(dialog).to_be_visible()

    def all_items():
        expect(dialog.locator('.az-slot-tabs button')).to_have_count(6)
        expect(dialog.locator('.az-slot-tabs button[data-slot="all"]')).to_have_count(0)
        expect(dialog.locator('.az-slot-tabs button[aria-pressed="true"]')).to_have_count(0)
        expect(visible).to_have_count(3)
        assert set(visible.evaluate_all('(nodes) => nodes.map(n => n.dataset.gearSlot)')) == {'chest', 'feet', 'legs'}

    def geometry():
        page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
        box = dialog.bounding_box()
        assert box and box['x'] >= -1 and box['y'] >= -1, box
        assert box['x'] + box['width'] <= viewport['width'] + 1, box
        assert box['y'] + box['height'] <= viewport['height'] + 1, box
        assert dialog.evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')
        scroll = dialog.locator('.az-gear-scroll')
        assert scroll.bounding_box()['height'] >= 64, 'Bag has no usable visible row'
        for button in dialog.locator('.az-slot-tabs button').all():
            expect(button).to_be_in_viewport(ratio=1)
            assert button.bounding_box()['height'] >= 43.9

    try:
        page.goto(URL, wait_until='domcontentloaded', timeout=90000)
        page.wait_for_function('!!window.Battle')
        page.evaluate("""({key, items}) => {
            const hero={id:'equipment-browser',name:'Проверка сумки',race:'human',cls:'warrior',level:20,
                xpCurve:2,hxp:{me:Battle.xpAt(20)},party:['me'],specs:{me:'prot'},items,gear:{chest:910001},
                money:123,q:{},zone:'elwynn',at:'goldshire',intro:{elwynn:1},starterKit:1,
                v57migrated:true,v57onboarding:false,tav:{st:0,coll:{}}};
            localStorage.setItem(key,JSON.stringify({chars:[hero],cur:hero.id,sound:false,compAll:false}));
        }""", {'key': KEY, 'items': ITEMS})
        page.reload(wait_until='domcontentloaded')
        enter_and_open()
        all_items()
        baseline = saved()
        # PLAY-05: one return control, no duplicate header «Закрыть»
        expect(dialog.get_by_role('button', name='Закрыть', exact=True)).to_have_count(0)
        expect(dialog.get_by_role('button', name='Назад к герою', exact=True)).to_have_count(1)
        geometry()
        page.screenshot(path=str(out / 'all-items.png'), full_page=True)
        slot('feet').click()
        expect(visible).to_have_count(1)
        expect(visible).to_have_attribute('data-gear-slot', 'feet')
        expect(slot('feet')).to_have_attribute('aria-pressed', 'true')
        expect(slot('feet')).to_have_css('outline-color', 'rgb(232, 189, 104)')
        expect(slot('feet')).to_have_css('background-color', 'rgb(73, 59, 36)')
        page.screenshot(path=str(out / 'feet-filter.png'), full_page=True)
        slot('feet').click()
        all_items()
        slot('chest').click()
        expect(visible).to_have_count(1)
        expect(visible).to_have_attribute('data-gear-slot', 'chest')
        slot('legs').click()
        expect(slot('chest')).to_have_attribute('aria-pressed', 'false')
        expect(slot('legs')).to_have_attribute('aria-pressed', 'true')
        expect(visible).to_have_attribute('data-gear-slot', 'legs')
        slot('head').click()
        expect(visible).to_have_count(0)
        expect(dialog.locator('.az-gear-footer')).to_contain_text('В этом слоте пока нет предметов.')
        slot('head').click()
        all_items()
        slot('feet').click()
        visible.click()
        action = dialog.locator('.az-gear-footer .az-equip-action')
        expect(action).to_be_enabled()
        action.click()
        page.wait_for_function('(key) => JSON.parse(localStorage.getItem(key)).chars[0].gear.feet === 910002', arg=KEY)
        expect(action).to_contain_text('Снять')
        action.click()
        page.wait_for_function('(key) => !JSON.parse(localStorage.getItem(key)).chars[0].gear.feet', arg=KEY)
        slot('feet').click()
        all_items()
        after = saved()
        assert after['items'] == baseline['items'] == ITEMS
        assert after.get('money', 0) == baseline.get('money', 0)
        assert after['gear'] == baseline['gear']
        slot('legs').click()
        dialog.get_by_role('button', name='Назад к герою', exact=True).click()
        page.locator('#w-hero').get_by_role('button', name='Экипировка', exact=True).click()
        all_items()
        geometry()
        dialog.get_by_role('button', name='Назад к герою', exact=True).click()
        page.reload(wait_until='domcontentloaded')
        enter_and_open()
        all_items()
        assert saved()['items'] == ITEMS
        assert saved()['gear'] == baseline['gear']
        assert not errors, errors
        status = 'passed'
    except Exception:
        (out / 'failure.txt').write_text(traceback.format_exc(), encoding='utf-8')
        raise
    finally:
        (out / 'result.json').write_text(json.dumps({'status': status, 'sourceCommit': os.environ.get('GITHUB_SHA'),
            'viewport': viewport, 'pageErrors': errors,
            'scope': 'Ordinary hero equipment UI in Chromium with seeded test saves and remote HTTPS blocked. Not reward-toast, dungeon-equipment, combined Arms/entry, production-save, real-device or live acceptance.'}, ensure_ascii=False, indent=2), encoding='utf-8')
        try:
            page.screenshot(path=str(out / 'final.png'), full_page=True)
        finally:
            try:
                context.tracing.stop(path=str(out / 'trace.zip'))
            finally:
                context.close()


try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            for label, viewport in [('narrow', {'width': 270, 'height': 600}), ('mobile', {'width': 390, 'height': 844}), ('landscape', {'width': 750, 'height': 342}), ('desktop', {'width': 1280, 'height': 900})]:
                run(browser, label, viewport)
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
