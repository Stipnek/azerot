'use strict';
// BAL-04 probe: own level on arrival at each early quest (greedy lowest-level-first), then win rates at that level.
const B = require(require('node:path').resolve(__dirname, '../../../scripts/lib_engine_load.cjs'))();
const G = require(process.argv[2]);
const N = +process.argv[3] || 100;
for (const [k, e] of Object.entries(G.enc)) B.ENCOUNTERS[k] = JSON.parse(JSON.stringify(e));
const Q = G.q.filter(q => q.z === 'elwynn' || q.z === 'westfall').filter(q => B.ENCOUNTERS[q.k] && B.ENCOUNTERS[q.k].level <= 14);
const done = new Set(); let xpMain = 0, xpComp = 0; const path = [];
const avail = () => Q.filter(q => !done.has(q.k) && q.need.every(n => done.has(n)) && (!q.minLevel || B.levelOf(xpMain) >= q.minLevel) && (q.intro || done.has('tutorial57_team')) );
for (let guard = 0; guard < 200; guard++) {
  const a = avail(); if (!a.length) break;
  a.sort((x, y) => B.ENCOUNTERS[x.k].level - B.ENCOUNTERS[y.k].level || (x.intro ? -1 : 0));
  const q = a[0], e = B.ENCOUNTERS[q.k], Lm = B.levelOf(xpMain), Lc = B.levelOf(xpComp);
  let enemies = e.enemies.slice();
  if (q.goals) { enemies = []; for (const g of q.goals) for (let n = 0; n < g.count && enemies.length < 3; n++) enemies.push(g.enemy); }
  path.push({ k: q.k, type: e.type, size: e.size, encL: e.level, mainL: Lm, compL: Lc, enemies, goals: !!q.goals, xpBefore: xpMain });
  if (q.goals) { // repeat fights until goals filled; .12 per kill
    const total = q.goals.reduce((s, g) => s + g.count, 0);
    const x = B.xpShares(Object.assign({}, e, { xpMult: .12 * total }), [{ cls: 'me', level: Lm, main: true, fights: true }, { cls: 'c', level: Lc, fights: false }]);
    xpMain += x[0].xp; xpComp += x[1].xp;
  }
  if (e.type !== 'talk' || true) { const fights = e.size !== 1; const x = B.xpShares(e, [{ cls: 'me', level: Lm, main: true, fights: true }, { cls: 'c', level: Lc, fights }]); xpMain += x[0].xp; xpComp += x[1].xp; }
  done.add(q.k);
}
const CLS = ['warrior', 'paladin', 'druid', 'priest', 'mage', 'hunter', 'rogue', 'warlock'];
const PET = { hunter: 'wolf', warlock: 'imp' };
function run(encKey, enemies, cls, Lm, Lc, size) {
  const saved = B.ENCOUNTERS[encKey].enemies; B.ENCOUNTERS[encKey].enemies = enemies;
  const main = { cls, spec: B.CLASSES[cls].def, level: Lm, main: true, neutralTraining: Lm < 15, race: 'human', pet: PET[cls] };
  const free = cls === 'warrior' ? { cls: 'priest', spec: 'holy', level: Lc } : { cls: 'warrior', spec: 'prot', level: Lc };
  const party = size === 1 ? [main] : [main, free];
  let w = 0; for (let s = 0; s < N; s++) { const st = B.createBattle({ encounter: encKey, level: Lm, main: cls, seed: s * 7919 + 13, party }); let g = 0; while (!st.over && g++ < 8000) B.step(st); if (st.result === 'win') w++; }
  B.ENCOUNTERS[encKey].enemies = saved; return w / N;
}
console.log('| quest | type | enc lvl | own lvl on arrival (main/comp) | enemies (game) | sim-assumed win (worst) | win at real own lvl: worst | classes <80% |');
console.log('|---|---|---|---|---|---|---|---|');
for (const p of path) {
  if (/dummy/.test(p.enemies.join()) || !p.enemies.length) continue;
  const at = CLS.map(c => [c, run(p.k, p.enemies, c, p.mainL, p.compL, p.size)]);
  const simA = CLS.map(c => [c, run(p.k, B.ENCOUNTERS[p.k].enemies, c, p.encL, p.encL, p.size)]);
  const wA = at.reduce((m, x) => x[1] < m[1] ? x : m), wS = simA.reduce((m, x) => x[1] < m[1] ? x : m);
  console.log('| ' + [p.k, p.type + '/' + p.size, p.encL, p.mainL + '/' + p.compL, p.enemies.join(',') + (p.goals ? ' (goals)' : ''), wS[0] + ' ' + Math.round(wS[1] * 100) + '%', wA[0] + ' ' + Math.round(wA[1] * 100) + '%', at.filter(x => x[1] < .8).map(x => x[0] + ' ' + Math.round(x[1] * 100) + '%').join(', ') || '—'].join(' | ') + ' |');
}
console.log('\nfinal main level', B.levelOf(xpMain), 'xp', xpMain);
