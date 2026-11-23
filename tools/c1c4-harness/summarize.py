import sys,json
for l in open(sys.argv[1]):
  r=json.loads(l);h=r.get('hero') or (r.get('state') or {}).get('hero')
  if r['kind']=='click': print(r['t'],'CLICK',r['sel'],'|',r.get('text','').replace('\n',' ')[:40]); continue
  if h: print(r['t'],r['kind'],'lvl',h['level'],'xp',h['hxp']['me'],'money',h['money'],'party',h['party'],'q',h['q'],'at',h['at'],'tav',h['tav'])
  else: print(r['t'],r['kind'],str({k:v for k,v in r.items() if k not in('t','kind')})[:500])
