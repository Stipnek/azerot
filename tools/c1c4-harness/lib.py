import json, time
DUMP_JS = """()=>[...document.querySelectorAll('button,[role=button],input,select')].filter(e=>e.offsetParent&&!e.disabled).map(e=>(e.id||'')+'|'+String(e.className||'').slice(0,30)+'|'+(e.textContent||e.value||'').trim().replace(/\\s+/g,' ').slice(0,50))"""
STATE_JS = """()=>{const k=Object.keys(localStorage).find(x=>x.startsWith('azeroth-arms-hero'));if(!k)return null;try{const d=JSON.parse(localStorage.getItem(k));const h=(d.chars||[]).find(x=>x.id===d.cur)||(d.chars||[])[0];return {key:k,hero:h?{name:h.name,cls:h.cls,level:h.level,hxp:h.hxp,money:h.money,party:h.party,q:h.q,qprog:h.qprog,zone:h.zone,at:h.at,tav:h.tav,items:h.items,specs:h.specs,v57onboarding:h.v57onboarding,v57recruit:h.v57recruit}:null,flags:{allQ:d.allQ,allSpecs:d.allSpecs,ambTest:d.ambTest,testClear:d.testClear,compAll:d.compAll,auto:d.auto}}}catch(e){return {key:k,err:String(e)}}}"""
class Log:
    def __init__(s, path): s.f=open(path,'w',encoding='utf-8'); s.t0=time.time()
    def __call__(s, kind, **kw):
        rec={'t':round(time.time()-s.t0,2),'kind':kind,**kw}; s.f.write(json.dumps(rec,ensure_ascii=False)+'\n'); s.f.flush(); print(json.dumps(rec,ensure_ascii=False)[:1500])
def dump(pg): return pg.evaluate(DUMP_JS)
def state(pg): return pg.evaluate(STATE_JS)
