"""Build the isolated Arms prototype harness: preview/arms-proto.html (test only, not published).
Embeds src/scripts/script-05.txt (combat engine) and scripts/arms_proto_ui.js."""
from pathlib import Path
import hashlib
root = Path(__file__).resolve().parents[1]
engine = (root / 'src' / 'scripts' / 'script-05.txt').read_text(encoding='utf-8')
ui = (root / 'scripts' / 'arms_proto_ui.js').read_text(encoding='utf-8')
for part in (engine, ui):
    if '</script' in part.lower():
        raise SystemExit('Unsafe script terminator')
css = """:root{color-scheme:light dark;--bg:#f4efe4;--ink:#22180c;--muted:#6b5a44;--line:#c9b48a;--on:#2f6d2f;--un:#9a8f80}
@media (prefers-color-scheme:dark){:root{--bg:#1d1812;--ink:#efe6d4;--muted:#b9a785;--line:#5c4b30;--on:#7fd07f;--un:#6d655a}}
body{margin:0;padding:12px;font:15px/1.4 system-ui,sans-serif;background:var(--bg);color:var(--ink)}h1{font-size:19px;margin:0 0 4px}
.warn{border:1px solid var(--line);padding:6px 8px;border-radius:6px}.ctl{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}label{display:flex;gap:4px;align-items:center}
input[type=number]{width:4.5em}.row{display:flex;gap:6px;overflow-x:auto;margin:6px 0}.tier{min-width:58px;color:var(--muted);font-size:12px}
.node{border:1px solid var(--line);border-radius:6px;padding:5px;min-width:150px;max-width:190px;display:grid;grid-template-columns:1fr auto auto;gap:2px 4px;align-items:center}
.node b{grid-column:1/-1;font-size:13px}.node small{grid-column:1/-1;color:var(--muted);font-size:11px}.node.on{border-color:var(--on)}.node.un{opacity:.55}.node em{grid-column:1/-1;font-size:11px;color:var(--un)}
button{min-width:36px;min-height:32px}li.lock{color:var(--un)}pre{white-space:pre-wrap;font-size:12px}table{border-collapse:collapse}td,th{border:1px solid var(--line);padding:3px 6px}#err,#note{color:#b03a2e}"""
html = f"""<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Прототип Оружия — тест</title><style>{css}</style>
<h1>Прототип дерева Оружия (только тест)</h1>
<p class="warn">Изолированная тестовая страница. Отдельное сохранение <code>azerot.proto.arms.v1</code>; обычное сохранение игры не изменяется. Ограниченный прототип: часть узлов недоступна, это не готовое дерево Classic. Значения Глубоких ран, двуручной специализации и Размашистых ударов — предложения, не согласованный баланс.</p>
<div class="ctl"><label>Уровень мейна <input id="ml" type="number" min="1" max="30"></label><label>Уровень компаньона <input id="cl" type="number" min="1" max="30"></label>
<button id="presetA">Билд A (= линия)</button><button id="presetB">Билд B</button><button id="reset">Сбросить очки</button></div>
<p id="spec"></p><p id="pts"></p><p id="err"></p><p id="note"></p><div id="tree"></div>
<h2>Умения мейна</h2><ul id="kit"></ul>
<h2>Бои</h2><div class="ctl"><select id="enc"></select><label>боёв <input id="seeds" type="number" min="1" max="500"></label>
<label><input id="acc" type="checkbox"> эксперимент: аксессуар компаньону</label><select id="scale"><option value="A">шкала A 5–30%</option><option value="B">шкала B 2,5–15%</option></select><select id="tier"></select>
<button id="run">Запустить</button></div><div id="out"></div>
<h2>Контроль питомцев (вне фрагмента Оружия)</h2><button id="petrun">Сравнить режимы а/б/в</button><div id="pets"></div>
<h2>Обычное сохранение</h2><button id="normal">Проверить (только чтение)</button><p id="normalout"></p>
<script>{engine}</script><script>{ui}</script></html>"""
out = root / 'preview' / 'arms-proto.html'
out.write_text(html, encoding='utf-8')
print('Built', out, len(html.encode()), 'bytes; sha256', hashlib.sha256(html.encode()).hexdigest())
