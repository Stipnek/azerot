"""Browser regression for the Arms talent dialog layout (PR #17).

Checks on the combined preview (remote HTTPS blocked, so talent icons fail to load):
the dialog covers the viewport and scrolls internally while the page does not;
Close, the points counter and the reset bar stay inside the viewport while the tree
is scrolled; no node is clipped horizontally; the hidden inspector takes no space
and the open inspector stays inside the viewport; failed icons get a placeholder
that keeps the locked state; purchase/refund/reset go through the existing handler
and persist after reload. Presentation only, not combat or real-device acceptance.
"""
import functools, http.server, json, os, sys, threading, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('test-results/arms-tree-layout')
KEY = 'azeroth-arms-hero-v1'
NORMAL = '{"chars":[],"sound":false,"marker":"KEEP_NORMAL_LAYOUT"}'
VIEWPORTS = {'desktop': {'width': 1280, 'height': 800}, 'mobile': {'width': 390, 'height': 844},
             'landscape': {'width': 750, 'height': 342}}
SEED = """({key, normal}) => {
  const hero={id:'layout-test',name:'Тест дерева',race:'human',cls:'warrior',level:15,
    hxp:{me:Battle.xpAt(15)},party:['me'],specs:{me:'arms',warrior:'arms'},armsTalents:{},
    items:{},gear:{},money:0,q:{},zone:'elwynn',at:'goldshire',
    intro:{elwynn:1},v57migrated:true,v57onboarding:false,tav:{st:0,coll:{}}};
  localStorage.setItem('azeroth-ab-setup-v5',normal);
  localStorage.setItem(key,JSON.stringify({chars:[hero],cur:hero.id,sound:false,compAll:false}));
}"""
GEOMETRY = """() => {
  const d=document.querySelector('#w-hero dialog[open]'), vw=innerWidth, vh=innerHeight;
  const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,h:b.height}};
  const inView=e=>{const b=e.getBoundingClientRect();return b.height>0&&b.top>=-1&&b.bottom<=vh+1&&b.left>=-1&&b.right<=vw+1};
  const panel=d.querySelector('[data-arms-panel]'), insp=panel.querySelector('[data-arms-inspector]');
  const nodes=[...panel.querySelectorAll('[data-arms-node]')];
  return {vw, vh, pageScrollable: document.scrollingElement.scrollHeight>vh+1 && getComputedStyle(document.body).overflow!=='hidden',
    pageScrollY: scrollY, dialog:r(d), dialogScroll:{top:d.scrollTop,height:d.scrollHeight,client:d.clientHeight},
    overflowY:getComputedStyle(d).overflowY,
    close:inView(d.querySelector(':scope>button.btn')), points:inView(insp.nextElementSibling),
    pointsText:insp.nextElementSibling.textContent.trim(),
    reset:inView(panel.querySelector('[data-arms-reset]')),
    inspectorHeight:insp.hidden?insp.getBoundingClientRect().height:null,
    clippedX:nodes.filter(n=>{const b=n.getBoundingClientRect();return b.left<-1||b.right>vw+1}).length,
    icons:nodes.filter(n=>!n.dataset.armsDelta).map(n=>({id:n.dataset.armsNode,icon:n.dataset.armsIcon||null,
      loaded:!!(n.querySelector('img')&&n.querySelector('img').naturalWidth)}))};
}"""
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
server.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=server.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{server.server_port}/combined.html'


