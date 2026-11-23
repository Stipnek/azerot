"""Re-open the harness's OWN final save (from run_warrior.py) and read the hero's ability panel. Read-only; not a grant:
the save was produced by the natural run. Usage: python3 probe_saved.py out9"""
import sys
from playwright.sync_api import sync_playwright
OUT=sys.argv[1]; save=open(f'{OUT}/final-localStorage.json',encoding='utf-8').read()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':900,'height':1000})
    pg.add_init_script("if(!sessionStorage.__l){localStorage.setItem('azeroth-arms-hero-v1',%r);sessionStorage.__l=1}"%save)
    pg.goto('http://127.0.0.1:8765/combined.html'); pg.wait_for_selector('#pa-enter:not([disabled])',timeout=120000); pg.click('#pa-enter'); pg.wait_for_timeout(800)
    pg.click('#sel-enter'); pg.wait_for_timeout(2500)
    for c in ['#qclose','#tavclose']:
        if pg.locator(c).first.is_visible(): pg.click(c)
    pg.locator('button:has-text("Отряд")').first.click(); pg.wait_for_timeout(600)
    pg.locator('.slot.mine').first.click(); pg.wait_for_timeout(600)
    pg.locator('button.btn:text-is("Умения")').first.click(); pg.wait_for_timeout(800)
    t=pg.evaluate("()=>document.body.innerText"); i=t.find('Учебный набор'); print(t[max(0,i-200):i+1300])
    pg.screenshot(path=f'{OUT}/abilities-L2-hero.png')
