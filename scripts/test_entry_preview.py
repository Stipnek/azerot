import functools
import http.server
import json
import os
import threading
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('test-results/entry-screen')
OUT.mkdir(parents=True, exist_ok=True)
assert 'id="pa-entry"' not in Path('preview/index.html').read_text(encoding='utf-8')
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/entry.html'


def run(browser, label, options):
    out = OUT / label
    out.mkdir(exist_ok=True)
    context = browser.new_context(**options)
    context.tracing.start(screenshots=True, snapshots=True, sources=True)
    page = context.new_page()
    errors = []
    passed = False
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.route('https://**/*', lambda route: route.abort())
    expect.set_options(timeout=20000)
    root = page.locator('#pa-entry')
    try:
        page.goto(url, wait_until='domcontentloaded', timeout=90000)
        expect(root).to_have_attribute('data-state', 'ready')
        expect(page.locator('#pa-actions')).to_have_css('opacity', '1')
        expect(page.locator('#pa-enter')).not_to_be_focused()
        elapsed = root.evaluate('(e) => Number(e.dataset.readyAt)-Number(e.dataset.startedAt)')
        assert elapsed >= 999, elapsed
        assert page.locator('main').evaluate('(e) => e.inert')
        expected_width = 260 if options['viewport']['height'] > options['viewport']['width'] else 384
        page.wait_for_function('(width) => document.getElementById("pa-art").naturalWidth===width', arg=expected_width)
        assert page.locator('#pa-art').evaluate('(e) => e.decode().then(()=>true)')
        page.screenshot(path=str(out / 'entry.png'), full_page=True)
        page.keyboard.press('Tab')
        expect(page.locator('#pa-enter')).to_be_focused()
        expect(page.locator('#pa-enter')).to_have_css('outline-style', 'solid')
        page.screenshot(path=str(out / 'keyboard-focus.png'), full_page=True)
        page.mouse.click(5, 5)
        page.set_viewport_size({'width':900, 'height':430})
        page.wait_for_function('document.getElementById("pa-art").naturalWidth===384')
        for name in ['#pa-enter', '#pa-settings-open']:
            box = page.locator(name).bounding_box()
            assert box['height'] >= 44 and box['x'] >= 0 and box['y'] >= 0, box
            assert box['x']+box['width'] <= 901 and box['y']+box['height'] <= 431, box
        page.screenshot(path=str(out / 'landscape.png'), full_page=True)
        page.set_viewport_size(options['viewport'])
        ordinary = page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')")
        page.locator('#pa-settings-open').click()
        expect(page.locator('#pa-settings')).to_be_visible()
        expect(page.locator('#pa-settings #az-master-value')).to_have_css('color', 'rgb(244, 231, 202)')
        expect(page.locator('#pa-settings #az-status')).to_be_hidden()
        expect(page.locator('#pa-settings #az-time-status')).to_be_hidden()
        master = page.locator('#pa-settings #az-master')
        master.focus()
        master.press('Home')
        master.press('ArrowRight')
        expect(page.locator('#az-master-value')).to_have_text('1%')
        assert page.evaluate("JSON.parse(localStorage.getItem('azeroth-ab-audio-v2')).master") == 0.01
        assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')") == ordinary
        page.set_viewport_size({'width':750, 'height':342})
        page.locator('#pa-settings').evaluate('(e) => {e.scrollTop=e.scrollHeight;}')
        close = page.locator('#pa-settings-close')
        expect(close).to_be_in_viewport(ratio=1)
        assert close.evaluate('(e) => {const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'), 'Sticky close button is obscured'
        page.screenshot(path=str(out / 'settings-scrolled.png'), full_page=True)
        page.keyboard.press('Escape')
        expect(page.locator('#pa-settings')).not_to_be_visible()
        expect(page.locator('#w-more #az-settings')).to_have_count(1)
        page.set_viewport_size(options['viewport'])
        page.reload(wait_until='domcontentloaded')
        expect(root).to_have_attribute('data-state', 'ready')
        page.locator('#pa-settings-open').click()
        expect(page.locator('#pa-settings #az-master')).to_have_value('1')
        page.locator('#pa-settings-close').click()
        expect(page.locator('#w-more #az-settings')).to_have_count(1)
        ordinary = page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')")
        page.locator('#pa-enter').click()
        expect(root).to_be_hidden()
        expect(page.locator('#create:visible, #select:visible').first).to_be_visible()
        assert not page.locator('main').evaluate('(e) => e.inert')
        assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')") == ordinary
        assert not errors, errors
        page.screenshot(path=str(out / 'game.png'), full_page=True)
        passed = True
    except Exception:
        (out / 'failure.txt').write_text(traceback.format_exc(), encoding='utf-8')
        raise
    finally:
        (out / 'result.json').write_text(json.dumps({'passed':passed,'sourceCommit':os.environ.get('GITHUB_SHA'),'mode':label,'pageErrors':errors,'scope':'Separate source-build entry preview in Chromium; no publication, Safari, real-device or combat acceptance.'},ensure_ascii=False,indent=2),encoding='utf-8')
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
            run(browser, 'desktop', {'viewport':{'width':1280,'height':900}})
            run(browser, 'mobile', dict(p.devices['iPhone 13']))
            run(browser, 'tall-reduced', {'viewport':{'width':342,'height':750},'reduced_motion':'reduce'})
        finally:
            browser.close()
finally:
    server.shutdown()
    server.server_close()
