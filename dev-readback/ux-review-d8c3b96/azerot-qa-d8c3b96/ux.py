from common import *
import sys, os, re, json
MODE=sys.argv[1]; OUT=f'shots2/{MODE}'; os.makedirs(OUT,exist_ok=True)
R=[]; logs=[]
def rec(n,ok,d=''): R.append({'scenario':n,'ok':ok,'detail':d}); print(('PASS' if ok is True else 'FAIL' if ok is False else 'INFO'),n,'::',d,flush=True)
s,url=serve()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME)
    c=b.new_context(viewport={'width':1280,'height':900}) if MODE=='desktop' else b.new_context(**p.devices['iPhone 13'])
    pg=c.new_page(); pg.set_default_timeout(15000)
    pg.on('pageerror',lambda e: logs.append('PAGEERROR '+str(e)))
    pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type=='error' else None)
    alerts=[]; pg.on('dialog',lambda d:(alerts.append(d.message),d.dismiss()))
    touch=MODE=='mobile'
    D='#w-hero dialog[aria-label="Умения и особенности"]'
    dlg=lambda: pg.locator(D)
    def tap(loc):
        loc.scroll_into_view_if_needed(); bb=loc.bounding_box(); x,y=bb['x']+bb['width']/2,bb['y']+bb['height']/2
        (pg.touchscreen.tap if touch else pg.mouse.click)(x,y); pg.wait_for_timeout(350)
    node=lambda n,m=False: pg.locator(f'{D} [data-arms-node="{n}"]'+('[data-arms-delta]' if m else ':not([data-arms-delta])'))
    help_=lambda n: pg.locator(f'{D} details[data-arms-help="{n}"]')
    status=lambda: pg.locator(f'{D} [data-arms-status]').inner_text().strip()
    def openset(): return pg.evaluate("D=>[...document.querySelector(D).querySelectorAll('details[data-arms-help][open]')].map(d=>d.dataset.armsHelp)",D)
    def stored(h): return pg.evaluate("([k,h])=>(JSON.parse(localStorage.getItem(k)).chars.find(c=>c.id===h)||{}).armsTalents||{}",[KEY,h])
    def pts(): return re.search(r'Очки: (\d+) / (\d+)',pg.locator(f'{D} [data-arms-panel]').inner_text()).groups()
    def enter(i):
        pg.locator(f'#sel-chars [data-char="{IDS[i]}"]').click(); pg.locator('#sel-enter').click()
        pg.locator('#bnav [data-tab="hero"]').click(); expect(pg.locator('#w-hero .hname')).to_have_text(NAMES[i])
    def openfeat():
        pg.locator('#w-hero').get_by_role('button',name='Умения и особенности',exact=True).click(); expect(dlg().locator('[data-arms-panel]')).to_be_visible()
    def leave():
        dlg().get_by_role('button',name='Закрыть',exact=True).click(); pg.locator('#bnav [data-tab="more"]').click(); pg.locator('#tosel').click(); expect(pg.locator('#select')).to_be_visible()
    def act(label,loc):
        loc.scroll_into_view_if_needed(); pg.wait_for_timeout(150)
        h=dlg().element_handle(); top=dlg().evaluate('d=>d.scrollTop'); before=openset()
        tap(loc)
        same=h.evaluate('d=>d.isConnected&&d.open'); vis=dlg().is_visible()
        top2=dlg().evaluate('d=>d.scrollTop'); after=openset()
        ok=same and vis and abs(top2-top)<=2 and after==before
        rec(label,ok,f'тот же диалог открыт={same}; scrollTop {top:.0f}→{top2:.0f}; раскрытые {before}→{after}; статус «{status()}»')
    try:
        pg.goto(url); pg.wait_for_function('!!(window.Battle&&Battle.armsIntegrated)',timeout=60000)
        pg.evaluate(SEED,{'key':KEY,'normal':NORMAL,'ids':IDS,'names':NAMES,'level':15}); pg.reload()
        enter(0); openfeat(); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/01-dialog-open.png')
        txt=dlg().inner_text()
        rec('A1 Старая заглушка «Ветка талантов появится позже» отсутствует','появится позже' not in txt,'')
        rec('A2 Отладочные фразы убраны',not re.search(r'валидатор|Тестовая интеграция|прототип',txt),re.findall(r'[^.\n]*(?:валидатор|Тестовая интеграция|прототип)[^.\n]*',txt)[:3])
        names=pg.evaluate("D=>[...document.querySelector(D).querySelectorAll('details[data-arms-help] summary')].map(s=>{const r=s.getBoundingClientRect();return [s.innerText.trim(),r.width>0&&r.height>0]})",D)
        rec('A3 Видимые названия под всеми узлами',all(v for _,v in names) and len(names)==17,f'{len(names)} названий; пример: {[n for n,_ in names[:4]]}')
        init=openset(); rec('A4 Начальное состояние описаний',init==[],f'раскрыты сразу при открытии: {init}')
        sizes=pg.evaluate("D=>[...document.querySelector(D).querySelectorAll('[data-arms-panel] button,[data-arms-panel] summary')].map(b=>{const r=b.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),b.innerText.trim().slice(0,14)]})",D)
        small=[x for x in sizes if x[0]<44 or x[1]<44]
        rec('A5 Кнопки и названия ≥ 44×44',not small,f'всего {len(sizes)}; меньше: {small[:6]}')
        # tap description
        tap(help_('deflection').locator('summary'))
        op=help_('deflection').evaluate('d=>d.open'); pv=help_('deflection').locator('p').is_visible() if op else False
        rec('A6 Описание открывается нажатием (Отражение)',op and pv,help_('deflection').locator('p').inner_text() if op else 'не открылось')
        # ihs summary tap
        was=help_('ihs').evaluate('d=>d.open'); tap(help_('ihs').locator('summary')); now=help_('ihs').evaluate('d=>d.open')
        rec('A7 Нажатие на «Улучшенный смертельный удар»',now is True,f'было open={was} → стало {now}')
        if not now: tap(help_('ihs').locator('summary'))
        pg.screenshot(path=f'{OUT}/02-descriptions-open.png')
        # scroll mid then actions
        dlg().evaluate('d=>d.scrollTop=Math.min(300,d.scrollHeight)')
        act('B1 Покупка: диалог, прокрутка и описания сохранены',node('ihs'))
        rec('B1a Ранг записан',stored(IDS[0])=={'ihs':1},f'{stored(IDS[0])}; очки {pts()}')
        pg.screenshot(path=f'{OUT}/03-after-buy.png')
        act('B2 Снятие «−»: всё сохранено',node('ihs',True))
        rec('B2a Ранг снят',stored(IDS[0])=={},f'{stored(IDS[0])}')
        for _ in range(2): tap(node('ihs'))
        act('B3 Сброс: всё сохранено',pg.locator(f'{D} [data-arms-reset]'))
        rec('B3a Очки сброшены',stored(IDS[0])=={} and pts()[0]=='0',f'{stored(IDS[0])}; подтверждение: {alerts or "нет"}')
        if not touch:
            tap(node('ihs')); h=dlg().element_handle(); top=dlg().evaluate('d=>d.scrollTop')
            node('ihs').scroll_into_view_if_needed(); bb=node('ihs').bounding_box(); pg.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2,button='right'); pg.wait_for_timeout(300)
            rec('B4 Снятие правым кликом',stored(IDS[0])=={} and h.evaluate('d=>d.isConnected&&d.open'),f'{stored(IDS[0])}')
        # refusals
        tap(node('impthunder')); r1=status(); rec('C1 Отказ: ряд 2 закрыт',stored(IDS[0])=={} and r1 not in('','Очки сохранены.'),f'«{r1}»')
        tap(node('ihs',True)); r2=status(); rec('C2 Отказ: снять ранг при 0',stored(IDS[0])=={} and r2 not in('','Очки сохранены.'),f'«{r2}»')
        tap(node('impcharge')); r3=status(); rec('C3 Отказ: недоступный узел',r3 not in('','Очки сохранены.'),f'«{r3}»')
        for n,k in [('ihs',3),('deflection',2),('impthunder',1)]:
            for _ in range(k): tap(node(n))
        tap(node('imprend')); r4=status(); rec('C4 Отказ: бюджет 6/6',sum(stored(IDS[0]).values())==6 and r4 not in('','Очки сохранены.'),f'«{r4}»; {stored(IDS[0])}')
        tap(node('ihs',True)); r5=status(); rec('C5 Отказ: снять ранг, на котором держится ряд 2',stored(IDS[0]).get('ihs')==3,f'«{r5}»')
        tap(node('ihs')); r6=status(); rec('C6 Отказ: максимум ранга',stored(IDS[0]).get('ihs')==3,f'«{r6}»')
        pg.screenshot(path=f'{OUT}/04-refusal.png')
        # readability: open several descriptions
        for n in ['imprend','impthunder','deepwounds','twohand','impale','sweeping']: 
            if not help_(n).evaluate('d=>d.open'): tap(help_(n).locator('summary'))
        geo=pg.evaluate("""D=>{const d=document.querySelector(D),g=d.querySelector('[data-arms-panel] div[style*="grid"]');const gr=g.getBoundingClientRect();
          const ps=[...d.querySelectorAll('details[open] p')].map(p=>{const r=p.getBoundingClientRect(),lh=parseFloat(getComputedStyle(p).lineHeight)||17;return {w:Math.round(r.width),lines:Math.round(r.height/lh),fs:getComputedStyle(p).fontSize}});
          const cells=[...g.children].map(x=>Math.round(x.getBoundingClientRect().width));
          return {vw:innerWidth,gridW:Math.round(gr.width),gridRight:Math.round(gr.right),dlgW:Math.round(d.clientWidth),cellW:[Math.min(...cells),Math.max(...cells)],descr:ps,docOverflowX:document.documentElement.scrollWidth>innerWidth,gridOverflow:g.scrollWidth>g.clientWidth+1,dlgScrollH:d.scrollHeight}}""",D)
        rec('D1 Читаемость описаний в 4-колоночном дереве','INFO',json.dumps(geo,ensure_ascii=False))
        dlg().evaluate("d=>{const e=d.querySelector('details[data-arms-help=deepwounds]');d.scrollTop+=e.getBoundingClientRect().top-d.getBoundingClientRect().top-80}"); pg.wait_for_timeout(200)
        pg.screenshot(path=f'{OUT}/05-readability.png')
        # two heroes
        for _ in range(1): pass
        a_before=stored(IDS[0]); leave(); enter(1); openfeat()
        rec('E1 Бета: свои 0 рангов',stored(IDS[1])=={} and node('ihs').inner_text().strip().endswith('0/3'),f'B {stored(IDS[1])}; A {stored(IDS[0])}')
        tap(node('deflection')); tap(node('deflection'))
        leave(); enter(0); openfeat()
        rec('E2 Возврат к Альфа без смешивания',stored(IDS[0])==a_before and stored(IDS[1])=={'deflection':2},f'A {stored(IDS[0])}; B {stored(IDS[1])}')
        pg.reload(); enter(0); openfeat(); a_ui=node('ihs').inner_text().strip()
        leave(); enter(1); openfeat(); b_ui=node('deflection').inner_text().strip()
        rec('E3 После перезагрузки (видно в UI)',a_ui.endswith('3/3') and b_ui.endswith('2/5'),f'A ihs «{a_ui[-3:]}», B Отражение «{b_ui[-3:]}»')
        pg.screenshot(path=f'{OUT}/06-B-after-reload.png')
        rec('E4 Обычное сохранение не изменено',pg.evaluate("localStorage.getItem('azeroth-ab-setup-v5')")==NORMAL,'')
    except Exception as e:
        import traceback; rec('ОШИБКА СЦЕНАРИЯ',False,traceback.format_exc()[-900:]); pg.screenshot(path=f'{OUT}/99-error.png')
    finally: b.close(); s.shutdown()
rec('F Ошибки JS',not [l for l in logs if 'PAGEERROR' in l],'; '.join(logs)[:300])
json.dump({'mode':MODE,'results':R,'console':logs},open(f'{OUT}/result.json','w'),ensure_ascii=False,indent=1)
