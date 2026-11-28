"""Release gate «new player path» (owner 2026-11-28): every class from a fresh save in the exact release candidate preview/combined.html.
Per class: entry screen -> create -> enter the world -> «Первая тренировка» fight and turn-in -> free tavern companion -> add it to the party ->
«Первая совместная тренировка» -> two polygon fights -> hero tab (equipment, talents if any) -> party tab.
Checks: no page errors, every fight ends with a result, a caster with mana does not swing the staff, no spec badge on the main hero before 15,
no developer / broken strings on screen. Isolated synthetic saves (localStorage cleared per class); Chromium only, not physical-device
acceptance. Screenshots: test-results/new-player-path/<class>/. Run: python3 scripts/build_combined_preview.py first.
Usage: python3 scripts/test_new_player_path_browser.py [class ...]; without classes all eight run in NP_JOBS (default 4) processes."""
import functools, http.server, json, os, re, sys, threading, time
from pathlib import Path
from playwright.sync_api import sync_playwright

CLASSES = ['warrior', 'paladin', 'druid', 'hunter', 'rogue', 'priest', 'mage', 'warlock']
RACE = {'druid': 'nelf', 'hunter': 'dwarf'}
CASTERS = {'mage', 'priest', 'warlock', 'druid'}
OUT = Path('test-results/new-player-path')
STEP = {}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass
# Strings a player must never see. Each entry: (regex, reason).
BAD_TEXT = [
    (r'undefined|NaN|\[object |null\b', 'broken template value'),
    (r'\b99\d\b\s*х\.|ещё 99\d', 'whole-fight effect shown with a turn counter'),
    (r'«нет»', 'empty value shown as «нет»'),
    (r'не подключен|Временная схема|Адаптация автобоя|ИИ сохраняет|для разработчика|TODO|заглушк', 'developer wording'),
]
OBSERVER = """(() => { let value; window.__npBattles=[];
 Object.defineProperty(window,'Battle',{configurable:true,get(){return value;},set(api){ value=api;
  if(!api||typeof api.createBattle!=='function'||api.__npWrapped)return; api.__npWrapped=true; const original=api.createBattle;
  api.createBattle=function(opts){const s=original.apply(this,arguments); if(!(opts&&opts.preview))window.__npBattles.push(s); return s;};
 }});})();"""

srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory='preview'))
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = 'http://127.0.0.1:%d/combined.html' % srv.server_port
failures = []


def visible_text(pg):
    return pg.evaluate("document.body.innerText")


def check_text(pg, cls, where):
    text = visible_text(pg)
    for rx, why in BAD_TEXT:
        m = re.search(rx, text)
        if m:
            i = m.start()
            failures.append('%s / %s: %s: «%s»' % (cls, where, why, text[max(0, i - 50):i + 50].replace('\n', ' ')))


def no_spec_badge(pg, cls, where):
    """Before 15 the main hero has no specialization (PLAY-06, bug hunt 1.4): no spec face on its badges."""
    bad = pg.evaluate("""()=>[...document.querySelectorAll('[data-sel="me"] .az-badge[data-spec], #w-hero .az-badge[data-spec]')]
      .filter(e=>e.offsetParent&&e.querySelector('.az-spec-face')).map(e=>e.getAttribute('aria-label'))""")
    if bad:
        failures.append('%s / %s: spec badge before level 15: %s' % (cls, where, bad))


