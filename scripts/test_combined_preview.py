import functools
import http.server
import json
import os
import threading
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('test-results/combined-preview')
KEY = 'azeroth-arms-hero-v1'
NORMAL = '{"chars":[],"sound":false,"marker":"KEEP_NORMAL_COMBINED"}'
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/combined.html'


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

    def verify(rank):
        saved = page.evaluate('(key) => JSON.parse(localStorage.getItem(key))', KEY)
        hero = next(h for h in saved['chars'] if h['id'] == 'combined-test')
        assert hero['name'] == 'Общий тест'
        assert hero.get('armsTalents', {}).get('ihs', 0) == rank
        assert hero['items'] == {'910001': 1, '910002': 1}
        assert hero['level'] == 15
        assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')") == NORMAL

    def enter():
        root = page.locator('#pa-entry')
        expect(root).to_have_attribute('data-state', 'ready')
        expect(root).to_be_visible()
        page.locator('#pa-settings-open').click()
        expect(page.locator('#pa-settings')).to_be_visible()
        page.keyboard.press('Escape')
        expect(page.locator('#pa-settings')).not_to_be_visible()
        page.screenshot(path=str(out / 'entry.png'), full_page=True)
        page.locator('#pa-enter').click()
        expect(root).to_be_hidden()
        page.locator('#sel-enter').click()
        page.locator('#bnav [data-tab="hero"]').click()
        expect(page.locator('#w-hero .hname')).to_have_text('Общий тест')

    dialog = page.locator('#w-hero dialog[aria-label="Таланты и дополнительные сведения"]')
    talents = page.locator('dialog.az-talents')
    rank_button = talents.locator('[data-tw-node="ihs"]')
    def open_talents():
        page.locator('#w-hero [data-tw-launch] [data-tree-view]').click()
        expect(talents).to_be_visible()
    try:
        page.goto(URL, wait_until='domcontentloaded', timeout=90000)
        page.wait_for_function('!!(window.Battle && Battle.armsIntegrated)')
        assert page.evaluate('window.__AZEROT_ARMS_HERO__ === true')
        page.evaluate("""({key, normal}) => {
            const hero={id:'combined-test',name:'Общий тест',race:'human',cls:'warrior',level:15,
                xpCurve:2,hxp:{me:Battle.xpAt(15)},party:['me'],specs:{me:'arms',warrior:'arms'},armsTalents:{},
                items:{910001:1,910002:1},gear:{},money:0,q:{},zone:'elwynn',at:'goldshire',
                intro:{elwynn:1},v57migrated:true,v57onboarding:false,tav:{st:0,coll:{}}};
            localStorage.setItem('azeroth-ab-setup-v5',normal);
            localStorage.setItem(key,JSON.stringify({chars:[hero],cur:hero.id,sound:false,compAll:false}));
        }""", {'key': KEY, 'normal': NORMAL})
        page.reload(wait_until='domcontentloaded')
        enter()
        open_talents()
        expect(rank_button).to_contain_text('0/3')
        before_preview = page.evaluate('(key) => localStorage.getItem(key)', KEY)
        rank_button.click()
        inspector = talents.locator('.tw-info')
        expect(inspector).to_be_visible()
        expect(inspector.locator('h3')).to_have_text('Улучшенный смертельный удар')
        expect(rank_button).to_contain_text('0/3')
        verify(0)
        assert page.evaluate('(key) => localStorage.getItem(key)', KEY) == before_preview
        inspector.locator('[data-tw-add]').click()
        expect(rank_button).to_contain_text('1/3')
        verify(1)
        page.screenshot(path=str(out / 'talent.png'), full_page=True)
        talents.locator('.tw-bar [data-tw-close]').click()
        expect(talents).to_be_hidden()
        page.locator('#w-hero').get_by_role('button', name='Экипировка', exact=True).click()
        gear = page.locator('dialog.az-full-gear[open]')
        bag = gear.locator('.az573-bag .az573-cell:visible')
        expect(bag).to_have_count(2)
        expect(gear.locator('.az-slot-tabs button[aria-pressed="true"]')).to_have_count(0)
        feet = gear.locator('.az-slot-tabs button[data-slot="feet"]')
        feet.click()
        expect(bag).to_have_count(1)
        expect(bag).to_have_attribute('data-gear-slot', 'feet')
        expect(feet).to_have_attribute('aria-pressed', 'true')
        feet.click()
        expect(bag).to_have_count(2)
        expect(gear.locator('.az-slot-tabs button[aria-pressed="true"]')).to_have_count(0)
        page.screenshot(path=str(out / 'equipment.png'), full_page=True)
        verify(1)
        gear.get_by_role('button', name='Закрыть', exact=True).click()
        page.reload(wait_until='domcontentloaded')
        enter()
        open_talents()
        expect(rank_button).to_contain_text('1/3')
        verify(1)
        assert not errors, errors
        status = 'passed'
    except Exception:
        (out / 'failure.txt').write_text(traceback.format_exc(), encoding='utf-8')
        raise
    finally:
        (out / 'result.json').write_text(json.dumps({'status': status, 'sourceCommit': os.environ.get('GITHUB_SHA'),
            'viewport': viewport, 'pageErrors': errors,
            'scope': 'Combined opt-in entry/settings, Arms preview without writes, explicit purchase/reload and bag toggles in Chromium. Seeded isolated saves, remote HTTPS blocked. Not all-class skill, combat, reward-toast, real-save migration, real-device or live acceptance.'}, ensure_ascii=False, indent=2), encoding='utf-8')
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
            run(browser, 'mobile', {'width': 390, 'height': 844})
            run(browser, 'landscape', {'width': 750, 'height': 342})
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
