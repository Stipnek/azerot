"""Actual assembled tree-view helper with frozen synthetic state; not full-build acceptance."""
import json
import subprocess
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

FIXTURE = 'const S=Object.freeze({main:CLASS,hero:Object.freeze({id:\'test\',armsTalents:Object.freeze({ihs:2})}),specs:Object.freeze({me:CLASS===\'druid\'?\'bear\':CLASS===\'warrior\'?\'arms\':\'unchanged\'})});\nconst B={armsIntegrated:{validate:raw=>({ok:typeof raw===\'object\',spent:Object.values(raw).reduce((a,b)=>a+b,0)}),TREE:[{id:\'ihs\',ru:\'Улучшенный удар\',tier:1,max:3},{id:\'anger\',ru:\'Управление гневом\',tier:3,max:1}],CONFIG:{unavailable:[\'anger\']}}};\nconst ARMS_HERO_MODE=true;const hLevel=()=>15;const $=id=>document.getElementById(id);const esc=x=>String(x).replace(/[&<>"\']/g,c=>({\'&\':\'&amp;\',\'<\':\'&lt;\',\'>\':\'&gt;\',\'"\':\'&quot;\',"\'":\'&#39;\'}[c]));\nconst armsHeroEffect=id=>id===\'ihs\'?\'Стоимость меньше.\':\'Этот талант пока недоступен для изучения.\';const save=()=>{throw Error(\'Unexpected save\')};\n'
CLASSES=['warrior','paladin','druid','priest','mage','hunter','rogue','warlock']

def run(page,helper,cls):
 page.route('http://hero.test/**',lambda r:r.fulfill(body='<main id="w-hero"><section id="specbox"></section></main>',content_type='text/html'))
 page.goto('http://hero.test/')
 listener="$('specbox').innerHTML=heroTreeButtons();$('w-hero').addEventListener('click',ev=>{const tree=ev.target.closest('[data-tree-view]');if(tree){ev.preventDefault();openHeroTree(tree.dataset.treeView,tree);return;}});"
 page.add_script_tag(content=FIXTURE.replace('CLASS',json.dumps(cls))+'\n'+helper+'\n'+listener)
 page.evaluate("localStorage.setItem('azeroth-ab-setup-v5','KEEP');localStorage.setItem('azeroth-arms-hero-v1','ISOLATED')")
 before=page.evaluate('JSON.stringify(S)')
 buttons=page.locator('#specbox [data-tree-view]');expect(buttons).to_have_count(3)
 assert page.locator('[data-hspec]').count()==0
 ids=buttons.evaluate_all('ns=>ns.map(n=>n.dataset.treeView)')
 if cls=='druid':assert ids==['balance','feral','resto']
 for totals,wanted in [([5,5,2],[0,1]),([3,5,5],[1,2]),([0,0,0],[]),([None,5,0],[])]:
  assert page.evaluate('x=>heroTreeLeaders(x)',totals)==wanted
 buttons.first.click();dialog=page.locator('dialog[data-tree-screen]');expect(dialog).to_be_visible()
 for tree in ids:
  dialog.locator(f'[data-tree-view="{tree}"]').click()
  expect(dialog.locator(f'[data-tree-view="{tree}"]')).to_have_attribute('aria-current','page')
  assert dialog.locator('[data-primary-tree=true]').count()==(1 if cls=='warrior' else 0)
  if cls=='warrior' and tree=='arms':
   dialog.locator('[data-tree-node="anger"]').click()
   expect(dialog.locator('[data-tree-description]')).to_contain_text('Описание эффекта ещё не проверено.')
   expect(dialog.locator('[data-tree-inspector]')).to_be_visible()
   dialog.locator('[data-tree-hide]').click();expect(dialog.locator('[data-tree-inspector]')).to_be_hidden()
  else:expect(dialog.locator('[data-tree-body]')).to_contain_text('Данные этого дерева ещё не подключены')
  assert page.evaluate('JSON.stringify(S)')==before
  assert page.evaluate("[localStorage.getItem('azeroth-ab-setup-v5'),localStorage.getItem('azeroth-arms-hero-v1')]")==['KEEP','ISOLATED']
  assert dialog.evaluate('d=>d.scrollWidth<=d.clientWidth'),'Horizontal clipping'
 page.keyboard.press('Escape');expect(dialog).to_be_hidden();expect(buttons.first).to_be_focused()
 buttons.last.click();expect(dialog).to_be_visible();dialog.locator('[data-tree-close]').last.click()
 expect(dialog).to_be_hidden();expect(buttons.last).to_be_focused()
 return dict(treeIds=ids,statePreserved=True,tiesVerified=True)

def main():
 source=subprocess.check_output(['node','-e',"process.stdout.write(require('./scripts/lib_engine_load.cjs').source('src/scripts/script-06.txt'))"],text=True)
 start='/* HERO_TREE_VIEW_BEGIN */';end='/* HERO_TREE_VIEW_END */'
 assert source.count(start)==source.count(end)==1
 # TALENT-01: the hero tab shows the spec selector; the tree buttons remain where the spec cannot be switched yet and in the tree viewer.
 assert "const specBox = specSelectorHtml('hero');" in source and "specNotice + heroTreeButtons() + '</div>'" in source
 helper=source.split(start)[1].split(end)[0]
 commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
 out=Path('test-results/hero-layout/tree-navigation');out.mkdir(parents=True,exist_ok=True)
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch()
  try:
   for width,height in [(320,640),(390,844),(1280,800)]:
    for cls in CLASSES:
     page=browser.new_page(viewport={'width':width,'height':height})
     result=dict(sourceCommit=commit,viewport=[width,height],cls=cls,status='failed')
     try:result.update(run(page,helper,cls));result['status']='passed'
     except Exception:result['failure']=traceback.format_exc()
     finally:results.append(result);page.close()
  finally:browser.close()
 (out/'results.json').write_text(json.dumps({'scope':'Assembled helper with synthetic engine/hero fixtures. Not full-build, combat, migration or live acceptance.','results':results},ensure_ascii=False,indent=2),encoding='utf-8')
 assert len(results)==24 and all(r['status']=='passed' for r in results),results

if __name__=='__main__':main()