def fight(pg, cls, where):
    """Wait for the battle result, check it and the caster rule, return to the map."""
    STEP['now'] = where
    t0 = time.time()
    n = pg.evaluate('window.__npBattles.length')
    pg.locator('[data-speed="8"]').click()
    pg.locator('#back').wait_for(state='visible', timeout=45000)
    check_text(pg, cls, where + ' result')
    res = pg.evaluate("""()=>{const s=window.__npBattles[window.__npBattles.length-1];if(!s)return null;
      const h=s.heroes.find(x=>x.isMain);const lines=(s.log||[]).map(l=>l.text||'');
      return {over:s.over,result:s.result,staff:lines.filter(t=>/Удар посохом/.test(t)&&t.indexOf(h.name)===0).length,oom:!!(h.oomHit||h.oom),
              hasResult:lines.some(t=>/Победа|погиб|отступает/.test(t))};}""")
    if not res or not res['over'] or not res['hasResult']:
        failures.append('%s / %s: battle did not finish with a result: %s' % (cls, where, res))
    elif res['result'] != 'win':
        failures.append('%s / %s: lost the tutorial fight (%s)' % (cls, where, res['result']))
    lines = pg.evaluate("[...document.querySelectorAll('#log p')].map(p=>p.innerText)")
    if 'Победа!' in lines and any('» по ' in l for l in lines[lines.index('Победа!') + 1:]):
        failures.append('%s / %s: a hit is logged after «Победа!»: %s' % (cls, where, lines[-4:]))
    if cls in CASTERS and res and res['staff'] and not res['oom']:
        failures.append('%s / %s: caster swung the staff %d times without running out of mana' % (cls, where, res['staff']))
    pg.locator('#back').click(); pg.wait_for_timeout(400)
    if os.environ.get('NP_TIMING'):
        print('  %s %.1fs' % (where, time.time() - t0), flush=True)
    return res


def skip_travel(pg, cls='', where=''):
    """Map walks end by themselves within ~2 s. A walk can end in a random ambush (5%); after it the walk goes on and may start
    the quest battle it was heading to. Every battle met on the way is fought like any other."""
    for _ in range(4):
        for _ in range(30):
            if pg.locator('.wcap').count() == 0:
                break
            pg.wait_for_timeout(200)
        pg.wait_for_timeout(400)
        if not pg.locator('[data-speed="8"]').is_visible():
            return
        fight(pg, cls, where + ' (battle on the way)')


def open_polygon(pg, cls, where):
    """Walk to the polygon; a random ambush on the way is fought first."""
    for _ in range(5):
        if pg.locator('#poly-go').is_visible():
            return
        if pg.locator('[data-speed="8"]').is_visible():
            fight(pg, cls, where + ' (ambush)'); continue
        if pg.locator('#qclose').is_visible():
            pg.locator('#qclose').click()
        pg.locator('[data-poly]').first.click(); skip_travel(pg, cls, where)
        pg.wait_for_timeout(600)
    pg.locator('#poly-go').wait_for(state='visible', timeout=5000)


def quest(pg, qid, cls=''):
    for attempt in range(3):
        skip_travel(pg, cls, qid)
        if pg.locator('#qclose').is_visible():
            pg.locator('#qclose').click(); pg.wait_for_timeout(300)
        pg.locator('[data-q="%s"]' % qid).first.click()
        try:
            pg.locator('#qsheet').locator('#q-take, #q-fight, #q-turn, #q-go').first.wait_for(state='visible', timeout=5000)
            pg.wait_for_timeout(200)
            return
        except Exception:
            if attempt == 2:
                raise


def run(browser, cls):
    folder = OUT / cls; folder.mkdir(parents=True, exist_ok=True)
    c = browser.new_context(viewport={'width': 390, 'height': 844})
    try:
        return flow(c, cls, folder)
    except Exception:
        if c.pages:
            c.pages[0].screenshot(path=str(folder / 'failure.png'))
        raise
    finally:
        c.close()


