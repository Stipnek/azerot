import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

output=Path('results/mobile-art')
output.mkdir(parents=True,exist_ok=True)
server=http.server.ThreadingHTTPServer(('127.0.0.1',8766),functools.partial(http.server.SimpleHTTPRequestHandler,directory='preview'))
threading.Thread(target=server.serve_forever,daemon=True).start()
records=[]
fixture="localStorage.setItem('azeroth-ab-setup-v5',JSON.stringify({chars:[{id:'mobile-art-fixture',name:'Проверка',race:'human',cls:'warrior',level:1,hxp:{me:0},money:0,party:['me'],specs:{me:'prot'}}],cur:'mobile-art-fixture'}));"

def inspect(page,stage,slide,mode,label):
    page.wait_for_function("selector=>Array.from(document.querySelectorAll(selector)).some(im=>im.complete&&im.naturalWidth>0&&parseFloat(getComputedStyle(im).opacity)>0.5)",arg=slide,timeout=90000)
    data=page.evaluate("""({stage,slide})=>{const box=document.querySelector(stage),im=Array.from(document.querySelectorAll(slide)).find(n=>n.complete&&n.naturalWidth>0&&parseFloat(getComputedStyle(n).opacity)>0.5),b=box.getBoundingClientRect(),r=im.getBoundingClientRect(),s=getComputedStyle(im);return {stage:{x:b.x,y:b.y,width:b.width,height:b.height},image:{x:r.x,y:r.y,width:r.width,height:r.height},layout:{left:im.offsetLeft,top:im.offsetTop,width:im.offsetWidth,height:im.offsetHeight},fit:s.objectFit,overflow:document.documentElement.scrollWidth>innerWidth+2};}""",{'stage':stage,'slide':slide})
    assert data['fit']==mode,(label,data)
    assert not data['overflow'],(label,data)
    assert data['stage']['width']>0 and data['stage']['height']>0,(label,data)
    if mode=='cover':
        assert abs(data['layout']['width']-data['stage']['width'])<=2,(label,data)
        assert abs(data['layout']['height']-data['stage']['height'])<=2,(label,data)
        assert abs(data['layout']['left'])<=1 and abs(data['layout']['top'])<=1,(label,data)
        assert data['image']['x']<=data['stage']['x']+1 and data['image']['y']<=data['stage']['y']+1,(label,data)
    page.screenshot(path=str(output/(label+'.png')),full_page=True)
    records.append({'label':label,**data})

try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        try:
            for width,height in [(360,800),(390,844),(430,932)]:
                for selected in [False,True]:
                    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
                    if selected:context.add_init_script(fixture)
                    page=context.new_page();errors=[]
                    page.on('pageerror',lambda error:errors.append(str(error)))
                    try:
                        page.goto('http://127.0.0.1:8766/',wait_until='load',timeout=90000)
                        screen='select' if selected else 'create'
                        page.locator('#'+screen+':visible').wait_for(timeout=30000)
                        for step in range(1 if selected else 3):
                            if not selected:page.wait_for_function('step=>document.querySelector("#create").dataset.step===String(step)',arg=step)
                            inspect(page,'#sel-stage' if selected else '#cr-stage','#sel-stage .az51-slide' if selected else '#cr-stage .az50-slide','cover',f'{screen}-{width}x{height}-step-{step}')
                            if not selected:
                                button=page.locator('#cr-go');bounds=button.bounding_box()
                                assert button.is_visible() and bounds and bounds['y']>=0 and bounds['y']+bounds['height']<=height+2
                                if step<2:button.click()
                        assert not errors,errors
                    finally:context.close()
            context=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True)
            try:
                page=context.new_page();page.goto('http://127.0.0.1:8766/',wait_until='load',timeout=90000)
                inspect(page,'#cr-stage','#cr-stage .az50-slide','contain','create-landscape')
            finally:context.close()
            context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,record_video_dir=str(output/'video'),record_video_size={'width':390,'height':844})
            try:
                page=context.new_page();page.goto('http://127.0.0.1:8766/',wait_until='load',timeout=90000)
                active='#cr-stage [data-cinema-active=true]'
                page.locator(active).wait_for(timeout=90000)
                first=page.locator(active).get_attribute('src')
                before=page.locator(active).evaluate('(im)=>getComputedStyle(im).scale')
                page.wait_for_timeout(1100)
                after=page.locator(active).evaluate('(im)=>getComputedStyle(im).scale')
                assert before!=after,(before,after)
                page.wait_for_function('src=>document.querySelector("#cr-stage [data-cinema-active=true]")?.src!==src',arg=first,timeout=25000)
                page.wait_for_timeout(350)
                assert page.evaluate('Array.from(document.querySelectorAll("#cr-stage .az50-slide")).some(im=>parseFloat(getComputedStyle(im).opacity)>.99)')
                page.locator('#cr-stage [data-cinema-toggle]').click()
                held=page.locator(active).evaluate('(im)=>getComputedStyle(im).scale')
                page.wait_for_timeout(500)
                assert held==page.locator(active).evaluate('(im)=>getComputedStyle(im).scale')
                page.screenshot(path=str(output/'cinema-paused.png'))
                records.append({'label':'cinema','motionChanged':True,'automaticImageChanged':True,'opaqueLayerDuringFade':True,'pauseHeld':True,'video':'video/'})
            finally:context.close()
            context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce')
            try:
                page=context.new_page();page.goto('http://127.0.0.1:8766/',wait_until='load',timeout=90000)
                page.locator('#cr-stage [data-cinema-active=true]').wait_for(timeout=90000)
                assert page.evaluate('window.AzerotCinema.isPaused(document.querySelector("#cr-stage"))')
                assert page.locator('#cr-stage [data-cinema-toggle]').is_disabled()
                assert page.evaluate('Array.from(document.querySelectorAll("#cr-stage .az50-slide")).every(im=>im.getAnimations().length===0)')
                records.append({'label':'reduced-motion','noAnimation':True})
            finally:context.close()
        finally:browser.close()
finally:
    (output/'layout-results.json').write_text(json.dumps({'checks':records,'scope':'Real preview DOM, gallery images, Chromium layout/motion assertions and WebM recording. Screenshots/video still need human visual review; not physical Safari/keyboard validation.'},ensure_ascii=False,indent=2),encoding='utf-8')
    server.shutdown();server.server_close()
