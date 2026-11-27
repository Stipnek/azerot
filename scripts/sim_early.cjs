'use strict';
// PLAY-11/12 report (not a regression gate): early solo fights in the neutral training kit, levels 1-14.
// Hero alone, no gear, own level = enemy level, enemies of the zone at that level (as sim_campaign.cjs feel section), solo enemy curve applied.
// Per class: hero turns until the first enemy dies (information; the BAL-04 target of 3-5 hits per enemy is checked by sim_campaign.cjs --only feel), share of the hero's damage from auto-attack
// (target: melee 55-65%, casters spell 75-85% => auto 15-25%), HP lost against two enemies (target about half, 40-65%).
// Run: node scripts/sim_early.cjs [N=40] [--levels 1,2,3,4,5]   TRAIN_SHAPE='{"warrior":{"auto":3,"skill":0.5}}' and SOLO_CURVE (see sim_campaign.cjs) override for one run.
const B = require('./lib_engine_load.cjs')();
const args = process.argv.slice(2), N = +args.find(a => /^\d+$/.test(a)) || 40;
const LV = args.includes('--levels') ? args[args.indexOf('--levels') + 1].split(',').map(Number) : [1, 2, 3, 4, 5, 6, 8, 10, 12, 14];
if (process.env.TRAIN_SHAPE) for (const [k, v] of Object.entries(JSON.parse(process.env.TRAIN_SHAPE))) Object.assign(B.neutralTraining.shape[k], v);
if (process.env.SOLO_CURVE) Object.assign(B.SOLO_ENEMY_CURVE, JSON.parse(process.env.SOLO_CURVE));
const CLS = ['warrior', 'paladin', 'rogue', 'hunter', 'druid', 'priest', 'mage', 'warlock'], MELEE = new Set(['warrior', 'paladin', 'rogue', 'hunter']);
const PET = { hunter: 'wolf', warlock: 'imp' };
const MOBS = { 1: ['wolf', 'thief'], 2: ['kobold', 'wolf'], 3: ['kobold', 'boar'], 4: ['kobold', 'thief'], 5: ['kobold', 'gnollRunt'], 6: ['murloc', 'boar'], 7: ['murloc', 'kobold'],
  8: ['murloc', 'wolf'], 9: ['thief', 'murloc'], 10: ['goretusk', 'gnollRunt'], 11: ['looter', 'harvester'], 12: ['looter', 'gnollMiner'], 13: ['murlocWarrior', 'looter'], 14: ['murlocWarrior', 'pillager'] };
B.ENCOUNTERS.__early = { name: 'sim', place: 'sim', type: 'solo', size: 1, level: 1, enemies: [] };
function run(cls, L, enemies, seed) {
  const e = B.ENCOUNTERS.__early; e.level = L; e.enemies = enemies;
  const st = B.createBattle({ encounter: '__early', level: L, main: cls, seed, party: [{ cls, spec: B.CLASSES[cls].def, level: L, main: true, neutralTraining: true, race: 'human', pet: PET[cls] }] });
  const m = st.heroes[0], first = st.enemies[0]; let turns = 0, firstTurns = null, auto = 0, all = 0, g = 0;
  while (!st.over && g++ < 8000) for (const x of B.step(st)) {
    if (x.t === 'turn' && x.id === m.id) turns++;
    if (x.t === 'dmg' && x.src === m.id && x.amt) { all += x.amt; if (x.auto) auto += x.amt; }
    if (firstTurns === null && first.hp <= 0) firstTurns = turns;
  }
  return { win: st.result === 'win', lost: st.result === 'win' ? 1 - Math.max(0, m.hp) / m.maxHp : 1, firstTurns, auto, all };
}
const pct = x => String(Math.round(x * 100)).padStart(3) + '%';
console.log('level class    | turns/1st kill | auto share | 2 enemies: HP lost, win');
for (const L of LV) for (const cls of CLS) {
  let t = 0, tn = 0, auto = 0, all = 0, lost = 0, win = 0, n2 = 0;
  for (const mob of MOBS[L]) for (let s = 0; s < N; s++) {
    const a = run(cls, L, [mob], s * 7919 + 13); if (a.firstTurns !== null) { t += a.firstTurns; tn++; } auto += a.auto; all += a.all;
    const b = run(cls, L, [mob, mob], s * 7919 + 17); lost += b.lost; win += b.win; n2++;
  }
  const share = auto / all, okS = MELEE.has(cls) ? share >= 0.5 && share <= 0.7 : share >= 0.12 && share <= 0.3, okL = lost / n2 >= 0.38 && lost / n2 <= 0.66;
  console.log(`L${String(L).padEnd(3)} ${cls.padEnd(8)} | ${(t / tn).toFixed(1).padStart(5)}          | ${pct(share)} ${okS ? 'ok' : '--'}    | ${pct(lost / n2)} ${okL ? 'ok' : '--'} ${pct(win / n2)}`);
}
