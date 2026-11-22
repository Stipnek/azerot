import functools, http.server, threading, json
from playwright.sync_api import sync_playwright, expect
CHROME='/home/user/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'
KEY='azeroth-arms-hero-v1'; NORMAL='{"chars":[],"sound":false,"marker":"KEEP_NORMAL"}'
IDS=['qa-a','qa-b']; NAMES=['Альфа','Бета']
def serve():
    s=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(http.server.SimpleHTTPRequestHandler,directory='/tmp/qa'))
    s.RequestHandlerClass.log_message=lambda *a:None
    threading.Thread(target=s.serve_forever,daemon=True).start()
    return s, f'http://127.0.0.1:{s.server_port}/arms-hero.html'
SEED="""({key,normal,ids,names,level})=>{const chars=ids.map((id,i)=>({id,name:names[i],cls:'warrior',race:'human',level,
hxp:{me:Battle.xpAt(level)},specs:{me:'arms',warrior:'arms'},party:['me'],armsTalents:{},money:0,items:{},gear:{},tav:{st:0,coll:{}},q:{},
v57migrated:true,v57onboarding:false,intro:{elwynn:1},zone:'elwynn',at:'goldshire',pos:{x:44.7,y:45.8}}));
localStorage.setItem('azeroth-ab-setup-v5',normal);localStorage.setItem(key,JSON.stringify({chars,cur:ids[0],enc:'hogger',sound:false,compAll:false,allSpecs:false}));}"""
