'use strict';
// Balance REPORT (not a regression gate): real engine battles for every class at the expected stage.
// Run: node scripts/sim_enemy_curve.cjs [N=200] [maxLevel=30] [--json out.json]
// Seeds: seed = s*7919+13 for s in 0..N-1 (reproducible).
const B = require('./lib_engine_load.cjs')();
const args = process.argv.slice(2);
const N = +args[0] || 200, MAXL = +args[1] || 30;
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
if (process.env.ENEMY_CURVE) { if (!B.ENEMY_CURVE) throw new Error('ENEMY_CURVE override needs the enemy-curve edit'); Object.assign(B.ENEMY_CURVE, JSON.parse(process.env.ENEMY_CURVE)); }
if (B.ENEMY_CURVE) console.log('Enemy curve: ' + JSON.stringify(B.ENEMY_CURVE) + '\n');
const ONLY = process.env.ONLY_SOLO_EARLY === '1';
const CLS = ['warrior', 'paladin', 'druid', 'priest', 'mage', 'hunter', 'rogue', 'warlock'];
const PET = { hunter: 'wolf', warlock: 'imp' };
function ddSpecs(cls) { const c = B.CLASSES[cls]; return Object.keys(c.specs).filter(k => c.specs[k].role === 'dd'); }
function mainOf(cls, L) {
  if (L < 15) return [{ cls, spec: B.CLASSES[cls].def, level: L, main: true, neutralTraining: true, race: 'human', pet: PET[cls] }];
  return ddSpecs(cls).map(spec => ({ cls, spec, level: L, main: true, race: 'human', pet: PET[cls] }));
}
function party(main, enc, L, full) {
  if (enc.size === 1) return [main];
  // Early game (below 10): only the free onboarding companion (script-06 v57Hire: priest holy for a warrior main, else warrior prot).
  const free = main.cls === 'warrior' ? { cls: 'priest', spec: 'holy', level: L } : { cls: 'warrior', spec: 'prot', level: L };
  if (L < 10 && enc.size < 5 && !full) return [main, free];
  const p = [main, { cls: 'warrior', spec: 'prot', level: L }, { cls: 'priest', spec: 'holy', level: L }];
  if (enc.size >= 5) p.push({ cls: 'mage', spec: 'fire', level: L }, { cls: 'rogue', spec: 'combat', level: L });
  return p;
}
function battle(opts) { const st = B.createBattle(opts); let g = 0; while (!st.over && g++ < 8000) B.step(st); return st; }
function run(encKey, mk, L, full) {
  let win = 0, hp = 0, acts = 0, timeout = 0;
  for (let s = 0; s < N; s++) {
    const st = battle({ encounter: encKey, level: L, main: mk.cls, seed: s * 7919 + 13, party: party(mk, B.ENCOUNTERS[encKey], L, full) });
    const m = st.heroes[0];
    if (st.result === 'win') { win++; hp += Math.max(0, m.hp) / m.maxHp; }
    if (st.result !== 'win' && st.result !== 'lose') timeout++;
    acts += st.actions;
  }
  return { win: win / N, hp: win ? hp / win : 0, acts: acts / N, timeout: timeout / N };
}
function worst(encKey, L, full) {
  let w = null; const per = {};
  for (const cls of CLS) {
    for (const mk of mainOf(cls, L)) {
      const r = run(encKey, mk, L, full); const id = cls + (L >= 15 ? ':' + mk.spec : '');
      per[id] = r; if (!w || r.win < w.win || (r.win === w.win && r.hp < w.hp)) w = Object.assign({ id }, r);
    }
  }
  return { worst: w, per };
}
const rows = [];
const fmt = x => (100 * x).toFixed(0) + '%';
const skip = new Set(['test']);
const encs = Object.entries(B.ENCOUNTERS).filter(([k, e]) => !skip.has(k) && e.type !== 'talk' && e.enemies.length && e.level <= MAXL && !e.enemies.some(x => /dummy/.test(x)));
encs.sort((a, b) => a[1].level - b[1].level);
console.log('| encounter | lvl | type | hero lvl | worst class | worst win | worst HP left | avg actions | timeouts | classes <95% |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const [k, e] of encs) {
  if (ONLY && (e.level > 14 || e.type === 'dungeon')) continue;
  const hl = [e.level]; if (e.type === 'solo' && e.level <= 9 && e.level > 1) hl.push(e.level - 1);
  const variants = [];
  for (const L of hl) { variants.push([L, false]); if (e.size >= 3 && e.size < 5 && L < 10) variants.push([L, true]); }
  for (const [L, full] of variants) {
    const r = worst(k, L, full), w = r.worst, bad = Object.entries(r.per).filter(([, v]) => v.win < 0.95).map(([c, v]) => c + ' ' + fmt(v.win));
    const label = e.size === 1 ? e.type + '/1' : e.type + '/' + e.size + (e.size < 5 && L < 10 ? (full ? ' (3 героя)' : ' (2 героя)') : '');
    rows.push({ enc: k, level: e.level, type: e.type, size: e.size, heroLevel: L, party: full ? 3 : undefined, worst: w, per: r.per });
    console.log('| ' + [k, e.level, label, L, w.id, fmt(w.win), fmt(w.hp), w.acts.toFixed(0), fmt(w.timeout), bad.join(', ') || '—'].join(' | ') + ' |');
  }
}
// Ambush: the game's road encounter (script-06 ambush()): solo, enemies at hero level, 1..3 of one pool type.
const POOLS = { elwynn: ['wolf', 'kobold', 'thief', 'boar', 'murloc', 'gnollRunt'], westfall: ['goretusk', 'vulture', 'looter'] };
const CAP = { gnollRunt: 2, boar: 2, thief: 2, goretusk: 2, looter: 2 };
console.log('\n| ambush | hero lvl | enemy | count | worst class | worst win | worst HP left | classes <95% |\n|---|---|---|---|---|---|---|---|');
for (const L of [1, 2, 3, 5, 7, 9, 10, 12, 14]) {
  const pool = L < 10 ? POOLS.elwynn : POOLS.westfall;
  for (const sp of pool) {
    if (!B.ENEMIES[sp]) continue;
    for (let n = 1; n <= (CAP[sp] || 3); n++) {
      B.ENCOUNTERS.__amb = { room: true, enrage: { after: 100, every: 10, step: 0.15 }, name: 'amb', type: 'solo', size: 1, level: L, enemies: Array(n).fill(sp) };
      const r = worst('__amb', L), w = r.worst, bad = Object.entries(r.per).filter(([, v]) => v.win < 0.95).map(([c, v]) => c + ' ' + fmt(v.win));
      rows.push({ enc: 'ambush:' + sp + 'x' + n, level: L, type: 'ambush', size: 1, heroLevel: L, worst: w, per: r.per });
      console.log('| ' + ['ambush', L, sp, n, w.id, fmt(w.win), fmt(w.hp), bad.join(', ') || '—'].join(' | ') + ' |');
    }
  }
}
delete B.ENCOUNTERS.__amb;
if (jsonOut) require('node:fs').writeFileSync(jsonOut, JSON.stringify({ N, rows }, null, 1));
