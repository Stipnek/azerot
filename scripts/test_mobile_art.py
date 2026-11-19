import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

output = Path('results/mobile-art')
output.mkdir(parents=True, exist_ok=True)
server = http.server.ThreadingHTTPServer(('127.0.0.1', 8766), functools.partial(http.server.SimpleHTTPRequestHandler, directory='preview'))
threading.Thread(target=server.serve_forever, daemon=True).start()
records = []

def inspect(page, stage, slide, mode, label):
    page.wait_for_function("selector => Array.from(document.querySelectorAll(selector)).some(im => im.complete && im.naturalWidth > 0 && parseFloat(getComputedStyle(im).opacity) > 0.5)", arg=slide, timeout=90000)
    data = page.evaluate("""({stage,slide}) => {
      const box=document.querySelector(stage), im=Array.from(document.querySelectorAll(slide)).find(n=>n.complete&&n.naturalWidth>0&&parseFloat(getComputedStyle(n).opacity)>0.5);
      const b=box.getBoundingClientRect(),r=im.getBoundingClientRect(),s=getComputedStyle(im);
      return {stage:{x:b.x,y:b.y,width:b.width,height:b.height},image:{x:r.x,y:r.y,width:r.width,height:r.height,naturalWidth:im.naturalWidth,naturalHeight:im.naturalHeight},fit:s.objectFit,position:s.objectPosition,viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth+2};
    }""", {'stage':stage,'slide':slide})
    assert data['fit'] == mode, (label,data)
    assert not data['overflow'], (label,data)
    assert data['stage']['width'] > 0 and data['stage']['height'] > 0, (label,data)
    if mode == 'cover':
        for key in ['x','y','width','height']:
            assert abs(data['stage'][key]-data['image'][key]) <= 2, (label,key,data)
    page.screenshot(path=str(output / (label+'.png')), full_page=True)
    records.append({'label':label,**data})

try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        try:
            for width,height in [(360,800),(390,844),(430,932)]:
                context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
                page=context.new_page();errors=[]
                page.on('pageerror',lambda error:errors.append(str(error)))
                try:
                    page.goto('http://127.0.0.1:8766/',wait_until='load',timeout=90000)
                    page.locator('#create:visible').wait_for(timeout=30000)
                    for step in range(3):
                        page.wait_for_function('step => document.querySelector("#create").dataset.step === String(step)',arg=step)
                        inspect(page,'#cr-stage','#cr-stage .az50-slide','cover',f'create-{width}x{height}-step-{step}')
                        button=page.locator('#cr-go');assert button.is_visible()
                        bounds=button.bounding_box();assert bounds and bounds['y']>=0 and bounds['y']+bounds['height']<=height+2
                        if step<2: button.click()
                    assert not errors, errors
                finally:
                    context.close()
                context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True)
                context.add_init_script("""localStorage.setItem('azeroth-ab-setup-v5',JSON.stringify({chars:[{id:'mobile-art-fixture',name:'Проверка',race:'human',cls:'warrior',level:1,hxp:{me:0},money:0,party:['me'],specs:{me:'prot'}}],cur:'mobile-art-fixture'}));""")
                page=context.new_page()
                try:
                    page.goto('http://127.0.0.1:8766/',wait_until='load',timeout=90000)
                    page.locator('#select:visible').wait_for(timeout=30000)
                    inspect(page,'#sel-stage','#sel-stage .az51-slide','cover',f'select-{width}x{height}')
                finally:
                    context.close()
            context=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True)
            page=context.new_page()
            try:
                page.goto('http://127.0.0.1:8766/',wait_until='load',timeout=90000)
                page.locator('#create:visible').wait_for(timeout=30000)
                inspect(page,'#cr-stage','#cr-stage .az50-slide','contain','create-landscape-844x390')
            finally:
                context.close()
        finally:
            browser.close()
finally:
    (output/'layout-results.json').write_text(json.dumps({'checks':records,'scope':'Actual preview DOM and loaded gallery images in Chromium; screenshots require visual review. Not physical iPhone/Safari or on-screen-keyboard validation.'},ensure_ascii=False,indent=2),encoding='utf-8')
    server.shutdown()
    server.server_close()
