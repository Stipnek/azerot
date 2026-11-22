'use strict';
// Fixed scenarios for all ordinary classes/specs with prototype flags OFF.
const crypto = require('node:crypto');
module.exports = function fingerprint(B) {
  const ENC = [['daily_wf_coast', 15], ['vancleef', 19], ['dw_nightwatch', 30]];
  const rows = [];
  const specs = [];
  for (const c of Object.keys(B.CLASSES)) for (const s of Object.keys(B.CLASSES[c].specs)) specs.push([c, s]);
  for (const [enc, lv] of ENC) {
    for (let i = 0; i < specs.length; i++) {
      const [c, s] = specs[i], [c2, s2] = specs[(i + 7) % specs.length], [c3, s3] = specs[(i + 13) % specs.length];
      const pet = cls => cls === 'hunter' ? 'wolf' : cls === 'warlock' ? 'voidwalker' : null;
      for (let seed = 0; seed < 4; seed++) {
        const st = B.createBattle({ encounter: enc, level: lv, main: c, seed: seed * 7919 + 13, party: [
          { cls: c, spec: s, level: lv, main: true, pet: pet(c) },
          { cls: c2, spec: s2, level: lv, pet: pet(c2), rb: 0.1 },
          { cls: c3, spec: s3, level: lv - 1, pet: pet(c3), rb: 0.25 }] });
        let g = 0; while (!st.over && g++ < 6000) B.step(st);
        rows.push([enc, c + ':' + s, seed, st.result, st.actions,
          st.heroes.map(h => [h.maxHp, Math.round(h.atk), Math.round(h.stats.dmg), Math.round(h.stats.heal), Math.max(0, Math.round(h.hp))].join('/')).join('|'),
          (st.pets || []).map(p => [p.maxHp, Math.round(p.atk), Math.round(p.stats.dmg)].join('/')).join('|')].join(';'));
      }
    }
  }
  return { count: rows.length, sha256: crypto.createHash('sha256').update(rows.join('\n')).digest('hex') };
};
