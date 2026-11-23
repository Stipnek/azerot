"""C1+C4 harness: natural start of one warrior in combined.html (ARMS_HERO_MODE).
Only real UI clicks; no dev toggles, no localStorage writes, no direct engine calls that grant anything.
Usage: (serve preview/ on :8765) python3 run_warrior.py [outdir] [max_iters]"""
import sys, os, json
from playwright.sync_api import sync_playwright
from lib import Log, dump, state
OUT=sys.argv[1] if len(sys.argv)>1 else 'out'; MAXI=int(sys.argv[2]) if len(sys.argv)>2 else 200
os.makedirs(OUT,exist_ok=True); log=Log(f'{OUT}/actions.jsonl')
FORBIDDEN=('lv-plus','lv-minus','tav-give','chk-allq','chk-allspecs','chk-amb','chk-test','chk-comp','chk-auto')
# priority: (selector, label). Quest flow first, then battle/modal continuation.
PRIO=['#q-turn','#q-fight','#q-party','#pick-ok','#q-go','#q-take','#skipbtn']
TEXTS=['Продолжить','Забрать','Готово','Далее','Закрыть','ОК','Ок','Понятно','В бой','Начать бой','Нанять']
def click(pg,sel,why):
    el=pg.locator(sel).first
    if el.count() and el.is_visible() and el.is_enabled():
        i=el.get_attribute('id') or ''
        assert i not in FORBIDDEN, i
        log('click',sel=sel,why=why,text=el.inner_text()[:60] if el.evaluate('e=>e.tagName')!='INPUT' else '')
        try: el.click(timeout=4000)
        except Exception as e: log('click_failed',sel=sel,err=str(e).splitlines()[-1][:200]); return False
        pg.wait_for_timeout(700); return True
    return False
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':900,'height':1000})
    errs=[]; pg.on('pageerror',lambda e:(errs.append(str(e)),log('pageerror',msg=str(e))))
    pg.goto('http://127.0.0.1:8765/combined.html')
    assert pg.evaluate('()=>Object.keys(localStorage).length')==0; log('clean_storage',ok=True)
    assert pg.evaluate('()=>window.__AZEROT_ARMS_HERO__===true'); log('arms_hero_mode',ok=True)
    pg.wait_for_selector('#pa-enter:not([disabled])',timeout=120000); click(pg,'#pa-enter','entry screen')
    for s,w in [('text=Человек','race'),('#cr-go','next'),('.cr48-class >> nth=0','class Воин'),('#cr-go','next')]:
        assert click(pg,s,w),s
    pg.fill('#cr-name','Тествоин'); log('fill',sel='#cr-name',value='Тествоин')
    click(pg,'#cr-go','create'); pg.wait_for_timeout(1000); click(pg,'#sel-enter','enter world'); pg.wait_for_timeout(2500)
    st0=state(pg); log('state',label='after_enter',state=st0)
    from engine_probe import probe
    log('ability_probe',level=1,**probe(pg,OUT,'L1')); pg.screenshot(path=f'{OUT}/00-enter.png')
    last=None; idle=0; lvl=1; shot=1
    for it in range(MAXI):
        st=state(pg); h=st['hero']
        sig=json.dumps([h['hxp']['me'],h['money'],h['q'],h['party'],h['at'],h['level']],ensure_ascii=False)
        if sig!=last: log('state',it=it,hero=h); last=sig; idle=0
        else: idle+=1
        from engine_probe import probe
        if h['level']>=2 and lvl<2:
            lvl=2; log('reached_level',level=2); log('ability_probe',level=2,**probe(pg,OUT,'L2')); pg.screenshot(path=f'{OUT}/lvl2.png'); break
        if idle>25: log('dead_end',reason='no state change for 25 iterations',buttons=dump(pg)); pg.screenshot(path=f'{OUT}/dead_end.png'); break
        # battle in progress? wait
        if pg.evaluate('()=>!!document.querySelector("#battle:not([hidden]), .battle.on")') and not pg.locator('#skipbtn').is_visible():
            pg.wait_for_timeout(1500)
        done=False
        if pg.locator('#back').first.is_visible():
            log('battle_end',text=pg.evaluate('()=>document.body.innerText.slice(-700)'))
            pg.screenshot(path=f'{OUT}/battle-{shot:02d}.png'); shot+=1
            done=click(pg,'#back','battle result -> map')
        if not done and pg.locator('#tavsheet').first.is_visible():
            log('tavern',text=pg.evaluate('()=>document.querySelector("#tavsheet").innerText.slice(0,900)'),buttons=pg.evaluate('()=>[...document.querySelectorAll("#tavsheet button")].filter(e=>e.offsetParent).map(e=>(e.id||"")+"|"+(e.disabled?"disabled":"on")+"|"+e.textContent.trim().slice(0,40))'))
            pg.screenshot(path=f'{OUT}/tavern-{shot:02d}.png'); shot+=1
            done=click(pg,'#tav-pull','tavern hire (normal pull, paid with earned currency)') or click(pg,'#tavsheet button.go','tavern confirm') or click(pg,'#tavclose','close tavern')
        if not done and pg.locator('.slot.empty').first.is_visible() and len(h['party'])<2 and len((h.get('tav') or {}).get('coll') or {})>0:
            done=click(pg,'.slot.empty','party: add hired companion to empty slot')
            if done:
                log('picker',buttons=dump(pg)); pg.screenshot(path=f'{OUT}/picker-{shot:02d}.png'); shot+=1
                done=click(pg,'.az573-comp','pick hired companion in picker'); log('after_pick',buttons=dump(pg)); done=True
        if not done and len(h['party'])>=2 and pg.locator('.slot.empty').first.is_visible():
            done=click(pg,'button.big:has-text("Карта")','back to map after party')
        for s in ([] if done else PRIO):
            if click(pg,s,'quest/battle flow'): done=True; break
        if not done and pg.locator('#qsheet').first.is_visible():
            qb=pg.evaluate('()=>[...document.querySelectorAll("#qsheet button, #qsheet [data-q]")].filter(e=>e.offsetParent).map(e=>(e.id||"")+"|"+String(e.className)+"|"+(e.dataset.q||"")+"|"+e.textContent.trim().replace(/\\s+/g," ").slice(0,60))')
            log('qsheet',items=qb,text=pg.evaluate('()=>document.querySelector("#qsheet").innerText.slice(0,600)'))
            done=click(pg,'#qsheet [data-q]:not(.done)','quest list: first quest') or click(pg,'#qclose','close quest sheet')
        if not done:
            for t in TEXTS:
                if click(pg,f'button:text-is("{t}")','modal continue'): done=True; break
        if not done and click(pg,'.qn.done, .qn.turn','quest marker (turn-in)'): done=True
        if not done and click(pg,'.jq:not(:has-text("!"))','journal: active quest'): done=True
        if not done and click(pg,'.jq','journal quest'): done=True
        if not done and click(pg,'.qn.avail','quest marker (available)'): done=True
        if not done:
            log('no_action',buttons=dump(pg)); pg.wait_for_timeout(1500)
            pg.screenshot(path=f'{OUT}/idle-{shot:02d}.png'); shot+=1
    open(f'{OUT}/final-localStorage.json','w',encoding='utf-8').write(pg.evaluate("()=>localStorage.getItem('azeroth-arms-hero-v1')") or 'null')
    log('final',state=state(pg),errors=errs); pg.screenshot(path=f'{OUT}/final.png')
