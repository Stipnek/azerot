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
for part in (engine, ui, skin):
    if '</script' in part.lower():
        raise SystemExit('Unsafe script terminator')
css = 'body{margin:0;padding:12px;font:15px/1.4 system-ui,sans-serif}h1{font-size:21px}.warn{border:1px solid #655139;padding:8px}.ctl{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}label{display:flex;gap:4px;align-items:center}input[type=number]{width:4.5em}button{min-width:36px;min-height:32px}pre{white-space:pre-wrap;font-size:12px}table{border-collapse:collapse}td,th{border:1px solid #655139;padding:3px 6px}.lock{opacity:.55}#err,#note{color:#ef9b79}'
markup = '''<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Оружие — тест дерева</title>
<h1>Оружие · тест дерева талантов</h1>
<p class="warn">Изолированный прототип, не live. Часть эффектов не реализована; экспериментальный баланс не согласован. Первый графический проход: фон пока не оригинальный, иконки загружаются с wow.zamimg.com. Звуки ещё не подключены. Обычное сохранение не изменяется.</p>
<div class="ctl"><label>Уровень мейна <input id="ml" type="number" min="1" max="30"></label><label>Уровень компаньона <input id="cl" type="number" min="1" max="30"></label><button id="presetA">Билд A (= линия)</button><button id="presetB">Билд B</button><button id="reset">Сбросить очки</button></div>
<p id="spec"></p><p id="pts" aria-live="polite"></p><p id="err" role="alert"></p><p id="note" aria-live="polite"></p><div id="tree" aria-label="Дерево талантов Оружие"></div>
<h2>Умения мейна</h2><ul id="kit"></ul>
<h2>Бои</h2><div class="ctl"><select id="enc" aria-label="Бой"></select><label>боёв <input id="seeds" type="number" min="1" max="500"></label><label><input id="acc" type="checkbox"> эксперимент: аксессуар компаньону</label><select id="scale" aria-label="Шкала"><option value="A">шкала A 5–30%</option><option value="B">шкала B 2,5–15%</option></select><select id="tier" aria-label="Качество"></select><button id="run">Запустить</button></div><div id="out"></div>
<h2>Контроль питомцев (вне фрагмента Оружия)</h2><button id="petrun">Сравнить режимы а/б/в</button><div id="pets"></div>
<h2>Обычное сохранение</h2><button id="normal">Проверить (только чтение)</button><p id="normalout"></p>
'''
html = markup + '<style>' + css + '</style>' + ''.join('<script>' + part + '</script>' for part in (engine, ui, skin)) + '</html>'
out = root / 'preview' / 'arms-proto.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print('Built', out, len(html.encode()), 'bytes; sha256', hashlib.sha256(html.encode()).hexdigest())
