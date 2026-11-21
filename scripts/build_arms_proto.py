"""Build the isolated Arms preview; never publish or modify ordinary saves."""
from pathlib import Path
import hashlib
import json
root = Path(__file__).resolve().parents[1]
source = root / 'src' / 'scripts' / 'script-05.txt'
data = source.read_bytes()
sha256 = hashlib.sha256(data).hexdigest()
blob = hashlib.sha1(b'blob ' + str(len(data)).encode('ascii') + b'\0' + data).hexdigest()
for manifest in sorted(source.parent.glob(source.stem + '*.edits.json')):
    spec = json.loads(manifest.read_text(encoding='utf-8'))
    if spec.get('sourceSha256') != sha256 and spec.get('sourceBlobSha1') != blob:
        raise SystemExit(f'Source changed: inspect {manifest.name}')
    for edit in spec['edits']:
        old, new = edit['old'].encode('utf-8'), edit['new'].encode('utf-8')
        if not old or data.count(old) != 1:
            raise SystemExit(f'Non-unique source edit: {manifest.name}: {edit["name"]}')
        data = data.replace(old, new, 1)
engine = data.decode('utf-8')
ui = (root / 'scripts' / 'arms_proto_ui.js').read_text(encoding='utf-8')
skin = (root / 'scripts' / 'arms_proto_skin.js').read_text(encoding='utf-8')
panels = (root / 'scripts' / 'arms_proto_panels.js').read_text(encoding='utf-8')
classic = (root / 'scripts' / 'arms_proto_classic.css').read_text(encoding='utf-8')
if '</style' in classic.lower():
    raise SystemExit('Unsafe style terminator')
controls = r'''(function(){
'use strict';
const tree=document.getElementById('tree');
const style=document.createElement('style');
style.textContent=CLASSIC_CSS;
document.head.appendChild(style);
function buttonFor(ev, delta){
  if(!ev.target.matches('img.talent-icon'))return null;
  return ev.target.closest('.node').querySelector('[data-d="'+delta+'"]');
}
tree.addEventListener('click',function(ev){const b=buttonFor(ev,1);if(b&&!b.disabled)b.click();});
tree.addEventListener('contextmenu',function(ev){const b=buttonFor(ev,-1);if(b){ev.preventDefault();if(!b.disabled)b.click();}});
function repair(){
  for(const node of tree.querySelectorAll('.node')){
    const image=node.querySelector('.talent-icon');
    if(!image)continue;
    if(image.src.includes('inv_weapon_halbard_01'))node.style.gridColumn='1';
    if(image.src.includes('ability_shockwave'))node.style.gridColumn='3';
  }
  const svg=tree.querySelector('svg');
  if(!svg)return;
  const rect=tree.getBoundingClientRect();
  const P=window.Battle.armsProto;
  svg.replaceChildren();
  for(const n of P.TREE.filter(n=>n.req)){
    const a=tree.querySelector('[data-talent="'+n.req+'"]'),b=tree.querySelector('[data-talent="'+n.id+'"]');
    if(!a||!b)continue;
    const ai=a.querySelector('img'),bi=b.querySelector('img');
    if(!ai||!bi)continue;
    const ra=ai.getBoundingClientRect(),rb=bi.getBoundingClientRect();
    const x=ra.left-rect.left-tree.clientLeft+ra.width/2,y=ra.bottom-rect.top-tree.clientTop;
    const tx=rb.left-rect.left-tree.clientLeft+rb.width/2,ty=rb.top-rect.top-tree.clientTop-2;
    const path=document.createElementNS(svg.namespaceURI,'path');
    path.setAttribute('d','M'+x+' '+y+' V'+((y+ty)/2)+' H'+tx+' V'+ty+' m-4 -5 l4 5 4 -5');
    path.setAttribute('fill','none');path.setAttribute('stroke',a.classList.contains('maxed')?'#e4bd52':'#716343');path.setAttribute('stroke-width','2');svg.appendChild(path);
  }
}
new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&(n.classList.contains('row')||n.localName==='svg'))))requestAnimationFrame(repair);}).observe(tree,{childList:true});
addEventListener('resize',()=>requestAnimationFrame(repair));
requestAnimationFrame(repair);
})();'''.replace('CLASSIC_CSS', json.dumps(classic, ensure_ascii=False))
for part in (engine, ui, skin, controls, panels):
    if '</script' in part.lower():
        raise SystemExit('Unsafe script terminator')
css = 'body{margin:0;padding:12px;font:15px/1.4 system-ui,sans-serif}h1{font-size:21px}.warn{border:1px solid #655139;padding:8px}.ctl{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}label{display:flex;gap:4px;align-items:center}input[type=number]{width:4.5em}button{min-width:36px;min-height:32px}pre{white-space:pre-wrap;font-size:12px}table{border-collapse:collapse}td,th{border:1px solid #655139;padding:3px 6px}.lock{opacity:.55}#err,#note{color:#ef9b79}'
markup = '''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Таланты воина — тест</title>
<h1>Воин · тест трёх деревьев талантов</h1>
<p class="warn">Изолированный прототип, не live. Работают только подготовленные таланты Оружия. Неистовство и Защита — только просмотр. Часть эффектов не реализована; экспериментальный баланс не согласован. Фоны Classic и иконки загружаются с wow.zamimg.com. Оформление ещё сверяется с оригинальным клиентом. Звуки ещё не подключены. Обычное сохранение не изменяется.</p>
<div class="ctl"><label>Уровень мейна <input id="ml" type="number" min="1" max="30"></label><label>Уровень компаньона <input id="cl" type="number" min="1" max="30"></label><button id="presetA">Билд A (= линия)</button><button id="presetB">Билд B</button><button id="reset">Сбросить очки</button></div>
<p id="spec"></p><p id="pts" aria-live="polite"></p><p id="err" role="alert"></p><p id="note" aria-live="polite"></p><div id="tree" aria-label="Дерево талантов Оружие"></div>
<h2>Умения мейна</h2><ul id="kit"></ul>
<h2>Бои</h2><div class="ctl"><select id="enc" aria-label="Бой"></select><label>боёв <input id="seeds" type="number" min="1" max="500"></label><label><input id="acc" type="checkbox"> эксперимент: аксессуар компаньону</label><select id="scale" aria-label="Шкала"><option value="A">шкала A 5–30%</option><option value="B">шкала B 2,5–15%</option></select><select id="tier" aria-label="Качество"></select><button id="run">Запустить</button></div><div id="out"></div>
<h2>Контроль питомцев (вне фрагмента Оружия)</h2><button id="petrun">Сравнить режимы а/б/в</button><div id="pets"></div>
<h2>Обычное сохранение</h2><button id="normal">Проверить (только чтение)</button><p id="normalout"></p>
'''
html = markup + '<style>' + css + '</style>' + ''.join('<script>' + part + '</script>' for part in (engine, ui, skin, controls, panels)) + '</html>'
out = root / 'preview' / 'arms-proto.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print('Built', out, len(html.encode()), 'bytes; sha256', hashlib.sha256(html.encode()).hexdigest())
