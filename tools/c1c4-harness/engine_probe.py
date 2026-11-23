# Read-only UI probe of hero abilities: opens Отряд -> Умения, captures text, closes. No state mutation.
def probe(pg, out=None, tag=''):
    r={}
    try:
        for c in ['#qclose','#tavclose']:
            l=pg.locator(c).first
            if l.count() and l.is_visible(): l.click(timeout=3000); pg.wait_for_timeout(400)
        pg.locator('button:has-text("Отряд")').first.click(timeout=4000); pg.wait_for_timeout(600)
        pg.locator('button.btn:text-is("Умения")').first.click(timeout=4000); pg.wait_for_timeout(800)
        r['abilities_text']=pg.evaluate("()=>{const d=[...document.querySelectorAll('dialog[open],.az-sheet[open],.qsheet')].filter(e=>e.offsetParent||e.open).pop();return (d||document.body).innerText.slice(0,2500)}")
        if out: pg.screenshot(path=f'{out}/abilities-{tag}.png')
        for sel in ['dialog[open] button:text-is("Закрыть")','dialog[open] .qclose','button:text-is("Закрыть")']:
            l=pg.locator(sel).first
            if l.count() and l.is_visible(): l.click(timeout=3000); break
        else: pg.keyboard.press('Escape')
        pg.wait_for_timeout(400); pg.locator('button.big:has-text("Карта")').first.click(timeout=4000); pg.wait_for_timeout(600)
    except Exception as e: r['error']=str(e).splitlines()[0][:200]
    return r
