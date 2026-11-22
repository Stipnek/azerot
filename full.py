from common import *
import sys, time, os
MODE=sys.argv[1]  # desktop|mobile
OUT=f'shots/{MODE}'; os.makedirs(OUT,exist_ok=True)
R=[]; logs=[]; reqfail=[]
def rec(name,ok,detail=''): R.append({'scenario':name,'ok':bool(ok),'detail':detail}); print(('PASS' if ok else 'FAIL'),name,'::',detail,flush=True)
s,url=serve()
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME)
    if MODE=='desktop': c=b.new_context(viewport={'width':1280,'height':900})
    else: c=b.new_context(**p.devices['iPhone 13'])
    pg=c.new_page(); pg.set_default_timeout(20000)
    pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}') if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: logs.append('PAGEERROR '+str(e)))
    pg.on('requestfailed',lambda r: reqfail.append(r.url[:120]))
    dialogs=[]; pg.on('dialog',lambda d:(dialogs.append(d.message),d.dismiss()))
    def shot(n): pg.screenshot(path=f'{OUT}/{n}.png')
    def dlg(): return pg.locator('#w-hero dialog[aria-label="Умения и особенности"]')
    def panel(): return dlg().locator('[data-arms-panel]')
    def open_feat():
        if not dlg().is_visible():
            pg.locator('#w-hero').get_by_role('button',name='Умения и особенности',exact=True).click()
        expect(panel()).to_be_visible()
    def plus(n): return pg.locator(f'#w-hero [data-arms-node="{n}"]:not([data-arms-delta])')
    def minus(n): return pg.locator(f'#w-hero [data-arms-node="{n}"][data-arms-delta]')
    def stored(hid):
        return pg.evaluate("([k,h])=>{const s=JSON.parse(localStorage.getItem(k));return (s.chars.find(c=>c.id===h)||{}).armsTalents||{}}",[KEY,hid])
    def cur(): return pg.evaluate("k=>JSON.parse(localStorage.getItem(k)).cur",KEY)
    def points(): import re; return re.search(r'Очки: (\d+) / (\d+)',panel().inner_text()).groups()
    def kit(): return panel().locator('ul li').all_inner_texts()
    def to_select():
        if dlg().is_visible(): dlg().get_by_role('button',name='Закрыть',exact=True).click()
        pg.locator('#bnav [data-tab="more"]').click(); pg.locator('#tosel').click(); expect(pg.locator('#select')).to_be_visible()
    def enter(i):
        pg.locator(f'#sel-chars [data-char="{IDS[i]}"]').click()
        pg.locator('#sel-enter').click()
        pg.locator('#bnav [data-tab="hero"]').click()
        expect(pg.locator('#w-hero .hname')).to_have_text(NAMES[i])
    try:
        pg.goto(url,wait_until='domcontentloaded'); pg.wait_for_function('!!(window.Battle&&Battle.armsIntegrated)',timeout=60000)
        TREE=pg.evaluate("Battle.armsProto.TREE.filter(n=>!Battle.armsProto.CONFIG.unavailable.includes(n.id)).map(n=>({id:n.id,ru:n.ru,tier:n.tier,max:n.max,req:n.req||null}))")
        UNAV=pg.evaluate("Battle.armsProto.CONFIG.unavailable"); print('TREE',TREE,'UNAV',UNAV,flush=True)
        pg.evaluate(SEED,{'key':KEY,'normal':NORMAL,'ids':IDS,'names':NAMES,'level':15})
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_timeout(1500)
        cards=pg.locator('#sel-chars [data-char]').count(); shot('01-select')
        rec('1 Вход: экран выбора с двумя тестовыми героями',cards==2,f'карточек: {cards}')
        enter(0); shot('02-hero')
        rec('2 Экран героя Альфа',True,pg.locator('#w-hero .hname').inner_text())
        pg.locator('#w-hero').get_by_role('button',name='Умения и особенности',exact=True).click()
        expect(panel()).to_be_visible(); shot('03-features')
        # geometry/readability
        geo=pg.evaluate("""()=>{const d=document.querySelector('#w-hero dialog[aria-label="Умения и особенности"]');const r=d.getBoundingClientRect();
          const bs=[...d.querySelectorAll('[data-arms-node],[data-arms-reset]')].map(b=>{const q=b.getBoundingClientRect();return [q.width,q.height]});
          const fs=[...d.querySelectorAll('p,li,button,.hint')].map(e=>parseFloat(getComputedStyle(e).fontSize));
          return {vw:innerWidth,vh:innerHeight,dlg:[r.left,r.top,r.width,r.height],scrollH:d.scrollHeight,clientH:d.clientHeight,overflowY:getComputedStyle(d).overflowY,
           docOverflowX:document.documentElement.scrollWidth>innerWidth,minBtn:[Math.min(...bs.map(x=>x[0])),Math.min(...bs.map(x=>x[1]))],small44:bs.filter(x=>x[0]<44||x[1]<44).length,nBtn:bs.length,minFont:Math.min(...fs),
           names:[...d.querySelectorAll('[data-arms-node]:not([data-arms-delta])')].filter(b=>/[А-я]{3}/.test(b.innerText)).length,
           stale:/Ветка талантов появится позже/.test(d.innerText)}}""")
        rec('3 Геометрия диалога',not geo['docOverflowX'],json.dumps(geo,ensure_ascii=False))
        # scroll to bottom of dialog
        pg.evaluate("""()=>{const d=document.querySelector('#w-hero dialog[aria-label="Умения и особенности"]');d.scrollTop=d.scrollHeight}""")
        pg.wait_for_timeout(300); shot('04-features-bottom')
        reset_vis=pg.locator('#w-hero [data-arms-reset]').is_visible()
        rec('4 Прокрутка диалога до «Сбросить очки» и списка умений',reset_vis,f'reset visible={reset_vis}')
        p0=points(); k0=kit()
        rec('5 Начальное состояние 15 ур.',p0==('0','6'),f'очки {p0}; умения {k0}')
        # purchase
        plus('ihs').click(); pg.wait_for_timeout(600)
        still=dlg().is_visible(); shot('05-after-purchase')
        rec('6 Диалог после покупки остаётся открытым',still,'открыт' if still else 'диалог закрылся после покупки — нужно открывать снова')
        open_feat()
        rec('7 Покупка ранга ihs → 1/3',plus('ihs').inner_text().strip().endswith('1/3') and stored(IDS[0])=={'ihs':1},f'{plus("ihs").inner_text().strip()}; storage {stored(IDS[0])}; очки {points()}')
        for i in range(2): plus('ihs').click(); open_feat()
        plus('ihs').click(force=True); open_feat()
        rec('8 Предел ранга 3/3 не превышается',stored(IDS[0]).get('ihs')==3,f"storage {stored(IDS[0])}")
        # locked tier2 node click
        t2=[n for n in TREE if n['tier']==2 and not n['req']][0]
        before=dict(stored(IDS[0])); plus(t2['id']).click(force=True); open_feat()
        rec('9 Ряд 2 при 3 очках в ряду 1 не покупается',stored(IDS[0])==before,f"{t2['ru']}: storage {stored(IDS[0])}; сообщение пользователю: нет (тихий отказ)" )
        # spend to budget: buy 3 more in another tier1 node
        t1=[n for n in TREE if n['tier']==1 and n['id']!='ihs' and n['max']>=2]
        for i in range(2): plus(t1[0]['id']).click(); open_feat()
        plus(t2['id']).click(); open_feat()
        st=stored(IDS[0]); rec('10 После 5 очков открывается ряд 2',st.get(t2['id'])==1,f'storage {st}; очки {points()}')
        extra=[n for n in TREE if n['tier']==1 and n['id'] not in st][0]
        plus(extra['id']).click(force=True); open_feat()
        rec('11 Бюджет 6/6 не превышается',sum(stored(IDS[0]).values())==6,f"storage {stored(IDS[0])}; очки {points()}")
        shot('06-full-budget')
        # remove prerequisite should be blocked
        before=dict(stored(IDS[0])); minus('ihs').click(force=True); open_feat()
        rec('12 Снятие ранга, нарушающего ряд 2, запрещено',stored(IDS[0])==before,f"storage {stored(IDS[0])}")
        minus(t2['id']).click(); open_feat()
        rec('13 Снятие ранга кнопкой «−»',t2['id'] not in stored(IDS[0]),f"storage {stored(IDS[0])}; очки {points()}")
        if MODE=='desktop':
            n=stored(IDS[0])['ihs']; plus('ihs').click(button='right',force=True); open_feat()
            rec('14 Снятие правым кликом',stored(IDS[0])['ihs']==n-1,f"storage {stored(IDS[0])}")
        else:
            rec('14 Снятие правым кликом',True,'не применимо на сенсорном экране; доступна кнопка «−»')
        # reset
        dlg().locator('[data-arms-reset]').click(); pg.wait_for_timeout(500)
        open_feat()
        rec('15 Сброс очков',stored(IDS[0])=={} and points()==('0','6'),f"storage {stored(IDS[0])}; подтверждение: {dialogs or 'нет'}")
        # final A build for switching: ihs 2
        plus('ihs').click(); open_feat(); plus('ihs').click(); open_feat()
        kitA=kit()
        to_select(); enter(1); open_feat()
        rec('16 Переключение на Бета: свои 0 рангов',stored(IDS[1])=={} and cur()==IDS[1] and plus('ihs').inner_text().strip().endswith('0/3'),f"B {stored(IDS[1])}, A {stored(IDS[0])}")
        plus(t1[0]['id']).click(); open_feat()
        to_select(); enter(0); open_feat()
        rec('17 Возврат к Альфа: ранги не смешались',stored(IDS[0])=={'ihs':2} and stored(IDS[1])=={t1[0]['id']:1} and plus('ihs').inner_text().strip().endswith('2/3'),f"A {stored(IDS[0])}, B {stored(IDS[1])}")
        pg.reload(wait_until='domcontentloaded'); pg.wait_for_timeout(1500)
        enter(0); open_feat(); okA=plus('ihs').inner_text().strip().endswith('2/3')
        to_select(); enter(1); open_feat(); okB=plus(t1[0]['id']).inner_text().strip().endswith('1/5')
        rec('18 Сохранность после перезагрузки (видимо в UI)',okA and okB,f"A 2/3={okA}, B {t1[0]['ru']} 1/5={okB}")
        shot('07-after-reload-B')
        # battle as A
        to_select(); enter(0); pg.locator('#bnav [data-tab="map"]').click()
        pg.locator('#jl [data-q="kobold_camp"]').click(); pg.locator('#q-take').click(); pg.locator('#q-fight').click()
        expect(pg.locator('#battle')).to_be_visible(); pg.wait_for_timeout(1500); shot('08-battle')
        navv=pg.locator('#bnav').is_visible()
        pg.locator('#battle button[data-speed="8"]').click()
        pg.wait_for_function("()=>/Победа|Поражение/.test(document.querySelector('#battle').innerText)",timeout=90000)
        pg.wait_for_timeout(800); shot('09-battle-end')
        txt=pg.locator('#battle').inner_text()
        import re
        used=sorted(set(re.findall(r'Альфа: «([^»]+)»',txt)))
        kitset=set(kitA)
        extra_sk=[u for u in used if u not in kitset and u not in('Удар оружием','В бой!','Вот это удар!')]
        rec('19 Обычный бой (задание «Зачистка лагеря кобольдов»)','Победа' in txt,f"навигация видна во время боя={navv}; умения в логе: {used}; в окне: {kitA}")
        rec('20 Бой использует только умения из окна',not extra_sk,f'лишние: {extra_sk}')
        # ordinary save
        rec('21 Обычное сохранение не изменено',pg.evaluate("localStorage.getItem('azeroth-ab-setup-v5')")==NORMAL,'')
    except Exception as e:
        import traceback; rec('ОШИБКА СЦЕНАРИЯ',False,traceback.format_exc()[-1500:]); shot('99-error')
    finally:
        b.close(); s.shutdown()
pe=[l for l in logs if 'PAGEERROR' in l]
rec('22 Нет необработанных ошибок JS',not pe,'; '.join(pe)[:500])
json.dump({'mode':MODE,'results':R,'console':logs,'requestfailed':reqfail[:20]},open(f'{OUT}/result.json','w'),ensure_ascii=False,indent=1)
print('CONSOLE',logs[:15]); print('REQFAIL',len(reqfail),reqfail[:5])
