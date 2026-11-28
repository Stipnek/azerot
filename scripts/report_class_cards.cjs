'use strict';
// Class cards REPORT (not a regression gate): one Markdown page with every class and specialization as the effective engine
// plays it, for the owner to read instead of play-testing every kit. Per spec: auto-attack, passives, every ability with its
// declared unlock level, cost, cooldown and text next to what battles show (casts per fight, damage per cast), effects that
// last the whole fight, and solo results against two same-level enemies. Lines marked ⚠ are worth a look.
// Run: node scripts/report_class_cards.cjs [--n 12] [--out preview/class-cards.md]
const fs = require('node:fs');
const path = require('node:path');
const P = require('./lib_class_probe.cjs');
const { B } = P;
const args = process.argv.slice(2);
const N = args.includes('--n') ? +args[args.indexOf('--n') + 1] : 12;
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : 'preview/class-cards.md';
const TRAIN_LEVELS = [1, 4, 6, 8, 10, 14], SPEC_LEVELS = [15, 20, 23, 25, 28, 30];
const ROLE = { dd: 'урон', tank: 'танк', heal: 'лечение' };
const pct = x => Math.round(x * 100) + '%';
const esc = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const cost = id => { const s = B.SKILLS[id] || {}; const parts = [];
  if (B.MANA_COST && B.MANA_COST[id] != null) parts.push('мана ' + B.MANA_COST[id]);
  if (s.rage != null || (B.RAGE_COST && B.RAGE_COST[id] != null)) parts.push('ярость ' + (B.RAGE_COST && B.RAGE_COST[id] != null ? B.RAGE_COST[id] : s.rage));
  if (B.ENERGY_COST && B.ENERGY_COST[id] != null) parts.push('энергия ' + B.ENERGY_COST[id]);
  return parts.join(', ') || '—'; };
const merge = ctx => { const casts = {}, dmg = {}; let fights = 0;
  for (const c of Object.values(ctx)) { fights += c.fights; for (const [k, v] of Object.entries(c.casts)) casts[k] = (casts[k] || 0) + v; for (const [k, v] of Object.entries(c.dmgBySkill)) dmg[k] = (dmg[k] || 0) + v; }
  return { casts, dmg, fights }; };

