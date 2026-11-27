'use strict';
// Class audit REPORT (not a regression gate): every specialization in its own role at own levels 15/20/25/30.
// Run: node scripts/sim_class_audit.cjs [N=30]
// Solo (dd specs; tanks and healers too, since the main can be any spec): hero alone, no gear, vs two same-level enemies of the zone (BAL-05 rule: about half HP).
// Tank: fire mage main + this tank + holy priest vs a three-enemy group-quest pack of that level. Healer: prot warrior + fire mage main + this healer.
// Warrior Arms is fought as the game's integrated Arms (trainer kit, talent abilities on the companion talent line), as in hero mode; mains of specs with talent rules use that line as their build.
const B = require('./lib_engine_load.cjs')();
const N = +process.argv[2] || 30;
const MOBS = { 15: ['gnollMiner', 'tarantula', 'orcGrunt'], 20: ['gnollRunt', 'dw_spider', 'murlocWarrior'], 25: ['dw_wolf', 'dw_skeleton', 'gnollMiner'], 30: ['dw_wolf', 'dw_skeleton', 'dw_spider'] };
const PACK = { 15: 'rr_fangore', 20: 'rr_howler', 25: 'cl_watch1', 30: 'cl_watch3' };
const PET = { hunter: 'wolf', warlock: 'imp' };
const unit = (cls, spec, L, main) => { const u = { cls, spec, level: L, main: !!main, race: 'human', pet: PET[cls] };
  // TALENT-03: the main is given the companion talent line as its build (a reasonable player build); companions use the line in the engine.
  if (cls === 'warrior' && spec === 'arms') Object.assign(u, { proto: 'arms', integratedArms: true }, main ? { talents: B.armsIntegrated.line(L) } : {});
  const R = B.specTalents && B.specTalents.rules(cls, spec); if (R && main) u.talents = R.line(L);
  return u; };
B.ENCOUNTERS.__audit = { name: 'audit', place: 'audit', type: 'solo', size: 1, level: 15, enemies: [] };
function run(enc, enemies, party, L) {
  const e = B.ENCOUNTERS[enc], saved = e.enemies, savedL = e.level; e.enemies = enemies; if (enc === '__audit') e.level = L;
  let win = 0, lost = 0;
  try { for (let s = 0; s < N; s++) { const st = B.createBattle({ encounter: enc, level: L, main: party[0].cls, seed: s * 7919 + 13, party: JSON.parse(JSON.stringify(party)) });
    let g = 0; while (!st.over && g++ < 8000) B.step(st); const m = st.heroes[0]; if (st.result === 'win') { win++; lost += 1 - Math.max(0, m.hp) / m.maxHp; } else lost += 1; } }
  finally { e.enemies = saved; e.level = savedL; }
  return { win: win / N, lost: lost / N };
}
const pct = x => Math.round(x * 100) + '%';
const rows = [];
for (const [cls, c] of Object.entries(B.CLASSES)) for (const [spec, sp] of Object.entries(c.specs)) {
  const r = { key: cls + ':' + spec, role: sp.role, solo: [], role2: [] };
  for (const L of [15, 20, 25, 30]) {
    const solo = MOBS[L].map(m => run('__audit', [m, m], [unit(cls, spec, L, true)], L));
    r.solo.push({ win: solo.reduce((a, x) => a + x.win, 0) / solo.length, lost: solo.reduce((a, x) => a + x.lost, 0) / solo.length });
    const k = PACK[L], en = B.ENCOUNTERS[k].enemies.length >= 3 ? B.ENCOUNTERS[k].enemies.slice(0, 3) : Array(3).fill(B.ENCOUNTERS[k].enemies[0]);
    if (sp.role === 'tank') r.role2.push(run(k, en, [unit('mage', 'fire', L, true), unit(cls, spec, L), unit('priest', 'holy', L)], L));
    else if (sp.role === 'heal') r.role2.push(run(k, en, [unit('mage', 'fire', L, true), unit('warrior', 'prot', L), unit(cls, spec, L)], L));
    else r.role2.push(run(k, en, [unit(cls, spec, L, true), unit('warrior', 'prot', L), unit('priest', 'holy', L)], L));
  }
  rows.push(r);
}
console.log('# Class audit, N=' + N + ' per cell, no gear (scripts/sim_class_audit.cjs)\n');
console.log('Solo: hero alone vs two same-level enemies (three enemy types averaged): win / main HP lost. Party: own role in a three-hero party vs the group pack of that level: win.\n');
console.log('| spec | role | solo 15 | solo 20 | solo 25 | solo 30 | party 15 | party 20 | party 25 | party 30 |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.key} | ${r.role} | ${r.solo.map(x => pct(x.win) + ' / ' + pct(x.lost)).join(' | ')} | ${r.role2.map(x => pct(x.win)).join(' | ')} |`);
