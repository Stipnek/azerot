"""Build the WoW Classic talent window edit from data and vendored art.

Inputs (owner decision 2026-11-27: original Classic look, one window for every class):
  src/talents/<class>.json      trees: background id, live rules, node rows/cols/icons
  src/assets/talents/frame.png  Classic talent frame (384x512), rank.png rank border
  src/assets/talents/bg-<id>.jpg Wowhead classic talent backgrounds; icons/<name>.jpg talent icons
Output: src/scripts/script-06.~~~~~~~talent-window.edits.json (data URIs inlined; the game fetches nothing).
To add a class: add src/talents/<class>.json with its backgrounds and node layout, vendor the art, rerun.
Run: python3 scripts/build_talent_window.py [--check]
World of Warcraft artwork is copyright Blizzard Entertainment (see src/assets/talents/NOTICE.md); no licence is granted.
"""
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'src/assets/talents'
OUT = ROOT / 'src/scripts/script-06.~~~~~~~talent-window.edits.json'
SOURCE_SHA256 = 'd6b8884a64eac761cbb061e28a3cfe001324a01b19917a813ae6bb6c1a0879c3'


def uri(path):
    kind = 'image/png' if path.suffix == '.png' else 'image/jpeg'
    return 'data:' + kind + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def window_data():
    classes, icons = {}, {}
    for path in sorted((ROOT / 'src/talents').glob('*.json')):
        spec = json.loads(path.read_text(encoding='utf-8'))
        trees = []
        for tree in spec['trees']:
            bg = ART / ('bg-%d.jpg' % tree['background'])
            if not bg.exists():
                raise SystemExit('Missing background ' + bg.name)
            nodes = []
            for node in tree['nodes']:
                icon = ART / 'icons' / (node['icon'] + '.jpg')
                if not icon.exists():
                    raise SystemExit('Missing icon ' + icon.name)
                icons[node['icon']] = uri(icon)
                if not (1 <= node['row'] <= 7 and 1 <= node['col'] <= 4):
                    raise SystemExit('Node outside the 7x4 grid: ' + node['id'])
                nodes.append({k: node[k] for k in ('id', 'row', 'col', 'icon', 'max', 'name', 'req') if k in node})
            trees.append({'id': tree['id'], 'name': tree['name'], 'live': tree.get('live'), 'bg': uri(bg), 'nodes': nodes})
        classes[spec['class']] = {'trees': trees}
    return {'art': {'frame': uri(ART / 'frame.png'), 'rank': uri(ART / 'rank.png')}, 'icons': icons, 'classes': classes}


