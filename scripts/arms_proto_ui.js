/* Isolated Arms talent prototype harness (test only). Uses its own save key; never writes the normal game save. */
(function () {
  'use strict';
  const B = window.Battle, P = B.armsProto, $ = id => document.getElementById(id);
  const ENCS = [['daily_wf_coast', 3], ['dm_rhahk', 5], ['vancleef', 5], ['dw_worgen1', 3], ['dw_nightwatch', 3]];
  const SK = { heroicstrike: 'Удар героя', thunder: 'Удар грома', rend: 'Кровопускание', cleave: 'Рассекающий удар', execute: 'Казнь', slam: 'Мощный удар', sweeping: 'Размашистые удары', mortal: 'Смертельный удар' };
  let S = P.load(localStorage).state, notice = '';
  const save = () => { S = P.save(localStorage, S); };
  function tree() {
    const v = P.validate(S.main.talents, S.main.level), rows = [];
    for (let t = 1; t <= 7; t++) {
      const nodes = P.TREE.filter(n => n.tier === t).map(n => {
        const r = S.main.talents[n.id] || 0, un = P.CONFIG.unavailable.includes(n.id);
        const can = !un && P.change(S.main.talents, n.id, +1, S.main.level).ok, dec = r > 0 && P.change(S.main.talents, n.id, -1, S.main.level).ok;
        const why = un ? 'недоступно в прототипе' : can ? 'можно вложить' : r >= n.max ? 'максимум' : 'закрыто: ряд, предшественник или бюджет';
        return '<div class="node' + (un ? ' un' : r ? ' on' : '') + '" title="' + why + '"><b>' + n.ru + '</b><small>' + n.en + (n.active ? ' · активка' : '') + (n.req ? ' · нужен «' + P.TREE.find(x => x.id === n.req).ru + '»' : '') + '</small>' +
          '<span>' + r + '/' + n.max + '</span><button data-n="' + n.id + '" data-d="-1"' + (dec ? '' : ' disabled') + ' aria-label="Убрать ранг">−</button><button data-n="' + n.id + '" data-d="1"' + (can ? '' : ' disabled') + ' aria-label="Добавить ранг">+</button>' + (un ? '<em>недоступно в прототипе</em>' : '') + '</div>';
      }).join('');
      rows.push('<div class="row"><div class="tier">Ряд ' + t + '<br><small>с ' + 5 * (t - 1) + ' очк.</small></div>' + nodes + '</div>');
    }
    $('pts').textContent = 'Очки: ' + v.spent + ' / ' + v.budget + (S.main.level < 15 ? ' (таланты с 15 уровня)' : '');
    $('err').textContent = v.ok ? '' : v.errors.join('; ');
    $('tree').innerHTML = rows.join('');
  }
  function kit() {
    const lv = S.main.level, have = P.kit(lv, S.main.talents), all = P.CONFIG.trainingKit.concat(P.CONFIG.specKit);
    $('kit').innerHTML = all.map(x => '<li class="' + (have.includes(x[0]) ? '' : 'lock') + '">' + SK[x[0]] + ' — ' + x[1] + ' ур.' + (x[1] >= 15 ? ' (Оружие)' : ' (учебное)') + '</li>').join('') +
      ['sweeping', 'mortal'].map(id => '<li class="' + (have.includes(id) ? '' : 'lock') + '">' + SK[id] + ' — талант</li>').join('') +
      '<li>Компаньон: уровень ' + S.comp.level + ', линия: ' + (Object.entries(P.line(S.comp.level)).map(e => P.TREE.find(n => n.id === e[0]).ru + ' ' + e[1]).join(', ') || 'нет очков') + '</li>';
    $('spec').textContent = lv < 15 ? 'Учебный набор: таланты и спековая аура отключены до 15 уровня.' : 'Оружие (прототип).';
  }
  function party(size) {
    const acc = S.exp.acc ? P.ACC_SCALES[S.exp.scale][S.exp.tier] : 0;
    const p = [{ cls: 'warrior', spec: 'arms', level: S.main.level, main: true, proto: 'arms', talents: S.main.talents },
      { cls: 'warrior', spec: 'arms', level: S.comp.level, proto: 'arms', acc }, { cls: 'priest', spec: 'holy', level: S.main.level }];
    if (size === 5) p.push({ cls: 'paladin', spec: 'prot', level: S.main.level }, { cls: 'mage', spec: 'fire', level: S.main.level });
    return p;
  }
  function battle(opts) { const st = B.createBattle(opts); const ev = []; let g = 0; while (!st.over && g++ < 6000) { B.step(st); ev.push(...st.events); st.events.length = 0; } return { st, ev }; }
  function runSet() {
    const [enc, size] = ENCS.find(e => e[0] === S.enc); let win = 0, md = 0, cd = 0, deaths = 0, log = null;
    for (let s = 0; s < S.seeds; s++) {
      const r = battle({ encounter: enc, level: S.main.level, main: 'warrior', seed: s * 7919 + 13, party: party(size), experiment: S.exp.acc ? { acc: true } : undefined });
      if (r.st.protoErrors) { $('out').textContent = 'Билд отклонён: ' + r.st.protoErrors.join('; '); return; }
      if (r.st.result === 'win') win++; md += r.st.heroes[0].stats.dmg; cd += r.st.heroes[1].stats.dmg; deaths += r.st.heroes.filter(h => h.hp <= 0).length;
      if (!log) log = r;
    }
    const nm = id => (log.st.heroes.concat(log.st.enemies).find(x => x.id === id) || {}).name || id;
    const lines = log.ev.filter(e => (e.t === 'skill' && (log.st.heroes[0].id === e.src || log.st.heroes[1].id === e.src)) || e.t === 'proc').slice(0, 60)
      .map(e => e.t === 'skill' ? nm(e.src) + ': ' + (SK[e.skill] || e.skill) : '  ↳ ' + (e.proc === 'deepwounds' ? 'Глубокие раны от «' + (SK[e.via] || 'автоатаки') + '»' : 'Размашистые удары: вторая цель, осталось ' + e.left));
    $('out').innerHTML = '<p>' + enc + ', ' + S.seeds + ' боёв: победы ' + (100 * win / S.seeds).toFixed(1) + '%, урон мейна ' + Math.round(md / S.seeds) + ', компаньона ' + Math.round(cd / S.seeds) + ', смертей героев ' + (deaths / S.seeds).toFixed(2) + ' за бой.' + (S.exp.acc ? ' Эксперимент: аксессуар компаньону ' + (P.ACC_SCALES[S.exp.scale][S.exp.tier] * 100) + '%.' : '') + '</p><pre>' + lines.join('\n') + '</pre>';
  }
  function petControl() {
    const L = Math.max(10, S.main.level), modes = [['без эксперимента', undefined], ['(а) аксессуар', { acc: true }], ['(б) rb питомцу', { petRb: true }], ['(в) оба', { acc: true, petRb: true }]];
    const acc = P.ACC_SCALES[S.exp.scale][S.exp.tier];
    $('pets').innerHTML = '<table><tr><th>режим</th><th>победы</th><th>урон питомцев</th></tr>' + modes.map(([lab, exp]) => {
      let w = 0, pd = 0;
      for (let s = 0; s < S.seeds; s++) { const r = battle({ encounter: 'dw_nightwatch', level: L, main: 'warrior', seed: s * 7919 + 13, experiment: exp, party: [{ cls: 'warrior', spec: 'arms', level: L, main: true }, { cls: 'hunter', spec: 'bm', level: L, rb: 0.25, pet: 'wolf', acc }, { cls: 'warlock', spec: 'demo', level: L, rb: 0.25, pet: 'voidwalker', acc }] }); if (r.st.result === 'win') w++; pd += r.st.pets.reduce((a, p) => a + p.stats.dmg, 0); }
      return '<tr><td>' + lab + '</td><td>' + (100 * w / S.seeds).toFixed(1) + '%</td><td>' + Math.round(pd / S.seeds) + '</td></tr>';
    }).join('') + '</table>';
  }
  function render() {
    $('ml').value = S.main.level; $('cl').value = S.comp.level; $('enc').value = S.enc; $('seeds').value = S.seeds;
    $('acc').checked = S.exp.acc; $('scale').value = S.exp.scale; $('tier').value = S.exp.tier; $('note').textContent = notice; tree(); kit();
  }
  $('enc').innerHTML = ENCS.map(e => '<option value="' + e[0] + '">' + e[0] + ' (' + B.ENCOUNTERS[e[0]].level + ' ур., ' + e[1] + ' героев)</option>').join('');
  $('tier').innerHTML = P.ACC_TIERS.map((t, i) => '<option value="' + i + '">' + t + '</option>').join('');
  $('tree').addEventListener('click', ev => { const b = ev.target.closest('button[data-n]'); if (!b) return; const r = P.change(S.main.talents, b.dataset.n, +b.dataset.d, S.main.level); notice = r.ok ? '' : r.errors.join('; '); if (r.ok) S.main.talents = r.alloc; save(); render(); });
  $('ml').addEventListener('change', () => { S.main.level = Math.max(1, Math.min(30, +$('ml').value || 1)); const v = P.validate(S.main.talents, S.main.level); if (!v.ok) { S.main.talents = {}; notice = 'Билд сброшен с возвратом очков: ' + v.errors.join('; '); } save(); render(); });
  $('cl').addEventListener('change', () => { S.comp.level = Math.max(1, Math.min(30, +$('cl').value || 1)); save(); render(); });
  $('enc').addEventListener('change', () => { S.enc = $('enc').value; save(); });
  $('seeds').addEventListener('change', () => { S.seeds = Math.max(1, Math.min(500, +$('seeds').value || 50)); save(); });
  ['acc', 'scale', 'tier'].forEach(id => $(id).addEventListener('change', () => { S.exp = { acc: $('acc').checked, scale: $('scale').value, tier: +$('tier').value }; save(); render(); }));
  $('presetA').onclick = () => { S.main.talents = P.line(S.main.level); notice = ''; save(); render(); };
  $('presetB').onclick = () => { S.main.talents = P.buildAt(P.BUILD_B, S.main.level); notice = ''; save(); render(); };
  $('reset').onclick = () => { S.main.talents = {}; notice = ''; save(); render(); };
  $('run').onclick = runSet; $('petrun').onclick = petControl;
  $('normal').onclick = () => { const raw = localStorage.getItem('azeroth-ab-setup-v5'); $('normalout').textContent = raw ? 'Обычное сохранение найдено (' + raw.length + ' символов). Прототип его только прочитал и не изменял.' : 'Обычного сохранения в этом браузере нет.'; };
  render();
})();
