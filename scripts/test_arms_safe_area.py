"""Safe-area geometry on the actual combined candidate, not live acceptance."""
import functools, http.server, json, threading, traceback
from itertools import combinations
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path('test-results/arms-safe-area')
KEY='azeroth-arms-hero-v1'
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
threading.Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/combined.html'
VIEWPORTS={'desktop':{'width':1280,'height':900},'mobile':{'width':390,'height':844},'landscape':{'width':750,'height':342}}

def run(browser,label,viewport):
    out=OUT/label;out.mkdir(parents=True,exist_ok=True)
    context=browser.new_context(viewport=viewport,has_touch=label!='desktop')
    context.tracing.start(screenshots=True,snapshots=True,sources=True)
    page=context.new_page();page.set_default_timeout(20000);expect.set_options(timeout=20000)
    errors=[];report=[];status='failed'
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('https://**/*',lambda route:route.abort())
    dialog=page.locator('#w-hero dialog[aria-label="Таланты и дополнительные сведения"]')
    inspector=dialog.locator('[data-arms-inspector]')
    def activate(target):
        if label=='desktop':target.click()
        else:target.tap()
    def saved():return page.evaluate('(k)=>localStorage.getItem(k)',KEY)
    def node(key):return dialog.locator(f'[data-arms-node="{key}"]:not([data-arms-delta])')
    def geometry(key):
        return dialog.evaluate("""(d,key)=>{
          const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}};
          const selected=[...d.querySelectorAll('[data-arms-node]:not([data-arms-delta])')].find(e=>e.dataset.armsNode===key);
          return {node:r(selected),inspector:r(d.querySelector('[data-arms-inspector]')),
            reset:r(d.querySelector('[data-arms-reset]').parentElement),close:r(d.querySelector(':scope>button.btn')),
            measuredHeight:parseFloat(d.style.getPropertyValue('--arms-inspector-height')),
            pageY:scrollY,overflow:d.scrollWidth>d.clientWidth+1};
        }""",key)
    def inside(r):return r['w']>0 and r['h']>0 and r['x']>=-1 and r['y']>=-1 and r['x']+r['w']<=viewport['width']+1 and r['y']+r['h']<=viewport['height']+1
    def overlaps(a,b):return min(a['x']+a['w'],b['x']+b['w'])-max(a['x'],b['x'])>1 and min(a['y']+a['h'],b['y']+b['h'])-max(a['y'],b['y'])>1
    try:
        page.goto(URL,wait_until='domcontentloaded')
        page.wait_for_function('!!(window.Battle&&Battle.armsIntegrated)')
        page.evaluate("""k=>{
          const h={id:'safe-area',name:'Safe area',race:'human',cls:'warrior',level:15,hxp:{me:Battle.xpAt(15)},party:['me'],
            specs:{me:'arms',warrior:'arms'},armsTalents:{},items:{},gear:{},money:0,q:{},zone:'elwynn',at:'goldshire',
            intro:{elwynn:1},v57migrated:true,v57onboarding:false,tav:{st:0,coll:{}}};
          localStorage.setItem('azeroth-ab-setup-v5','KEEP_SAFE_AREA_NORMAL');
          localStorage.setItem(k,JSON.stringify({chars:[h],cur:h.id,sound:false,compAll:false}));
        }""",KEY)
        page.reload(wait_until='domcontentloaded')
        expect(page.locator('#pa-entry')).to_have_attribute('data-state','ready')
        page.locator('#pa-enter').click();page.locator('#sel-enter').click()
        page.locator('#bnav [data-tab="hero"]').click()
        page.locator('#w-hero').get_by_role('button',name='Таланты и дополнительные сведения',exact=True).click()
        expect(inspector).to_be_hidden()
        base_padding=dialog.evaluate('d=>getComputedStyle(d).paddingBottom')
        keys=node('ihs').evaluate("e=>[...e.closest('[data-arms-panel]').querySelectorAll('[data-arms-node]:not([data-arms-delta])')].map(n=>n.dataset.armsNode)")
        page_y=page.evaluate('scrollY')
        for key in dict.fromkeys([keys[0],keys[len(keys)//2],keys[-1]]):
            before=saved();activate(node(key));expect(inspector).to_be_visible()
            page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
            g=geometry(key);report.append({'key':key,**g})
            regions=['node','inspector','reset','close']
            assert all(inside(g[x]) for x in regions),g
            for a,b in combinations(regions,2):
                assert not overlaps(g[a],g[b]),{'overlap':[a,b],**g}
            assert 0<=g['measuredHeight']-g['inspector']['h']<1.01,g
            assert not g['overflow'] and g['pageY']==page_y,g
            assert saved()==before
            page.screenshot(path=str(out/f'{key}.png'))
            activate(inspector.locator('[data-arms-inspector-close]'));expect(inspector).to_be_hidden()
            assert dialog.evaluate('d=>getComputedStyle(d).paddingBottom')==base_padding
            assert dialog.evaluate("d=>d.style.getPropertyValue('--arms-inspector-height')")=='0px'
        activate(node('ihs'));activate(inspector.locator('[data-arms-node="ihs"][data-arms-delta="1"]'))
        expect(node('ihs')).to_contain_text('1/3')
        activate(inspector.locator('[data-arms-node="ihs"][data-arms-delta="-1"]'))
        expect(node('ihs')).to_contain_text('0/3')
        assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')")=='KEEP_SAFE_AREA_NORMAL'
        assert not errors,errors
        status='passed'
    except Exception:
        (out/'failure.txt').write_text(traceback.format_exc(),encoding='utf-8');raise
    finally:
        (out/'result.json').write_text(json.dumps({'status':status,'viewport':viewport,'report':report,'errors':errors,'scope':'Chromium; blocked remote artwork; seeded isolated save; not real-device or live acceptance'},indent=2),encoding='utf-8')
        try:page.screenshot(path=str(out/'final.png'))
        finally:
            context.tracing.stop(path=str(out/'trace.zip'));context.close()

try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        try:
            for label,viewport in VIEWPORTS.items():run(browser,label,viewport)
        finally:browser.close()
finally:
    server.shutdown();server.server_close()