JS = r"""
  /* TALENT_WINDOW_BEGIN — окно талантов в виде WoW Classic (владелец, 27 ноября): одно окно для просмотра и распределения очков.
     Вид и раскладка берутся из данных (src/talents/<класс>.json → scripts/build_talent_window.py): для нового класса нужны только
     фон ветки и позиции талантов. Живые ветки меняют очки по правилам движка (B.armsIntegrated) и сохраняют их как раньше. */
  const TALENT_WINDOW = __TALENT_DATA__;
  let talentDlg = null;
  function talentTrees() { return (TALENT_WINDOW.classes[S.main] || {}).trees || []; }
  function talentRules(tree) { return tree && tree.live === 'armsIntegrated' ? B.armsIntegrated : null; }
  function talentLive(tree) { return !!talentRules(tree) && ARMS_HERO_MODE && S.main === 'warrior' && specKey('me') === 'arms'; }
  function talentNodes(tree) {
    const P = talentRules(tree);
    return tree.nodes.map(function (n) {
      const e = P && P.TREE.find(function (x) { return x.id === n.id; });
      return { id: n.id, row: n.row, col: n.col, icon: n.icon, max: e ? e.max : n.max, name: e ? e.ru : n.name, req: e ? e.req : n.req,
        unavailable: !!(e && P.CONFIG.unavailable.indexOf(n.id) !== -1) };
    });
  }
  function talentState(tree) {
    const live = talentLive(tree), P = talentRules(tree), level = hLevel('me');
    const alloc = live ? armsHeroData(S.hero, level) : {};
    const v = live ? P.validate(alloc, level) : null;
    return { live: live, P: P, level: level, alloc: alloc, spent: v && v.ok ? v.spent : 0, budget: live ? P.points(level) : 0 };
  }
  function talentStyle() {
    if (document.getElementById('az-talent-style')) return;
    const A = TALENT_WINDOW.art, s = document.createElement('style'); s.id = 'az-talent-style';
    s.textContent = '.az-talents{position:fixed;inset:0;margin:0;width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;box-sizing:border-box;padding:8px;border:0;background:#0b0906;color:#e8d9b5;overflow:hidden}'
      + '.az-talents::backdrop{background:#000c}.tw-wrap{display:flex;gap:12px;align-items:flex-start;justify-content:center;height:100%}.tw-wrap.tw-col{flex-direction:column;align-items:center;justify-content:flex-start;gap:8px}'
      + '.tw-box{position:relative;flex:0 0 auto}.tw-frame{position:absolute;left:0;top:0;width:362px;height:442px;overflow:hidden;transform-origin:0 0;background:url(' + A.frame + ') 0 0/384px 512px no-repeat}'
      + '.tw-title{position:absolute;left:75px;top:13px;width:246px;margin:0;text-align:center;font:bold 14px/20px Georgia,serif;color:#ffd100;text-shadow:1px 1px #000}'
      + '.tw-status{position:absolute;left:75px;top:48px;width:246px;margin:0;text-align:center;font:11px/20px Arial,sans-serif;color:#ffd100;text-shadow:1px 1px #000}'
      + '.tw-tree{position:absolute;left:23px;top:77px;width:296px;height:332px;background-size:296px 332px;background-repeat:no-repeat;overflow:hidden}'
      + '.tw-tree svg{position:absolute;inset:0;width:296px;height:332px;pointer-events:none}'
      + '.tw-node{position:absolute;width:36px;height:36px;padding:0;margin:0;border:0;background:#000;cursor:pointer;box-shadow:0 0 0 1px #000,0 0 0 2px #7f7f7f}'
      + '.tw-node img{display:block;width:36px;height:36px}.tw-node.tw-off img{filter:grayscale(1) brightness(.55)}'
      + '.tw-node.tw-can,.tw-node.tw-on{box-shadow:0 0 0 1px #000,0 0 0 2px #1eff00}.tw-node.tw-max{box-shadow:0 0 0 1px #000,0 0 0 2px #ffd100}'
      + '.tw-node.tw-sel{outline:2px solid #fff;outline-offset:2px}.tw-node:focus-visible{outline:2px solid #fff;outline-offset:2px}'
      + '.tw-node span{position:absolute;right:-13px;bottom:-13px;width:32px;height:32px;background:url(' + A.rank + ') 0 0/32px 32px no-repeat;font:bold 10px/32px Arial,sans-serif;text-align:center;color:#1eff00;text-shadow:1px 1px #000;pointer-events:none}'
      + '.tw-node.tw-max span{color:#ffd100}.tw-node.tw-off span{color:#9d9d9d}'
      + '.tw-foot{position:absolute;left:45px;top:414px;width:280px;margin:0;text-align:center;font:11px/18px Arial,sans-serif;color:#ffd100;text-shadow:1px 1px #000}'
      + '.tw-portrait{position:absolute;left:13px;top:9px;width:60px;height:60px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:34px;background:#000}.tw-portrait img,.tw-portrait svg{width:100%;height:100%;object-fit:cover}'
      + '.tw-x{position:absolute;left:330px;top:8px;width:30px;height:30px;padding:0;border:1px solid #6b5a3c;border-radius:50%;background:#3a1208;color:#ffd100;font:bold 15px/28px Arial,sans-serif;cursor:pointer}'
      + '.tw-side{display:flex;flex-direction:column;gap:8px;width:min(340px,100%)}.tw-col .tw-side{width:min(384px,100%)}'
      + '.tw-tabs,.tw-bar{display:flex;gap:6px}.tw-tabs button,.tw-bar button{flex:1;min-height:40px;padding:6px 4px;border:1px solid #8c7047;border-radius:4px;background:#2b2116;color:#e9d9bb;font:13px/1.2 Georgia,serif;cursor:pointer}'
      + '.tw-tabs button[aria-pressed=true]{color:#ffd100;border-color:#d3b464;background:#3a2f1e}.tw-bar button[aria-disabled=true]{opacity:.45}'
      + '.tw-info{box-sizing:border-box;padding:10px 12px;border:2px solid #9e8a62;border-radius:5px;background:#0b0f1ef2;color:#fff;font:13px/1.45 Arial,sans-serif;box-shadow:0 5px 20px #000b}'
      + '.tw-col .tw-info{position:fixed;left:8px;right:8px;bottom:8px;z-index:2;max-height:45dvh;overflow:auto}'
      + '.tw-info h3{margin:0 0 2px;font:bold 15px/1.3 Arial,sans-serif;color:#fff}.tw-info p{margin:4px 0}.tw-info .tw-desc{color:#ffd100}.tw-info .tw-need{color:#ff2020}.tw-info .tw-msg{color:#ff9f6b}'
      + '.tw-info .tw-acts{display:flex;gap:6px;margin-top:8px}.tw-info .tw-acts button{flex:1;min-height:40px;border:1px solid #8c7047;border-radius:4px;background:#2b2116;color:#e9d9bb;font:13px Georgia,serif}.tw-info .tw-acts button[aria-disabled=true]{opacity:.45}';
    document.head.append(s);
  }
  function talentRender() {
    const d = talentDlg, tree = talentTrees().find(function (t) { return t.id === d.tree; }), s0 = talentState(tree), nodes = talentNodes(tree), I = TALENT_WINDOW.icons;
    const pos = function (n) { return { x: 37 + (n.col - 1) * 74, y: 32 + (n.row - 1) * 45 }; };
    const cell = function (n) {
      const r = s0.alloc[n.id] || 0, can = s0.live && s0.P.change(s0.alloc, n.id, 1, s0.level).ok, p = pos(n);
      const cls = r >= n.max ? 'max' : r > 0 ? 'on' : can ? 'can' : 'off';
      return '<button type="button" class="tw-node tw-' + cls + (d.sel === n.id ? ' tw-sel' : '') + '" data-tw-node="' + esc(n.id) + '" style="left:' + (p.x - 18) + 'px;top:' + (p.y - 18) + 'px" aria-label="' + esc(n.name + ': ранг ' + r + ' из ' + n.max) + '"><img alt="" src="' + I[n.icon] + '"><span>' + r + '/' + n.max + '</span></button>';
    };
    const arrows = nodes.filter(function (n) { return n.req; }).map(function (n) {
      const from = nodes.find(function (x) { return x.id === n.req; }); if (!from) return '';
      const a = pos(from), b = pos(n), lit = (s0.alloc[from.id] || 0) >= from.max;
      const path = from.col === n.col ? 'M' + a.x + ' ' + (a.y + 20) + ' V' + (b.y - 22) : 'M' + (a.x + 20) + ' ' + a.y + ' H' + b.x + ' V' + (b.y - 22);
      return '<path d="' + path + ' m-5 -6 l5 6 5 -6" fill="none" stroke="' + (lit ? '#ffd100' : '#8a8a8a') + '" stroke-width="3" stroke-linecap="round"/>';
    }).join('');
    const sel = nodes.find(function (n) { return n.id === d.sel; });
    let info = '';
    if (sel) {
      const r = s0.alloc[sel.id] || 0, need = 5 * (sel.row - 1), above = nodes.filter(function (n) { return n.row < sel.row; }).reduce(function (t, n) { return t + (s0.alloc[n.id] || 0); }, 0);
      const req = sel.req && nodes.find(function (n) { return n.id === sel.req; });
      const desc = !s0.live ? 'Ветка «' + tree.name + '» пока только для просмотра: её таланты появятся позже.' : sel.unavailable ? 'Этот талант пока недоступен.' : armsHeroEffect(sel.id);
      const add = s0.live && s0.P.change(s0.alloc, sel.id, 1, s0.level).ok, del = s0.live && s0.P.change(s0.alloc, sel.id, -1, s0.level).ok;
      info = '<div class="tw-info" role="dialog" aria-label="' + esc(sel.name) + '"><h3>' + esc(sel.name) + '</h3><p>Ранг ' + r + '/' + sel.max + '</p><p class="tw-desc">' + esc(desc) + '</p>'
        + (need && above < need && s0.live ? '<p class="tw-need">Нужно ' + need + ' очков в ветке выше (сейчас ' + above + ').</p>' : '')
        + (req && (s0.alloc[req.id] || 0) < req.max ? '<p class="tw-need">Требуется: ' + esc(req.name) + ' ' + req.max + '/' + req.max + '.</p>' : '')
        + (d.msg ? '<p class="tw-msg" role="status">' + esc(d.msg) + '</p>' : '')
        + (s0.live ? '<div class="tw-acts"><button type="button" data-tw-add aria-disabled="' + !add + '">Добавить ранг</button><button type="button" data-tw-del aria-disabled="' + !del + '">Убрать ранг</button><button type="button" data-tw-hide>Скрыть</button></div>' : '<div class="tw-acts"><button type="button" data-tw-hide>Скрыть</button></div>') + '</div>';
    }
    const status = s0.live ? (s0.level < 15 ? 'Таланты откроются на 15 уровне' : 'Свободно очков: ' + Math.max(0, s0.budget - s0.spent)) : (talentRules(tree) ? 'Распределение — когда эта ветка станет вашей' : 'Только просмотр · скоро');
    d.innerHTML = '<div class="tw-wrap"><div class="tw-box"><div class="tw-frame"><h2 class="tw-title">' + esc(tree.name) + '</h2><p class="tw-status">' + esc(status) + '</p>'
      + '<div class="tw-portrait" aria-hidden="true">' + classBadge(S.main, specKey('me')) + '</div>'
      + '<button type="button" class="tw-x" data-tw-close aria-label="Закрыть таланты">✕</button>'
      + '<div class="tw-tree" style="background-image:url(' + tree.bg + ')"><svg aria-hidden="true">' + arrows + '</svg>' + nodes.map(cell).join('') + '</div>'
      + '<p class="tw-foot">' + (s0.live ? 'Потрачено в ветке: ' + s0.spent + ' из ' + s0.budget : 'Уровень ' + s0.level) + '</p></div></div>'
      + '<div class="tw-side"><div class="tw-tabs" role="group" aria-label="Ветки талантов">' + talentTrees().map(function (t) { return '<button type="button" data-tw-tab="' + esc(t.id) + '" aria-pressed="' + (t.id === tree.id) + '">' + esc(t.name) + '</button>'; }).join('') + '</div>'
      + '<div class="tw-bar">' + (s0.live ? '<button type="button" data-tw-reset aria-disabled="' + !s0.spent + '">Сбросить очки</button>' : '') + '<button type="button" data-tw-close>Закрыть</button></div>'
      + (sel ? '' : (d.msg ? '<p class="tw-msg" role="status">' + esc(d.msg) + '</p>' : '<p class="hint" style="color:#b6a98d;margin:0">Нажмите на талант, чтобы увидеть описание' + (s0.live ? ' и вложить очко' : '') + '.</p>')) + info + '</div></div>';
    talentFit();
  }
  function talentFit() {
    const d = talentDlg; if (!d) return;
    const box = d.querySelector('.tw-box'), side = d.querySelector('.tw-side'), wrap = d.querySelector('.tw-wrap'); if (!box) return;
    const W = Math.max(200, innerWidth - 16), H = Math.max(200, innerHeight - 16), col = W < 700 && W / H < 1.15;
    wrap.classList.toggle('tw-col', col);
    let s;
    if (col) { const used = d.querySelector('.tw-tabs').offsetHeight + d.querySelector('.tw-bar').offsetHeight + 24; s = Math.min(W / 352, (H - used) / 442); }
    else s = Math.min((W - Math.min(340, Math.max(220, W * 0.3)) - 12) / 352, H / 442);
    s = Math.max(0.45, Math.min(1.6, s));
    box.style.width = Math.floor(352 * s) + 'px'; box.style.height = Math.floor(442 * s) + 'px'; /* видимая часть рамки 352x442 */
    d.querySelector('.tw-frame').style.transform = 'scale(' + s + ')';
  }
  function talentChange(delta, reset) {
    const d = talentDlg, tree = talentTrees().find(function (t) { return t.id === d.tree; }), s0 = talentState(tree);
    if (!s0.live) return;
    if (st && !st.over) { d.msg = 'Таланты нельзя менять во время боя.'; return talentRender(); }
    const r = reset ? { ok: true, alloc: {} } : s0.P.change(s0.alloc, d.sel, delta, s0.level);
    if (!r.ok) { d.msg = delta < 0 ? 'Этот ранг нужен талантам ниже. Сначала снимите их.' : ((r.errors && r.errors[0]) || 'Сейчас это изменение недоступно.'); return talentRender(); }
    const had = Object.prototype.hasOwnProperty.call(S.hero, 'armsTalents'), old = S.hero.armsTalents;
    S.hero.armsTalents = Object.fromEntries(Object.entries(r.alloc));
    if (!save()) { if (had) S.hero.armsTalents = old; else delete S.hero.armsTalents; d.msg = 'Не удалось сохранить. Изменение отменено.'; return talentRender(); }
    d.changed = true; d.msg = reset ? 'Очки сброшены.' : ''; talentRender();
  }
  function talentClick(ev) {
    const t = ev.target.closest('button'); if (!t || !talentDlg.contains(t)) return;
    if (t.hasAttribute('data-tw-close')) { talentDlg.close(); return; }
    if (t.dataset.twTab) { talentDlg.tree = t.dataset.twTab; talentDlg.sel = null; talentDlg.msg = ''; talentRender(); return; }
    if (t.dataset.twNode) { talentDlg.sel = t.dataset.twNode; talentDlg.msg = ''; talentRender(); const b = talentDlg.querySelector('[data-tw-node="' + t.dataset.twNode + '"]'); if (b) b.focus({ preventScroll: true }); return; }
    if (t.hasAttribute('data-tw-hide')) { talentDlg.sel = null; talentDlg.msg = ''; talentRender(); return; }
    if (t.getAttribute('aria-disabled') === 'true') return;
    if (t.hasAttribute('data-tw-add')) talentChange(1);
    else if (t.hasAttribute('data-tw-del')) talentChange(-1);
    else if (t.hasAttribute('data-tw-reset')) talentChange(0, true);
  }
  function openTalentWindow(id, trigger) {
    if (!S.hero || !talentTrees().length) return openHeroTree(id, trigger);
    if (!talentDlg) {
      talentDlg = document.createElement('dialog'); talentDlg.className = 'az-talents'; talentDlg.setAttribute('aria-label', 'Таланты');
      document.body.append(talentDlg); talentStyle();
      talentDlg.addEventListener('click', talentClick);
      talentDlg.addEventListener('close', function () { const ret = talentDlg.ret, launch = ret && ret.closest && ret.closest('[data-tw-launch]'); if (talentDlg.changed) { talentDlg.changed = false; renderHero(); } const back = ret && ret.isConnected ? ret : document.querySelector(launch ? '#w-hero [data-tw-launch] [data-tree-view]' : '#w-hero [data-tree-view]'); if (back) setTimeout(function () { if (back.isConnected) back.focus({ preventScroll: true }); }, 0); });
      addEventListener('resize', talentFit);
    }
    const trees = talentTrees();
    talentDlg.tree = trees.some(function (t) { return t.id === id; }) ? id : trees[0].id; talentDlg.sel = null; talentDlg.msg = '';
    if (!talentDlg.open) { talentDlg.ret = trigger; talentDlg.showModal(); }
    talentRender();
  }
  function talentLauncher() {
    const tree = talentTrees().find(function (t) { return talentLive(t); }); if (!tree) return '';
    const s0 = talentState(tree);
    return '<section class="box" data-tw-launch><p class="sect">Таланты</p><p class="hint">' + (s0.level < 15 ? 'Откроются на 15 уровне.' : 'Очки: ' + s0.spent + ' / ' + s0.budget + '.') + '</p><button type="button" class="btn" data-tree-view="' + esc(tree.id) + '">Открыть таланты</button></section>';
  }
  /* TALENT_WINDOW_END */
"""


