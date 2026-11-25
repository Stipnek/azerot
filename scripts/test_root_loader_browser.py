import asyncio
import functools
import http.server
import json
import threading
from pathlib import Path
from playwright.async_api import async_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'results/root-loader'
OUT.mkdir(parents=True, exist_ok=True)
report = []

async def scenario(browser, name, viewport, muted=False, recovery=False):
    context = await browser.new_context(viewport=viewport)
    await context.tracing.start(screenshots=True, snapshots=True, sources=True)
    if muted:
        await context.add_init_script("localStorage.setItem('azeroth-ab-audio-v2', JSON.stringify({enabled:false,musicEnabled:false,master:1,music:0.3}));")
    await context.add_init_script("""if (window === window.top) {
      const NativeAudio = window.Audio;
      window.Audio = function(...args) {
        const audio = new NativeAudio(...args);
        window.__testBootAudio = audio;
        return audio;
      };
      window.Audio.prototype = NativeAudio.prototype;
    }""")
    page = await context.new_page()
    errors, console_errors, requests = [], [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: console_errors.append(m.text) if m.type == 'error' else None)
    page.on('request', lambda r: requests.append(r.url))
    gate = asyncio.Event()
    attempts = 0
    async def intercept(route):
        nonlocal attempts
        attempts += 1
        if recovery and attempts == 1:
            await route.abort('failed')
        else:
            await gate.wait()
            await route.continue_()
    await page.route('**/game-2.txt?*', intercept)
    result = {'scenario': name, 'passed': False, 'javascript_errors': errors, 'console_errors': console_errors}
    report.append(result)
    try:
        await page.goto('http://127.0.0.1:8765/', wait_until='domcontentloaded', timeout=90000)
        await expect(page.locator('#boot')).to_be_visible()
        if recovery:
            await expect(page.locator('#error')).to_be_visible(timeout=30000)
            await expect(page.locator('#retry')).to_be_visible()
            await expect(page.locator('#enter')).to_be_disabled()
            await page.screenshot(path=str(OUT / (name + '-error.png')))
            gate.set()
            await page.locator('#retry').click()
        else:
            await expect(page.locator('#enter')).to_be_disabled()
            await page.wait_for_function("document.querySelector('#boot img').naturalWidth > 0", timeout=60000)
            assert await page.evaluate("getComputedStyle(document.body).backgroundColor") != 'rgb(255, 255, 255)'
            await page.screenshot(path=str(OUT / (name + '-loading.png')))
            await page.wait_for_timeout(1500)
            await expect(page.locator('#enter')).to_be_disabled()
            if not muted:
                await page.wait_for_function("window.__testBootAudio && !!window.__testBootAudio.src", timeout=90000)
                await page.locator('h1').click()
                await page.wait_for_function("!window.__testBootAudio.paused && window.__testBootAudio.currentTime > 0.1", timeout=30000)
                result['music_on_loading_screen'] = True
            else:
                assert not any('/src/html-assets/' in url for url in requests)
                assert await page.evaluate('window.__testBootAudio.paused')
                result['saved_mute_respected'] = True
            gate.set()
        await expect(page.locator('#enter')).to_be_enabled(timeout=180000)
        await page.screenshot(path=str(OUT / (name + '-ready.png')))
        await page.locator('#enter').click()
        await expect(page.locator('#boot')).to_be_hidden()
        await expect(page.locator('iframe.live')).to_be_visible()
        game = page.frame_locator('iframe.live')
        await expect(game.locator('#create:visible, #select:visible, #world:visible').first).to_be_visible(timeout=30000)
        if not recovery and not muted:
            await page.wait_for_function("!document.querySelector('iframe').contentDocument.querySelector('#az-a0').paused", timeout=30000)
            result['music_after_enter'] = True
        if muted:
            assert await page.locator('iframe').evaluate("f => f.contentDocument.querySelector('#az-a0').paused")
        await page.screenshot(path=str(OUT / (name + '-game.png')))
        assert not errors, 'JavaScript errors: ' + repr(errors)
        result['passed'] = True
    except Exception as exc:
        result['failure'] = str(exc)
        try:
            await page.screenshot(path=str(OUT / (name + '-failure.png')))
        except Exception:
            pass
    finally:
        gate.set()
        await context.tracing.stop(path=str(OUT / (name + '-trace.zip')))
        await context.close()

async def main():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            try:
                await scenario(browser, 'landscape', {'width':844, 'height':390})
                await scenario(browser, 'portrait-muted', {'width':390, 'height':844}, muted=True)
                await scenario(browser, 'download-retry', {'width':844, 'height':390}, recovery=True)
            finally:
                await browser.close()
    finally:
        server.shutdown()
        server.server_close()
        (OUT / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    assert len(report) == 3 and all(r['passed'] for r in report), json.dumps(report, ensure_ascii=False)

if __name__ == '__main__':
    asyncio.run(main())
