"""Chromium regression for the exact combined build; no production saves/network art."""
import functools, hashlib, http.server, json, subprocess, threading, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUT=Path('test-results/hero-layout')
KEY='azeroth-arms-hero-v1'
NORMAL='azeroth-ab-setup-v5'
MARKER='{"chars":[],"marker":"KEEP_NORMAL_HERO_UI"}'
VIEWS={'narrow':(320,640),'phone':(390,844),'wide':(1280,800)}
PROFILES=[('warrior','arms',15),('warrior','arms',30),('mage','fire',15)]

def run(browser,url,label,size,profile,identity):
 cls,spec,level=profile
 out=OUT/f'{label}-{cls}-{level}';out.mkdir(parents=True,exist_ok=True)
 ctx=browser.new_context(viewport=dict(zip(('width','height'),size)),has_touch=label!='wide')
 ctx.tracing.start(screenshots=True,snapshots=True,sources=True)
 page=ctx.new_page();page.set_default_timeout(15000)
 errors=[];result=dict(identity=identity,viewport=size,profile=profile,status='failed')
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('https://**/*',lambda r:r.abort())
 page.route('**/favicon.ico',lambda r:r.fulfill(status=204,body=''))
 snapshot=lambda:page.evaluate('ks=>ks.map(k=>localStorage.getItem(k))',[KEY,NORMAL])
 try:
  page.goto(url,wait_until='domcontentloaded',timeout=90000)
  page.wait_for_function('!!(window.Battle&&Battle.armsIntegrated)')
  page.evaluate("""({key,normal,marker,cls,spec,level})=>{
   const h={id:'hero-ui',name:'UI регрессия',cls,race:'human',level,xpCurve:2,hxp:{me:Battle.xpAt(level)},
    specs:{me:spec,[cls]:spec},party:['me'],armsTalents:{},items:{},gear:{},money:0,q:{},
    zone:'elwynn',at:'goldshire',intro:{elwynn:1},v57migrated:true,v57onboarding:false,tav:{st:0,coll:{}}};
   localStorage.setItem(normal,marker);localStorage.setItem(key,JSON.stringify({chars:[h],cur:h.id,sound:false,compAll:false}));
  }""",dict(key=KEY,normal=NORMAL,marker=MARKER,cls=cls,spec=spec,level=level))
  page.reload(wait_until='domcontentloaded')
  expect(page.locator('#pa-entry')).to_have_attribute('data-state','ready')
  page.locator('#pa-enter').click();page.locator('#sel-enter').click()
  page.locator('#bnav [data-tab="hero"]').click()
  overview=page.locator('#w-hero > .az-hero-content:visible')
  expect(overview).to_have_count(1);saved=snapshot()
  expect(overview.locator('details.sk')).to_be_visible()
  expect(overview.locator('details.sk')).to_have_attribute('open','')
  expect(overview.locator('details.sk > summary')).to_have_text('Умения')
  order=overview.evaluate("""e=>[...e.children].map(n=>n.querySelector('.hstats')?'stats':n.querySelector('details.sk')?'skills':n.querySelector('.sect')?.textContent==='Специализация'?'spec':'other')""")
  assert order[:3]==['stats','skills','spec'],order
  expect(overview.locator('[data-arms-panel]')).to_have_count(0)
  expect(overview.locator('.hstats').locator('..').locator(':scope > p.hint')).to_have_count(0)
  assert page.locator('#w-hero').evaluate('e=>e.scrollWidth<=e.clientWidth'),'Horizontal clipping'
  attr='data-integrated-skill' if cls=='warrior' else 'data-skill'
  actual=overview.locator(f'[{attr}]').evaluate_all('(ns,a)=>ns.map(n=>({id:n.getAttribute(a),available:n.dataset.available}))',attr)
  expected=page.evaluate("""({cls,spec,level})=>(cls==='warrior'?Battle.armsIntegrated.slots(level,{},true):Battle.abilityProgression.slots(cls,spec,level)).map(s=>({id:s.id,available:String(s.available)}))""",dict(cls=cls,spec=spec,level=level))
  assert actual==expected,(actual,expected)
  trigger=overview.get_by_role('button',name='Подробно',exact=True)
  helpd=page.locator('#w-hero dialog[aria-label="Подробно о характеристиках"]')
  trigger.scroll_into_view_if_needed()
  geometry=lambda:overview.locator('.hstats').evaluate('e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height,scrollX,scrollY]}')
  before=geometry()
  for escape in [False,True]:
   trigger.click();expect(helpd).to_be_visible()
   assert helpd.evaluate('d=>d.open&&d.matches(":modal")')
   assert helpd.locator('p.hint').count()>0
   close=helpd.get_by_role('button',name='Закрыть',exact=True)
   expect(close).to_be_focused()
   if escape:page.keyboard.press('Escape')
   else:close.click()
   expect(helpd).to_be_hidden();expect(trigger).to_be_focused()
   after=geometry();assert all(abs(a-b)<=1 for a,b in zip(before,after)),(before,after)
   assert snapshot()==saved,'Read-only help wrote saves'
  more=overview.get_by_role('button',name='Таланты и дополнительные сведения',exact=True)
  more.click();extra=page.locator('#w-hero dialog[aria-label="Таланты и дополнительные сведения"]')
  expect(extra).to_be_visible()
  if cls=='warrior':expect(extra.locator('[data-arms-panel="hero-ui"]')).to_be_visible()
  extra.locator(':scope > button').first.click();expect(extra).to_be_hidden();expect(more).to_be_focused()
  page.locator('#w-hero').get_by_role('button',name='Экипировка',exact=True).click()
  gear=page.locator('dialog.az-full-gear[open]');expect(gear).to_be_visible()
  gear.get_by_role('button',name='Назад к герою',exact=True).click();expect(gear).to_have_count(0)
  expect(overview.locator('details.sk')).to_be_visible()
  assert snapshot()==saved and snapshot()[1]==MARKER,'UI wrote isolated or normal saves'
  assert not errors,errors
  result['status']='passed'
 except Exception:
  result['failure']=traceback.format_exc()
 finally:
  result['pageErrors']=errors
  result['scope']='Combined Chromium UI; isolated seeded saves; HTTPS blocked. Not combat, migration, live-artwork, Safari or real-device acceptance.'
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
  try:page.screenshot(path=str(out/'final.png'),full_page=True)
  finally:
   try:ctx.tracing.stop(path=str(out/'trace.zip'))
   finally:ctx.close()
 return result

def main():
 OUT.mkdir(parents=True,exist_ok=True)
 raw=Path('preview/combined.html').read_bytes()
 manifest=json.loads(Path('preview/combined-build.json').read_text(encoding='utf-8'))
 sha=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
 digest=hashlib.sha256(raw).hexdigest()
 assert manifest['sourceCommit']==sha and manifest['sha256']['combined.html']==digest,'Build identity mismatch'
 identity=dict(sourceCommit=sha,combinedSha256=digest)
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
 threading.Thread(target=server.serve_forever,daemon=True).start();results=[]
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch()
   try:
    for label,size in VIEWS.items():
     for profile in PROFILES:results.append(run(browser,f'http://127.0.0.1:{server.server_port}/combined.html',label,size,profile,identity))
   finally:browser.close()
 finally:server.shutdown();server.server_close()
 (OUT/'summary.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
 assert len(results)==9 and all(r['status']=='passed' for r in results),'Hero UI regressions failed; inspect diagnostics'

if __name__=='__main__':main()