def run(browser, label, viewport):
    out = OUT / label
    out.mkdir(parents=True, exist_ok=True)
    context = browser.new_context(viewport=viewport, has_touch=label != 'desktop')
    page = context.new_page()
    page.set_default_timeout(20000)
    expect.set_options(timeout=20000)
    errors, report, status = [], {}, 'failed'
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('https://**/*', lambda route: route.abort())
    page.route('**/favicon.ico', lambda route: route.fulfill(status=204, body=''))
    dialog = page.locator('#w-hero dialog[aria-label="Умения и особенности"]')
    node = lambda t: dialog.locator(f'[data-arms-node="{t}"]:not([data-arms-delta])')
    saved = lambda: page.evaluate('k => (JSON.parse(localStorage.getItem(k)).chars[0].armsTalents||{})', KEY)

    def open_tree():
        root = page.locator('#pa-entry')
        expect(root).to_have_attribute('data-state', 'ready')
        page.locator('#pa-enter').click()
        expect(root).to_be_hidden()
        page.locator('#sel-enter').click()
        page.locator('#bnav [data-tab="hero"]').click()
        page.locator('#w-hero').get_by_role('button', name='Умения и особенности', exact=True).click()
        expect(dialog).to_be_visible()

    try:
        page.goto(URL, wait_until='domcontentloaded', timeout=90000)
        page.wait_for_function('!!(window.Battle && Battle.armsIntegrated)')
        page.evaluate(SEED, {'key': KEY, 'normal': NORMAL})
        page.reload(wait_until='domcontentloaded')
        open_tree()
        page.wait_for_function("() => [...document.querySelectorAll('#w-hero [data-arms-node] img')].every(i => i.complete)")
        g = page.evaluate(GEOMETRY)
        report['open'] = g
        page.screenshot(path=str(out / 'open.png'))
        d = g['dialog']
        assert d['top'] <= 1 and d['left'] <= 1 and d['bottom'] >= g['vh'] - 1 and d['right'] >= g['vw'] - 1, d
        assert g['overflowY'] == 'auto', g['overflowY']
        assert g['close'] and g['points'], g
        assert g['inspectorHeight'] == 0, g['inspectorHeight']
        assert g['clippedX'] == 0, g['clippedX']
        # The talent panel comes first, right under Close (race passives follow it).
        assert dialog.evaluate("d => [...d.children].filter(c => getComputedStyle(c).order === '-1').some(c => c.querySelector('[data-arms-panel]'))")
        assert g['pointsText'].startswith('Уровень 15. Очки: 0 / '), g['pointsText']
        # Icons cannot load here (HTTPS blocked): every node must show a placeholder, locked ones dimmed.
        assert all(i['icon'] in ('missing', 'locked') and not i['loaded'] for i in g['icons']), g['icons']
        assert {i['id']: i['icon'] for i in g['icons']}['ihs'] == 'missing'
        assert sum(i['icon'] == 'locked' for i in g['icons']) > 0
        # Scroll to the last tree row: controls stay in view, the page itself does not move.
        page.mouse.move(viewport['width'] // 2, viewport['height'] // 2)
        page.mouse.wheel(0, 300)
        page.wait_for_timeout(300)
        dialog.locator('[data-arms-node]').last.scroll_into_view_if_needed()
        g2 = page.evaluate(GEOMETRY)
        report['scrolledEnd'] = g2
        page.screenshot(path=str(out / 'scrolled.png'))
        assert g2['pageScrollY'] == g['pageScrollY'], (g['pageScrollY'], g2['pageScrollY'])
        assert g2['close'] and g2['points'] and g2['reset'], g2
        assert g2['dialogScroll']['top'] > 0 or g2['dialogScroll']['height'] <= g2['dialogScroll']['client'], g2['dialogScroll']
        dialog.evaluate('d => { d.scrollTop = 0; }')
        # Preview: the name opens the description without spending points.
        dialog.locator('[data-arms-help="ihs"] summary').click()
        insp = dialog.locator('[data-arms-inspector]')
        expect(insp).to_be_visible()
        g3 = page.evaluate(GEOMETRY)
        ib = insp.bounding_box()
        report['inspector'] = {'box': ib, 'talents': saved()}
        page.screenshot(path=str(out / 'inspector.png'))
        assert ib['y'] >= 0 and ib['y'] + ib['height'] <= g3['vh'] + 1 and ib['x'] >= 0 and ib['x'] + ib['width'] <= g3['vw'] + 1, ib
        assert saved().get('ihs', 0) == 0
        assert g3['close'], g3
        insp.locator('[data-arms-inspector-close]').click()
        expect(insp).to_be_hidden()
        # Buy two ranks, refund one, through the existing handler.
        node('ihs').click(); expect(node('ihs')).to_contain_text('1/3')
        node('ihs').click(); expect(node('ihs')).to_contain_text('2/3')
        dialog.locator('[data-arms-node="ihs"][data-arms-delta="-1"]').click()
        expect(node('ihs')).to_contain_text('1/3')
        assert saved().get('ihs') == 1, saved()
        assert page.evaluate(GEOMETRY)['pointsText'].startswith('Уровень 15. Очки: 1 / ')
        # Locked dependent stays unbuyable.
        locked = [i['id'] for i in g['icons'] if i['icon'] == 'locked'][0]
        node(locked).click(force=True)
        assert saved().get(locked, 0) == 0, (locked, saved())
        page.screenshot(path=str(out / 'bought.png'))
        dialog.get_by_role('button', name='Закрыть', exact=True).click()
        expect(dialog).to_be_hidden()
        page.reload(wait_until='domcontentloaded')
        open_tree()
        expect(node('ihs')).to_contain_text('1/3')
        dialog.locator('[data-arms-reset]').click()
        expect(node('ihs')).to_contain_text('0/3')
        assert saved() == {}, saved()
        assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')") == NORMAL
        assert not errors, errors
        status = 'passed'
    except Exception:
        (out / 'failure.txt').write_text(traceback.format_exc(), encoding='utf-8')
        page.screenshot(path=str(out / 'failure.png'))
        raise
    finally:
        (out / 'result.json').write_text(json.dumps({'status': status, 'sourceCommit': os.environ.get('GITHUB_SHA'),
            'viewport': viewport, 'pageErrors': errors, 'report': report}, ensure_ascii=False, indent=2), encoding='utf-8')
        context.close()


try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        failed = []
        try:
            for label, vp in VIEWPORTS.items():
                try:
                    run(browser, label, vp)
                    print(label, 'passed')
                except Exception as e:
                    failed.append(label); print(label, 'FAILED', repr(e)[:400])
        finally:
            browser.close()
        sys.exit(1 if failed else 0)
finally:
    server.shutdown()
    server.server_close()
