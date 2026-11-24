"""Arms layout and preview-first allocation regression on three viewports.
Remote HTTPS is blocked deliberately. This is not real-device or icon-network acceptance.
"""
import functools, http.server, json, os, sys, threading, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT = Path('test-results/arms-tree-layout')
KEY = 'azeroth-arms-hero-v1'
NORMAL = '{"chars":[],"sound":false,"marker":"KEEP_NORMAL_LAYOUT"}'
VIEWPORTS = {'desktop': {'width': 1280, 'height': 800}, 'mobile': {'width': 390, 'height': 844}, 'landscape': {'width': 750, 'height': 342}}
SEED = """({key, normal}) => {
 const hero={id:'layout-test',name:'Тест дерева',race:'human',cls:'warrior',level:15,
 hxp:{me:Battle.xpAt(15)},party:['me'],specs:{me:'arms',warrior:'arms'},armsTalents:{},
 items:{},gear:{},money:0,q:{},zone:'elwynn',at:'goldshire',intro:{elwynn:1},
 v57migrated:true,v57onboarding:false,tav:{st:0,coll:{}}};
 localStorage.setItem('azeroth-ab-setup-v5',normal);
 localStorage.setItem(key,JSON.stringify({chars:[hero],cur:hero.id,sound:false,compAll:false}));
}"""
GEOMETRY = """() => {
 const d=document.querySelector('#w-hero dialog[open]'), panel=d.querySelector('[data-arms-panel]');
 const insp=panel.querySelector('[data-arms-inspector]'), vw=innerWidth, vh=innerHeight;
 const rect=e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,h:r.height}};
 const inside=e=>{const r=rect(e);return r.h>0&&r.top>=-1&&r.bottom<=vh+1&&r.left>=-1&&r.right<=vw+1};
 const nodes=[...panel.querySelectorAll('[data-arms-node]:not([data-arms-delta])')];
 return {vw,vh,dialog:rect(d),pageScrollY:scrollY,overflowY:getComputedStyle(d).overflowY,
 dialogScroll:{top:d.scrollTop,height:d.scrollHeight,client:d.clientHeight},
 close:inside(d.querySelector(':scope>button.btn')),points:inside(insp.nextElementSibling),
 pointsText:insp.nextElementSibling.textContent.trim(),reset:inside(panel.querySelector('[data-arms-reset]')),
 inspectorHeight:insp.hidden?rect(insp).h:null,
 clippedX:nodes.filter(n=>{const r=rect(n);return r.left<-1||r.right>vw+1}).length,
 icons:nodes.map(n=>({id:n.dataset.armsNode,icon:n.dataset.armsIcon||null,
 loaded:!!(n.querySelector('img')&&n.querySelector('img').naturalWidth)}))};
}"""
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
server.RequestHandlerClass.log_message=lambda *a: None
threading.Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/combined.html'

