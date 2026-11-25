"""Component regression using the real manifest-assembled grouping helper.
Chromium DOM fixtures only; combined-build acceptance is test_hero_layout.py.
"""
import json
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

FIXTURES = {
 'legacy': '<summary>Умения</summary><ul><li id="auto"><b>Удар</b><span class="scd">автоатака</span></li><li id="active" data-skill="bolt">Мана 10; перезарядка 2</li><li id="passive" class="au"><b>Пассивка</b>Описание</li><li id="aura" class="au"><b>Аура вашего героя: тест</b>Описание</li></ul>',
 'integrated': '<summary>Умения</summary><p>Автоатака: Удар</p><ul><li id="active" data-integrated-skill="mortal" data-available="false">Закрыто до уровня 15</li><li id="passive" data-integrated-passive="deepwounds">Глубокие раны</li></ul><p>Аура: тест</p>',
 'active-only': '<summary>Умения</summary><ul><li id="active" data-skill="bolt" data-available="true">Умение</li></ul>',
 'empty': '<summary>Умения</summary>'
}
CHECK = """({helper,name})=>{
 eval(helper);
 const d=document.querySelector('details'),rows=[...d.querySelectorAll('li')];
 const before=rows.map(n=>n.outerHTML);
 groupHeroSkills(d);
 const expected=name==='legacy'?['auto','active','passive','aura']:name==='integrated'?['active','passive','aura']:name==='active-only'?['active']:[];
 const groups=[...d.querySelectorAll('[data-skill-group]')];
 const kinds=groups.map(n=>n.dataset.skillGroup);
 if(JSON.stringify(kinds)!==JSON.stringify(expected))throw Error('Wrong groups '+kinds);
 const labels={auto:'Автоматическое действие',active:'Активные умения',passive:'Пассивные эффекты',aura:'Аура'};
 for(const g of groups)if(g.querySelector('h4').textContent!==labels[g.dataset.skillGroup])throw Error('Wrong heading');
 if(rows.some((n,i)=>!n.isConnected||n.outerHTML!==before[i]))throw Error('Row identity or content changed');
 for(const row of rows)if(row.closest('[data-skill-group]').dataset.skillGroup!==row.id)throw Error('Misclassified '+row.id);
 const once=d.innerHTML;groupHeroSkills(d);
 if(d.innerHTML!==once)throw Error('Not idempotent');
 return {groups:kinds,rowsPreserved:rows.length,idempotent:true};
}"""

def main():
 source=subprocess.check_output(['node','-e',"process.stdout.write(require('./scripts/lib_engine_load.cjs').source('src/scripts/script-16.txt'))"],text=True)
 start='/* HERO_SKILL_GROUPS_BEGIN */';end='/* HERO_SKILL_GROUPS_END */'
 assert source.count(start)==source.count(end)==1
 helper=source.split(start)[1].split(end)[0]
 commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
 out=Path('test-results/hero-layout/skill-groups');out.mkdir(parents=True,exist_ok=True)
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch()
  try:
   for width,height in [(320,640),(390,844),(1280,800)]:
    for name,html in FIXTURES.items():
     page=browser.new_page(viewport={'width':width,'height':height})
     result=dict(sourceCommit=commit,viewport=[width,height],fixture=name,status='failed')
     try:
      page.set_content('<details open class="sk">'+html+'</details>')
      result.update(page.evaluate(CHECK,{'helper':helper,'name':name}));result['status']='passed'
     except Exception as exc:result['error']=str(exc)
     finally:
      results.append(result);page.close()
  finally:browser.close()
 (out/'results.json').write_text(json.dumps({'scope':'Actual assembled helper, synthetic DOM; not combat or full-build acceptance','results':results},ensure_ascii=False,indent=2),encoding='utf-8')
 assert len(results)==12 and all(r['status']=='passed' for r in results),results

if __name__=='__main__':main()
