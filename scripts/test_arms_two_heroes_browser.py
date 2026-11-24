"""Preview-first editor, refusal messages and two-hero save isolation.
Chromium only; remote artwork blocked. No real-device or live acceptance.
"""
import functools, http.server, json, os, threading, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path('test-results/arms-two-heroes')
KEY = 'azeroth-arms-hero-v1'
NORMAL = '{"chars":[],"sound":false,"marker":"KEEP_NORMAL_SAVE_TWO_HEROES"}'
IDS = ['arms-isolation-a', 'arms-isolation-b']
NAMES = ['Альфа', 'Бета']
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/arms-hero.html'


def run(browser, label, options):
    out = ROOT / label
    out.mkdir(parents=True, exist_ok=True)
    context = browser.new_context(**options)
    context.tracing.start(screenshots=True, snapshots=True, sources=True)
    page = context.new_page()
    page.set_default_timeout(20000)
    expect.set_options(timeout=20000)
    errors, checks = [], []
    status = 'failed'
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('https://**/*', lambda route: route.abort())
    page.route('**/favicon.ico', lambda route: route.fulfill(status=204, body=''))
    dialog = page.locator('#w-hero dialog[aria-label="Умения и особенности"]')

    def panel(index):
        expect(dialog).to_be_visible()
        value = dialog.locator(f'[data-arms-panel="{IDS[index]}"]')
        expect(value).to_be_visible()
        return value

    def node(index, name):
        return panel(index).locator(f'[data-arms-node="{name}"]:not([data-arms-delta])')

    def inspector(index):
        return panel(index).locator('[data-arms-inspector]')

    def activate(target):
        if options.get('has_touch'):
            target.tap()
        else:
            target.click()

    def snapshot():
        return page.evaluate('(key) => localStorage.getItem(key)', KEY)

    def preview(index, name):
        card = inspector(index)
        if card.is_visible():
            activate(card.locator('[data-arms-inspector-close]'))
            expect(card).to_be_hidden()
        button = node(index, name)
        button.scroll_into_view_if_needed()
        before, rank = snapshot(), button.inner_text()
        activate(button)
        expect(card).to_be_visible()
        expect(panel(index).locator(f'[data-arms-help="{name}"]')).to_have_attribute('open', '')
        expect(button).to_have_text(rank)
        assert snapshot() == before, 'Preview changed the saved state'

    def action(index, name, minus=False):
        return inspector(index).locator(f'[data-arms-node="{name}"][data-arms-delta="{-1 if minus else 1}"]')

    def verify(a, b):
        saved = json.loads(snapshot())
        assert len(saved['chars']) == 2
        ranks = {h['id']: h.get('armsTalents', {}).get('ihs', 0) for h in saved['chars']}
        assert ranks == {IDS[0]: a, IDS[1]: b}, ranks
        assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')") == NORMAL

    def enter(index, rank):
        page.locator(f'#sel-chars [data-char="{IDS[index]}"]').click()
        expect(page.locator(f'#sel-chars [data-char="{IDS[index]}"]')).to_have_attribute('aria-pressed', 'true')
        page.locator('#sel-enter').click()
        page.locator('#bnav [data-tab="hero"]').click()
        expect(page.locator('#w-hero .hname')).to_have_text(NAMES[index])
        page.locator('#w-hero').get_by_role('button', name='Умения и особенности', exact=True).click()
        expect(node(index, 'ihs')).to_contain_text(f'{rank}/3')
        expect(panel(index).locator('details[data-arms-help][open]')).to_have_count(0)
        expect(inspector(index)).to_be_hidden()
        assert json.loads(snapshot())['cur'] == IDS[index]

    def leave():
        dialog.get_by_role('button', name='Закрыть', exact=True).click()
        page.locator('#bnav [data-tab="more"]').click()
        page.locator('#tosel').click()
        expect(page.locator('#select')).to_be_visible()

    def change(index, name, rank, maximum, minus=False):
        preview(index, name)
        button = action(index, name, minus)
        button.scroll_into_view_if_needed()
        original, top = dialog.element_handle(), dialog.evaluate('(d) => d.scrollTop')
        activate(button)
        assert original.evaluate('(d) => d.isConnected && d.open'), 'Original dialog was closed/replaced'
        expect(node(index, name)).to_contain_text(f'{rank}/{maximum}')
        assert abs(dialog.evaluate('(d) => d.scrollTop') - top) <= 2, 'Dialog scroll jumped on rank change'
        expect(panel(index).locator(f'[data-arms-help="{name}"]')).to_have_attribute('open', '')

    def positions(index):
        return panel(index).locator('[data-arms-node]').evaluate_all("""nodes => nodes.filter(n => !n.closest('[data-arms-inspector]')).map(n => {
            const r=n.getBoundingClientRect();
            return {key:n.dataset.armsNode+':'+(n.dataset.armsDelta||'preview'),rect:[r.x,r.y,r.width,r.height]};
        })""")

    def assert_stable(index, before):
        page.evaluate('() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
        after = positions(index)
        assert [x['key'] for x in before] == [x['key'] for x in after]
        shifted = [{'key': a['key'], 'before': a['rect'], 'after': b['rect']} for a, b in zip(before, after)
                   if max(abs(x-y) for x, y in zip(a['rect'], b['rect'])) > 1]
        assert not shifted, json.dumps({'gridShift': shifted}, ensure_ascii=False)

    def explain_refusal(index, name, message, minus=False):
        preview(index, name)
        button = action(index, name, minus)
        expect(button).to_have_attribute('aria-disabled', 'true')
        button.scroll_into_view_if_needed()
        before, saved = positions(index), snapshot()
        box = button.bounding_box()
        x, y = box['x']+box['width']/2, box['y']+box['height']/2
        if options.get('has_touch'):
            page.touchscreen.tap(x, y)
        else:
            page.mouse.click(x, y)
        notice = panel(index).locator('[data-arms-status]')
        expect(notice).to_contain_text(message)
        notice.scroll_into_view_if_needed()
        expect(notice).to_be_in_viewport(ratio=1)
        expect(inspector(index)).to_be_visible()
        assert snapshot() == saved, 'Refused action changed the saved state'
        assert_stable(index, before)

    def open_help(index):
        if inspector(index).is_visible():
            activate(inspector(index).locator('[data-arms-inspector-close]'))
        help_box = panel(index).locator('[data-arms-help="ihs"]')
        help_box.locator('summary').scroll_into_view_if_needed()
        before, saved = positions(index), snapshot()
        activate(help_box.locator('summary'))
        expect(help_box).to_have_attribute('open', '')
        expect(help_box.locator('p')).to_be_hidden()
        card = inspector(index)
        expect(card).to_be_visible()
        expect(card.locator('[data-arms-heading]')).to_have_text('Улучшенный смертельный удар')
        effect = card.locator('[data-arms-effect]')
        expect(effect).to_contain_text('1/2/3')
        effect.scroll_into_view_if_needed()
        expect(effect).to_be_in_viewport(ratio=1)
        content_width = panel(index).evaluate('(e) => e.clientWidth-parseFloat(getComputedStyle(e).paddingLeft)-parseFloat(getComputedStyle(e).paddingRight)')
        assert card.bounding_box()['width'] >= content_width-2
        assert effect.bounding_box()['width'] >= 240
        assert effect.evaluate('(e) => parseFloat(getComputedStyle(e).fontSize)') >= 14
        box, viewport = card.bounding_box(), page.viewport_size
        assert box['x'] >= -1 and box['y'] >= -1 and box['x']+box['width'] <= viewport['width']+1 and box['y']+box['height'] <= viewport['height']+1
        expect(dialog.get_by_role('button', name='Закрыть', exact=True)).to_be_in_viewport(ratio=1)
        assert snapshot() == saved
        assert_stable(index, before)

    try:
        page.goto(url, wait_until='domcontentloaded')
        page.wait_for_function('!!(window.Battle && Battle.armsIntegrated)')
        page.evaluate("""({key, normal, ids, names}) => {
            const chars=ids.map((id,i)=>({id,name:names[i],cls:'warrior',race:'human',level:15,
                hxp:{me:Battle.xpAt(15)},specs:{me:'arms',warrior:'arms'},party:['me'],armsTalents:{},
                money:0,items:{},gear:{},tav:{st:0,coll:{}},q:{},v57migrated:true,v57onboarding:false,
                intro:{elwynn:1},zone:'elwynn',at:'goldshire',pos:{x:44.7,y:45.8}}));
            localStorage.setItem('azeroth-ab-setup-v5',normal);
            localStorage.setItem(key,JSON.stringify({chars,cur:ids[0],enc:'hogger',sound:false,compAll:false,allSpecs:false}));
        }""", {'key': KEY, 'normal': NORMAL, 'ids': IDS, 'names': NAMES})
        page.reload(wait_until='domcontentloaded')
        enter(0, 0)
        assert panel(0).locator('details summary').all_inner_texts() == page.evaluate('Battle.armsIntegrated.TREE.map(n=>n.ru)')
        for text in ['Ветка талантов появится позже', 'Тестовая интеграция', 'Зависимости проверяются общим валидатором', 'Баланс прототипа не согласован', 'Левый клик']:
            expect(dialog).not_to_contain_text(text)
        expect(panel(0).locator('[data-arms-node="mortal"]')).to_have_count(0)
        for target in panel(0).locator('button:visible, summary:visible').all():
            box = target.bounding_box()
            assert box and box['width'] >= 43.9 and box['height'] >= 43.9, box
        assert panel(0).evaluate('(e)=>e.scrollWidth<=e.clientWidth')
        open_help(0)
        activate(inspector(0).locator('[data-arms-inspector-close]'))
        expect(inspector(0)).to_be_hidden()
        expect(panel(0).locator('details[data-arms-help][open]')).to_have_count(0)
        explain_refusal(0, 'sweeping', 'Ряд 5')
        open_help(0)
        verify(0, 0)
        change(0, 'ihs', 1, 3)
        verify(1, 0)
        page.screenshot(path=str(out/'a-rank-1.png'), full_page=True)
        leave()
        enter(1, 0)
        open_help(1)
        change(1, 'ihs', 1, 3)
        change(1, 'ihs', 2, 3)
        verify(1, 2)
        leave()
        enter(0, 1)
        verify(1, 2)
        for index, rank, other, other_rank in [(0, 1, 1, 2), (1, 2, 0, 1)]:
            if index == 1:
                leave()
                enter(index, rank)
            page.reload(wait_until='domcontentloaded')
            enter(index, rank)
            verify(1, 2)
            leave()
            enter(other, other_rank)
            verify(1, 2)
        checks.append('Two independent hero ranks persist across switching and two reloads')
        open_help(0)
        change(0, 'ihs', 0, 3, minus=True)
        for rank in [1, 2, 3]:
            change(0, 'ihs', rank, 3)
        explain_refusal(0, 'ihs', 'ранг')
        explain_refusal(0, 'impthunder', 'Ряд 2')
        explain_refusal(0, 'sweeping', 'Ряд 5')
        change(0, 'deflection', 1, 5)
        change(0, 'deflection', 2, 5)
        change(0, 'impthunder', 1, 3)
        explain_refusal(0, 'imprend', 'Все очки распределены')
        explain_refusal(0, 'ihs', 'Сначала снимите зависимые ранги', minus=True)
        change(0, 'impthunder', 0, 3, minus=True)
        preview(0, 'ihs')
        reset = panel(0).locator('[data-arms-reset]')
        reset.scroll_into_view_if_needed()
        original = dialog.element_handle()
        activate(reset)
        assert original.evaluate('(d)=>d.isConnected&&d.open')
        expect(node(0, 'ihs')).to_contain_text('0/3')
        expect(panel(0).locator('[data-arms-help="ihs"]')).to_have_attribute('open', '')
        verify(0, 2)
        checks.extend(['Preview and refused actions do not change saves',
                       'Explicit purchase/refund/reset preserve the native dialog; rank changes preserve scroll',
                       'Names, 44px targets, readable in-viewport inspector and Close verified',
                       'Summary opening and refusal messages do not shift grid controls; inspector actions excluded from grid geometry'])
        assert not errors, errors
        status = 'passed'
    except Exception:
        (out/'failure.txt').write_text(traceback.format_exc(), encoding='utf-8')
        raise
    finally:
        (out/'result.json').write_text(json.dumps({'status': status, 'sourceCommit': os.environ.get('SOURCE_COMMIT'),
            'mode': label, 'checks': checks, 'pageErrors': errors,
            'scope': 'Integrated preview-first editor and two-hero persistence in Chromium. Remote artwork blocked. No combat, real-device, Safari, dungeon or live acceptance.'}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
        try:
            page.screenshot(path=str(out/'final.png'), full_page=True)
        finally:
            context.tracing.stop(path=str(out/'trace.zip'))
            context.close()
    print(json.dumps({'mode': label, 'status': status, 'checks': checks}, ensure_ascii=False))


try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        try:
            run(browser, 'desktop', {'viewport': {'width': 1280, 'height': 900}})
            run(browser, 'mobile', dict(p.devices['iPhone 13']))
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