def run(browser,label,viewport):
 out=OUT/label; out.mkdir(parents=True,exist_ok=True)
 context=browser.new_context(viewport=viewport,has_touch=label!='desktop')
 page=context.new_page(); page.set_default_timeout(20000); expect.set_options(timeout=20000)
 errors=[]; report={}; status='failed'
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.route('https://**/*',lambda route: route.abort())
 page.route('**/favicon.ico',lambda route: route.fulfill(status=204,body=''))
 dialog=page.locator('#w-hero dialog[aria-label="Умения и особенности"]')
 insp=dialog.locator('[data-arms-inspector]')
 node=lambda key: dialog.locator(f'[data-arms-node="{key}"]:not([data-arms-delta])')
 saved=lambda: page.evaluate('k=>(JSON.parse(localStorage.getItem(k)).chars[0].armsTalents||{})',KEY)
 def activate(locator):
  if label=='desktop': locator.click()
  else: locator.tap()
 def hide():
  if insp.is_visible():
   activate(insp.locator('[data-arms-inspector-close]')); expect(insp).to_be_hidden()
 def preview(key):
  hide(); before=saved(); activate(node(key)); expect(insp).to_be_visible()
  assert saved()==before, 'Preview spent talent points'
  expect(insp.locator('[data-arms-actions]')).to_contain_text('Добавить ранг')
 def action(key,delta,force=False):
  target=insp.locator(f'[data-arms-node="{key}"][data-arms-delta="{delta}"]')
  if force: target.click(force=True)
  else: activate(target)
 def open_tree():
  root=page.locator('#pa-entry'); expect(root).to_have_attribute('data-state','ready')
  page.locator('#pa-enter').click(); expect(root).to_be_hidden(); page.locator('#sel-enter').click()
  page.locator('#bnav [data-tab="hero"]').click()
  page.locator('#w-hero').get_by_role('button',name='Умения и особенности',exact=True).click()
  expect(dialog).to_be_visible()
 try:
  page.goto(URL,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_function('!!(window.Battle && Battle.armsIntegrated)')
  page.evaluate(SEED,{'key':KEY,'normal':NORMAL}); page.reload(wait_until='domcontentloaded'); open_tree()
  page.wait_for_function("()=>[...document.querySelectorAll('#w-hero [data-arms-node] img')].every(i=>i.complete)")
  g=page.evaluate(GEOMETRY); report['open']=g; page.screenshot(path=str(out/'open.png'))
  d=g['dialog']
  assert d['top']<=1 and d['left']<=1 and d['bottom']>=g['vh']-1 and d['right']>=g['vw']-1, d
  assert g['overflowY']=='auto' and g['close'] and g['points'],g
  assert g['inspectorHeight']==0 and g['clippedX']==0,g
  assert dialog.evaluate("d=>[...d.children].filter(c=>getComputedStyle(c).order==='-1').some(c=>c.querySelector('[data-arms-panel]'))")
  assert g['pointsText'].startswith('Уровень 15. Очки: 0 / '),g
  assert g['icons'] and all(i['icon'] in ('missing','locked') and not i['loaded'] for i in g['icons']),g
  assert {i['id']:i['icon'] for i in g['icons']}['ihs']=='missing'
  assert any(i['icon']=='locked' for i in g['icons'])
  page.mouse.move(viewport['width']//2,viewport['height']//2); page.mouse.wheel(0,300); page.wait_for_timeout(300)
  dialog.locator('[data-arms-node]').last.scroll_into_view_if_needed()
  g2=page.evaluate(GEOMETRY); report['scrolledEnd']=g2; page.screenshot(path=str(out/'scrolled.png'))
  assert g2['pageScrollY']==g['pageScrollY'] and g2['close'] and g2['points'] and g2['reset'],g2
  assert g2['dialogScroll']['top']>0 or g2['dialogScroll']['height']<=g2['dialogScroll']['client'],g2
  dialog.evaluate('d=>{d.scrollTop=0}')
  activate(dialog.locator('[data-arms-help="ihs"] summary')); expect(insp).to_be_visible()
  assert saved()=={}
  ib=insp.bounding_box(); report['inspector']={'box':ib,'talents':saved()}
  page.screenshot(path=str(out/'inspector.png'))
  assert ib['y']>=0 and ib['y']+ib['height']<=viewport['height']+1 and ib['x']>=0 and ib['x']+ib['width']<=viewport['width']+1,ib
  assert page.evaluate(GEOMETRY)['close']
  preview('ihs'); preview('ihs'); assert saved()=={}
  action('ihs',1); expect(node('ihs')).to_contain_text('1/3')
  action('ihs',1); expect(node('ihs')).to_contain_text('2/3')
  action('ihs',-1); expect(node('ihs')).to_contain_text('1/3')
  assert saved().get('ihs')==1,saved()
  hide()
  activate(dialog.locator('[data-arms-node="ihs"][data-arms-delta="-1"]').last)
  expect(node('ihs')).to_contain_text('0/3')
  preview('ihs'); action('ihs',1); expect(node('ihs')).to_contain_text('1/3')
  assert page.evaluate(GEOMETRY)['pointsText'].startswith('Уровень 15. Очки: 1 / ')
  locked=next(i['id'] for i in g['icons'] if i['icon']=='locked')
  preview(locked); before=saved(); action(locked,1,force=True); assert saved()==before
  page.screenshot(path=str(out/'bought.png')); hide()
  dialog.get_by_role('button',name='Закрыть',exact=True).click(); expect(dialog).to_be_hidden()
  page.reload(wait_until='domcontentloaded'); open_tree(); expect(node('ihs')).to_contain_text('1/3')
  activate(dialog.locator('[data-arms-reset]')); expect(node('ihs')).to_contain_text('0/3')
  assert saved()=={}
  assert page.evaluate("localStorage.getItem('azeroth-ab-setup-v5')")==NORMAL
  assert not errors,errors
  status='passed'
 except Exception:
  (out/'failure.txt').write_text(traceback.format_exc(),encoding='utf-8')
  page.screenshot(path=str(out/'failure.png')); raise
 finally:
  (out/'result.json').write_text(json.dumps({'status':status,'sourceCommit':os.environ.get('GITHUB_SHA'),'viewport':viewport,'pageErrors':errors,'report':report},ensure_ascii=False,indent=2),encoding='utf-8')
  context.close()

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(); failed=[]
  try:
   for label,vp in VIEWPORTS.items():
    try: run(browser,label,vp); print(label,'passed')
    except Exception as e: failed.append(label); print(label,'FAILED',repr(e)[:400])
  finally: browser.close()
  sys.exit(1 if failed else 0)
finally:
 server.shutdown(); server.server_close()
