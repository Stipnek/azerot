"""LOAD-01: root loader against the packaged site (scripts/package_site.py output), i.e. what Pages serves.
Run after scripts/build_combined_preview.py. Packages into test-results/root-loader/site, serves it locally and checks:
entry art and real progress while game-2 is held back, seamless hand-over to the game's own entry screen (one #pa-entry,
buttons only when ready), portrait art, and download failure -> retry. Audio is the game's entry screen's job (combined tests)."""
import asyncio, functools, http.server, json, os, shutil, subprocess, threading
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results/root-loader'
SITE = OUT / 'site'
report = []

def package():
    if SITE.exists():
        shutil.rmtree(SITE)
    OUT.mkdir(parents=True, exist_ok=True)
    commit = json.loads((ROOT / 'preview/combined-build.json').read_text(encoding='utf-8'))['sourceCommit']
    subprocess.run(['python3', str(ROOT / 'scripts/package_site.py'), '--out', str(SITE.relative_to(ROOT))], cwd=ROOT, check=True, env={**os.environ, 'SOURCE_COMMIT': commit})

async def scenario(browser, base, name, viewport, recovery=False):
    context = await browser.new_context(viewport=viewport)
    page = await context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    gate, attempts = asyncio.Event(), 0
    async def hold(route):
        nonlocal attempts
        attempts += 1
        if recovery and attempts == 1:
            await route.abort('failed'); return
        await gate.wait(); await route.continue_()
    await page.route('**/game-2.txt?*', hold)
    result = {'scenario': name, 'passed': False, 'errors': errors}
    report.append(result)
    try:
        await page.goto(base, wait_until='domcontentloaded', timeout=90000)
        await expect(page.locator('#pa-entry')).to_be_visible()
        if recovery:
            await expect(page.locator('#pa-failure')).to_be_visible(timeout=60000)
            await expect(page.locator('#pa-actions')).to_be_hidden()
            await page.screenshot(path=str(OUT / (name + '-error.png')))
            gate.set()
            await page.locator('#pa-retry').click()
        else:
            await page.wait_for_function("document.querySelector('#pa-art').naturalWidth > 0", timeout=60000)
            src = await page.locator('#pa-art').evaluate('i => i.currentSrc')
            assert ('portrait.png' if viewport['height'] > viewport['width'] else 'landscape.png') in src, src
            await page.wait_for_function("/\\d+%/.test(document.querySelector('#pa-loading p').textContent) && parseFloat(document.querySelector('.pa-progress span').style.width) >= 40", timeout=120000)
            pct = await page.locator('#pa-loading p').text_content()
            assert await page.locator('#pa-actions').is_hidden(), 'buttons must wait for the game'
            assert '100%' not in pct, pct
            result['progress_while_held'] = pct
            await page.screenshot(path=str(OUT / (name + '-loading.png')))
            gate.set()
        await expect(page.locator('#pa-entry')).to_have_attribute('data-state', 'ready', timeout=180000)
        assert await page.locator('#pa-entry').count() == 1, 'exactly one entry screen after hand-over'
        assert await page.evaluate('() => !!document.getElementById("az-clean-crest")'), 'game replaced the loader'
        assert await page.evaluate('() => typeof window.__AZEROT_RUNNING_BUILD__ === "string" && window.__AZEROT_RUNNING_BUILD__.length === 64'), 'running build id for soft update'
        await expect(page.locator('#pa-enter')).to_be_enabled()
        await page.screenshot(path=str(OUT / (name + '-ready.png')))
        await page.locator('#pa-enter').click()
        await expect(page.locator('#pa-entry')).to_be_hidden()
        await expect(page.locator('#create:visible, #select:visible, #world:visible').first).to_be_visible(timeout=30000)
        assert not errors, errors
        result['passed'] = True
    except Exception as exc:
        result['failure'] = str(exc)
        try: await page.screenshot(path=str(OUT / (name + '-failure.png')))
        except Exception: pass
    finally:
        gate.set(); await context.close()

async def main():
    package()
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(SITE)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = 'http://127.0.0.1:%d/' % server.server_port
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            try:
                await scenario(browser, base, 'landscape', {'width': 844, 'height': 390})
                await scenario(browser, base, 'portrait', {'width': 390, 'height': 844})
                await scenario(browser, base, 'download-retry', {'width': 844, 'height': 390}, recovery=True)
            finally:
                await browser.close()
    finally:
        server.shutdown(); server.server_close()
        (OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        shutil.rmtree(SITE, ignore_errors=True)
    assert len(report) == 3 and all(r['passed'] for r in report), json.dumps(report, ensure_ascii=False)
    print('Root loader browser test passed:', json.dumps([{k: r[k] for k in ('scenario', 'passed')} | ({'progress': r['progress_while_held']} if 'progress_while_held' in r else {}) for r in report], ensure_ascii=False))

if __name__ == '__main__':
    asyncio.run(main())