def build():
    data = json.dumps(window_data(), ensure_ascii=False, separators=(',', ':'))
    if '</script' in data.lower():
        raise SystemExit('Unsafe data')
    js = JS.replace('__TALENT_DATA__', data)
    return {
        'sourceSha256': SOURCE_SHA256,
        'description': 'Owner 2026-11-27: one WoW Classic talent window (original frame, tree backgrounds and icons) for viewing and allocating talents, built from src/talents/*.json by scripts/build_talent_window.py. The hero tree buttons and the old Arms panel both open it; allocation uses the engine rules and saves like before.',
        'edits': [
            {'name': 'Talent window module', 'old': '  /* HERO_TREE_VIEW_END */\n', 'new': '  /* HERO_TREE_VIEW_END */\n' + js},
            {'name': 'Tree buttons open the talent window', 'old': 'openHeroTree(tree.dataset.treeView,tree); return; }', 'new': 'openTalentWindow(tree.dataset.treeView,tree); return; }'},
            {'name': 'Hero tab shows a launcher instead of the old Arms panel', 'old': "(armsLoadout('me').neutralTraining === true ? '' : armsHeroPanel())", 'new': "(armsLoadout('me').neutralTraining === true ? '' : talentLauncher())"},
        ],
    }


if __name__ == '__main__':
    text = json.dumps(build(), ensure_ascii=False, indent=1) + '\n'
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != text:
            raise SystemExit('Talent window edit is out of date: run python3 scripts/build_talent_window.py')
        print('talent window edit up to date')
    else:
        OUT.write_text(text, encoding='utf-8')
        print('wrote', OUT.relative_to(ROOT), len(text), 'bytes')