def flow(c, cls, folder):
    c.add_init_script(OBSERVER)
    pg = c.new_page(); errors = []; external = set()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    def ext(route):
        external.add(route.request.url.split('/')[2]); route.abort()
    pg.route('https://**/*', ext)
    pg.goto(URL, wait_until='load', timeout=120000)
    pg.evaluate('localStorage.clear()'); pg.reload(wait_until='load')
    # create
    pg.locator('#pa-enter').click()
    pg.locator('[data-race="%s"]' % RACE.get(cls, 'human')).click(); pg.locator('#cr-go').click()
    pg.locator('[data-crcls="%s"]' % cls).click(); check_text(pg, cls, 'class preview'); pg.locator('#cr-go').click()
    pg.locator('#cr-name').fill('Новичок'); pg.locator('#cr-go').click()
    pg.locator('#sel-enter').click(); pg.locator('#bnav [data-tab="hero"]').wait_for(state='visible', timeout=30000)
    check_text(pg, cls, 'map')
    # first training
    STEP['now'] = 'first training quest'
    quest(pg, 'tutorial57_train'); pg.locator('#q-take').click(); pg.locator('#q-fight').click()
    fight(pg, cls, 'first training')
    pg.locator('#q-turn').click(); pg.wait_for_timeout(800)
    STEP['now'] = 'tavern'
    quest(pg, 'tutorial57_hire'); pg.locator('#q-go').click(); pg.locator('#tav-pull').click()
    pg.wait_for_timeout(3500); check_text(pg, cls, 'tavern'); pg.locator('#tavclose').click()
    pg.locator('#bnav [data-tab="party"]').click(); pg.wait_for_timeout(400)
    no_spec_badge(pg, cls, 'party tab'); check_text(pg, cls, 'party tab')
    pg.locator('[data-empty-slot="1"]').click(); pg.locator('[data-candidate]').first.click(); pg.wait_for_timeout(400)
    pg.screenshot(path=str(folder / 'party.png'))
    STEP['now'] = 'team training quest'
    pg.locator('#bnav [data-tab="map"]').click(); pg.wait_for_timeout(400)
    quest(pg, 'tutorial57_team')
    for b in ('#q-take', '#q-fight'):
        if pg.locator(b).count() and pg.locator(b).is_visible():
            pg.locator(b).click()
    fight(pg, cls, 'team training')
    if pg.locator('#q-turn').count() and pg.locator('#q-turn').is_visible():
        pg.locator('#q-turn').click(); pg.wait_for_timeout(800)
    # polygon (training dummy, 30 turns): result panel instead of the battle result
    # first world quests at level 1
    for qid in ('wolves', 'kobold_camp'):
        STEP['now'] = 'quest ' + qid
        done = False
        for n in range(8):
            quest(pg, qid, cls)
            if pg.locator('#q-turn').is_visible():
                pg.locator('#q-turn').click(); pg.wait_for_timeout(800); done = True; break
            if pg.locator('#q-fight').is_visible():
                pg.locator('#q-fight').click(); pg.wait_for_timeout(300); skip_travel(pg, cls, qid)
            elif pg.locator('#q-take').is_visible():
                pg.locator('#q-take').click(); pg.wait_for_timeout(300)
        if not done:
            pg.screenshot(path=str(folder / ('quest-' + qid + '.png')))
            failures.append('%s / %s: quest not completed within its fights' % (cls, qid))
    STEP['now'] = 'polygon'
    open_polygon(pg, cls, 'polygon walk')
    pg.locator('#poly-go').click()
    pg.locator('[data-speed="8"]').click()
    pg.get_by_text('Полигон: итоги').wait_for(state='visible', timeout=60000)
    check_text(pg, cls, 'polygon result'); pg.screenshot(path=str(folder / 'polygon.png'))
    pg.get_by_role('button', name='На карту').click(); pg.wait_for_timeout(500)
    STEP['now'] = 'hero tab'
    pg.locator('#bnav [data-tab="hero"]').click(); pg.wait_for_timeout(500)
    no_spec_badge(pg, cls, 'hero tab'); check_text(pg, cls, 'hero tab')
    broken = pg.evaluate("[...document.querySelectorAll('#w-hero img')].filter(i=>i.offsetParent&&i.complete&&!i.naturalWidth&&/^data:|^$/.test(i.getAttribute('src')||'')).length + document.querySelectorAll('#w-hero .az-icon-failed').length")
    if broken:
        failures.append('%s / hero tab: %d icons not drawn' % (cls, broken))
    pg.screenshot(path=str(folder / 'hero.png'), full_page=True)
    eq = pg.locator('#w-hero').get_by_role('button', name=re.compile('Экипировка'))
    if eq.count():
        eq.first.click(); pg.wait_for_timeout(500)
        txt = visible_text(pg)
        if 'Надето' not in txt:
            failures.append('%s / equipment: worn starter items not named' % cls)
        check_text(pg, cls, 'equipment'); pg.screenshot(path=str(folder / 'equipment.png'))
    else:
        failures.append('%s / hero tab: no equipment button' % cls)
    # level 15: the specialization arrives (PLAY-06 / spec15 transition); same save, level raised by a synthetic edit
    STEP['now'] = 'level 15'
    pg.evaluate('''()=>{for(const k of Object.keys(localStorage)){let v;try{v=JSON.parse(localStorage.getItem(k));}catch(e){continue;}
      if(!v||!v.chars||!v.chars[0])continue;const h=v.chars[0];h.level=15;h.hxp={...h.hxp,me:Battle.xpAt(15)};localStorage.setItem(k,JSON.stringify(v));}}''')
    pg.reload(wait_until='load'); pg.locator('#pa-enter').click(); pg.locator('#sel-enter').click(); pg.locator('#bnav [data-tab="hero"]').wait_for(state='visible', timeout=30000)
    skip_travel(pg, cls, 'level 15')
    pg.locator('#bnav [data-tab="hero"]').click(); pg.wait_for_timeout(500)
    check_text(pg, cls, 'hero tab 15'); pg.screenshot(path=str(folder / 'hero-15.png'), full_page=True)
    if pg.locator('#w-hero [data-spec-switch="hero"]').count() != 1:
        failures.append('%s / hero tab 15: no spec selector' % cls)
    tw = pg.locator('#w-hero [data-tw-launch]')
    if tw.count():
        tw.first.click(); pg.wait_for_timeout(800)
        bg = pg.evaluate("(()=>{const d=[...document.querySelectorAll('dialog[open], [role=dialog]')].filter(e=>e.offsetParent||e.open).pop();return d?getComputedStyle(d).backgroundColor:'none'})()")
        if bg in ('none', 'rgb(255, 255, 255)'):
            failures.append('%s / talent window: missing or unstyled (%s)' % (cls, bg))
        check_text(pg, cls, 'talent window'); pg.screenshot(path=str(folder / 'talents-15.png'))
        pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
    pg.locator('#bnav [data-tab="party"]').click(); pg.wait_for_timeout(400); check_text(pg, cls, 'party tab 15')
    pg.locator('#bnav [data-tab="map"]').click(); pg.wait_for_timeout(400)
    open_polygon(pg, cls, 'polygon walk 15')
    pg.locator('#poly-go').click(); pg.locator('[data-speed="8"]').click()
    pg.get_by_text('Полигон: итоги').wait_for(state='visible', timeout=60000)
    check_text(pg, cls, 'polygon 15'); pg.get_by_role('button', name='На карту').click()
    if errors:
        failures.append('%s: page errors %s' % (cls, errors))
    if 'wow.zamimg.com' in external:
        failures.append('%s: icons loaded from Wowhead at runtime (must be vendored, scripts/icon_assets.py)' % cls)
    hero = pg.evaluate("""()=>{for(const k of Object.keys(localStorage)){try{const v=JSON.parse(localStorage.getItem(k));if(v&&v.chars&&v.chars[0])return v.chars[0];}catch(e){}}return null}""")
    return {'class': cls, 'level': hero and hero.get('level'), 'party': hero and len(hero.get('party', [])), 'externalHosts': sorted(external)}