const lines = [];
const w = s => lines.push(s);
const commit = (() => { try { return require('node:child_process').execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch (e) { return '?'; } })();
w('# Карточки классов');
w('');
w(`Сгенерировано \`scripts/report_class_cards.cjs\` на коммите \`${commit}\`, ${N} боёв на точку. Это отчёт по движку (Node), а не браузерная проверка.`);
w('Герой собирается как в игре: главный герой до 15 ур. — учебный набор и стартовый комплект, с 15 — специализация (таланты: линия спутника); бои — против двух врагов своего уровня из зоны. ');
w('«Применений за бой» — сумма по контекстам: соло против двух, долгий бой против одного, долгий бой против трёх с танком и лекарем, своя роль в группе и тяжёлый бой (с 15). «Урон за применение» — суммарно по всем целям, в % от атаки героя, после брони врага.');
w('⚠ — стоит посмотреть: умение ни разу не применено, удар посохом при мане, эффект на весь бой (виден счётчик ~999).');
w('');

function abilityTable(rows) {
  w('| Умение | С ур. | Цена | Перезарядка | Текст в игре | Применений за бой | Урон за применение |');
  w('|---|---|---|---|---|---|---|');
  for (const r of rows) w(`| ${r.warn ? '⚠ ' : ''}${esc(r.name)} | ${r.at} | ${esc(r.cost)} | ${r.cd} | ${esc(r.text)} | ${r.per} | ${r.dmg} |`);
  w('');
}
function levelTable(rows) {
  w('| Ур. | Умения в бою | Автоатака | Удар посохом при мане > 20% | Эффекты на весь бой | Соло против двух: победы / потеря ХП |');
  w('|---|---|---|---|---|---|');
  for (const r of rows) w(`| ${r.L} | ${esc(r.skills)} | ${esc(r.auto)} | ${r.staff} | ${esc(r.perm)} | ${r.solo} |`);
  w('');
}
function section(cls, spec, levels, role) {
  const declaredAt = {}, stat = {}, rows = [];
  for (const L of levels) {
    const ctx = P.contexts(cls, spec, L, role, N), m = merge(ctx), s = ctx.solo2, perm = new Set();
    for (const c of Object.values(ctx)) for (const k of Object.keys(c.longEffects)) perm.add(k);
    Object.assign(declaredAt, P.declaredUnlocks(cls, spec, L, role));
    for (const id of s.skills) { const x = stat[id] || (stat[id] = { casts: 0, fights: 0, dmg: 0, atk: 0, firstL: L }); x.casts += m.casts[id] || 0; x.fights += m.fights; x.dmg += m.dmg[id] || 0; x.atk = s.atk; }
    const never = s.skills.filter(id => !m.casts[id] && id !== 'laststand');
    rows.push({ L, skills: s.skills.map(id => (never.includes(id) ? '⚠ ' : '') + ((B.SKILLS[id] || {}).name || id)).join(', ') || '—',
      auto: (s.autoName || '—') + (s.autoRanged ? ' (дальняя)' : ' (ближняя)'),
      staff: s.autoMeleeWithMana ? `⚠ ${s.autoMeleeWithMana} из ${s.autos}` : '—',
      perm: perm.size ? '⚠ ' + [...perm].join(', ') : '—', solo: `${pct(s.wins / s.fights)} / ${pct(s.hpLost / s.fights)}` });
  }
  levelTable(rows);
  const ids = Object.keys(Object.assign({}, declaredAt, stat));
  abilityTable(ids.map(id => { const sk = B.SKILLS[id] || {}, x = stat[id];
    return { name: sk.name || id, at: declaredAt[id] != null ? declaredAt[id] : (x ? 'талант / ' + x.firstL : '—'), cost: cost(id), cd: sk.cd != null ? sk.cd : '—', text: sk.text || '',
      per: x ? (x.casts / x.fights).toFixed(2) : 'не в бою', dmg: x && x.casts && x.dmg ? pct(x.dmg / x.casts / x.atk) : '—', warn: x && !x.casts && id !== 'laststand' }; }));
}

for (const cls of P.CLASSES) {
  const c = B.CLASSES[cls];
  w(`## ${c.name}`);
  w('');
  const wards = B.neutralTraining.wards[cls];
  w(`### Учебный набор (главный герой, 1–14 ур.)`);
  w('');
  w(`Автоатака: ${esc(P.probe({ party: [P.member(cls, c.def, 1, 'main')], L: 1, enemies: [P.mobFor(1)], n: 1 }).autoName)}. Множитель учебного набора: автоатака ×${(B.neutralTraining.shape[cls] || {}).auto || 1}, умения ×${(B.neutralTraining.shape[cls] || {}).skill || 1}${((B.neutralTraining.shape[cls] || {}).skill || 1) !== 1 ? ' — ⚠ тексты умений этого не учитывают' : ''}.` +
    (wards ? ` Оберег с ${wards.level} ур.: «${wards.name}» ${wards.icon} (${wards.armor ? '+' + pct(wards.armor) + ' брони' : ''}${wards.shield ? 'щит ' + pct(wards.shield) + ' ХП' : ''}) — ⚠ не показан во вкладке «Герой».` : ''));
  w('');
  section(cls, c.def, TRAIN_LEVELS, 'main');
  for (const [spec, sp] of Object.entries(c.specs)) {
    w(`### ${sp.name} (${ROLE[sp.role] || sp.role})`);
    w('');
    const auto = B.autoOf(cls, spec);
    w(`Автоатака: ${esc(auto.name)} (${auto.ranged ? 'дальняя' : 'ближняя'}). Пассивки: ${(sp.passives || []).map(p => `«${esc(p.name)}» — ${esc(String(p.text || '').replace(/\.$/, ''))}`).join('; ') || 'нет'}.`);
    const tools = B.CLASS_TOOLS && B.CLASS_TOOLS[cls + ':' + spec];
    if (tools) w(`Инструмент класса: ${esc(JSON.stringify(tools))} — ⚠ не показан во вкладке «Герой».`);
    w('');
    w('**Главный герой**');
    w('');
    section(cls, spec, SPEC_LEVELS, 'main');
    w('**Спутник** (сражается своей специализацией с 1 ур., PLAY-02)');
    w('');
    section(cls, spec, [1, 10, 15, 30], 'companion');
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n') + '\n');
console.log('Wrote ' + OUT + ' (' + lines.length + ' lines)');