def parallel(jobs):
    """Release gate: split the classes over `jobs` processes (each its own browser and server) and merge the result."""
    import subprocess
    groups = [CLASSES[i::jobs] for i in range(jobs)]
    procs = [subprocess.Popen([sys.executable, __file__] + g, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True) for g in groups]
    ok = True
    for pr in procs:
        out, _ = pr.communicate()
        print(out, end='', flush=True)
        ok = ok and pr.returncode == 0
    srv.shutdown(); srv.server_close()
    sys.exit(0 if ok else 1)


want = sys.argv[1:] or CLASSES
if not sys.argv[1:] and int(os.environ.get('NP_JOBS', '4')) > 1:
    parallel(int(os.environ.get('NP_JOBS', '4')))
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        for cls in want:
            before = len(failures)
            try:
                info = run(b, cls)
            except Exception as e:
                failures.append('%s: flow broke at «%s»: %s' % (cls, STEP.get('now'), ' '.join(str(e).splitlines()[:6])))
                info = {'class': cls}
            print(json.dumps({**info, 'ok': len(failures) == before}, ensure_ascii=False), flush=True)
        b.close()
finally:
    srv.shutdown(); srv.server_close()
if failures:
    print('\n'.join(['NEW PLAYER PATH FAILED:'] + failures))
    sys.exit(1)
print('New player path passed for %d classes.' % len(want))
