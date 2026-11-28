'use strict';
// Shared class probe for test_class_rules.cjs and report_class_cards.cjs (not a balance gate).
// Builds heroes the way the hero-mode UI does (src/scripts/script-06 armsLoadout): the main uses the neutral training kit
// at own levels 1-14 and its specialization from 15 (Arms through integratedArms, other specs with talent rules through
// B.specTalents with the companion line as a reasonable build); companions fight with their spec from level 1 (PLAY-02),
// Arms companions through integratedArms. Runs seeded battles and aggregates per-hero events.
const B = require('./lib_engine_load.cjs')();

const CLASSES = Object.keys(B.CLASSES);
const PET = { hunter: 'wolf', warlock: 'imp' };
// Two same-level enemies of the zone, as in sim_early.cjs / sim_class_audit.cjs.
const MOBS = { 1: 'wolf', 4: 'kobold', 5: 'kobold', 6: 'murloc', 8: 'murloc', 10: 'goretusk', 12: 'looter', 14: 'murlocWarrior',
  15: 'gnollMiner', 18: 'gnollMiner', 20: 'gnollRunt', 23: 'murlocWarrior', 25: 'dw_wolf', 28: 'dw_skeleton', 30: 'dw_skeleton' };
const mobFor = L => { const ks = Object.keys(MOBS).map(Number).filter(k => k <= L); return MOBS[ks[ks.length - 1]]; };
const CASTERS = new Set(['mage', 'priest', 'warlock']);
// Spell casters: mage, priest, warlock, and a druid out of animal form (training kit, Balance, Restoration).
const isCaster = h => CASTERS.has(h.cls) || (h.cls === 'druid' && h.spec !== 'bear' && h.spec !== 'cat');
const PERMANENT = 900; // effects pushed with turns: 999 (whole fight); the battle token shows the countdown

function starter(cls) { return { armorFlat: 8, stamina: 1, [B.primaryKey(cls, B.CLASSES[cls].def)]: 1 }; }

// One party member as the game builds it. role: 'main' | 'companion'.
function member(cls, spec, L, role) {
  const u = { cls, spec, level: L, main: role === 'main', race: 'human', pet: PET[cls], statBonuses: role === 'main' ? starter(cls) : undefined };
  if (role === 'main' && L < 15) return Object.assign(u, { spec: B.CLASSES[cls].def, neutralTraining: true });
  if (cls === 'warrior' && spec === 'arms') return Object.assign(u, { proto: 'arms', integratedArms: true }, role === 'main' ? { talents: B.armsIntegrated.line(L) } : {});
  const R = B.specTalents && B.specTalents.rules(cls, spec);
  if (R && role === 'main') u.talents = R.line(L);
  return u;
}

let encSeq = 0;
function encounter(L, enemies, hpMul) {
  const key = '__probe' + (encSeq++);
  B.ENCOUNTERS[key] = { name: 'probe', place: 'probe', type: 'solo', size: 1, level: L, enemies };
  return { key, hpMul: hpMul || 1, done() { delete B.ENCOUNTERS[key]; } };
}

// Run N battles; `subject` is the party index whose events are aggregated.
function probe({ party, L, enemies, n = 20, hpMul = 1, subject = 0, seed0 = 13 }) {
  const enc = encounter(L, enemies, hpMul);
  const agg = { fights: 0, wins: 0, hpLost: 0, turns: 0, casts: {}, autos: 0, autoMeleeWithMana: 0, autoName: null, autoRanged: null,
    startEffects: {}, longEffects: {}, pids: null, skills: null, approach: 0, stunApplied: {}, stunSkips: 0, stunSkipBy: {}, dmgBySkill: {}, atk: 0 };
  try {
    for (let s = 0; s < n; s++) {
      const st = B.createBattle({ encounter: enc.key, level: L, main: party[0].cls, seed: s * 7919 + seed0, party: JSON.parse(JSON.stringify(party)) });
      if (hpMul !== 1) st.enemies.forEach(e => { e.maxHp = Math.round(e.maxHp * hpMul); e.hp = e.maxHp; });
      const h = st.heroes[subject];
      if (agg.skills === null) { agg.skills = h.skills.slice(); agg.pids = (h.pids || []).slice(); agg.atk = h.atk;
        const a = B.autoOf(h.cls, h.spec); agg.autoName = a && a.name; agg.autoRanged = !!(a && a.ranged); }
      for (const f of h.effects) agg.startEffects[f.name || f.kind] = Math.max(agg.startEffects[f.name || f.kind] || 0, f.turns || 0);
      let last = null, g = 0;
      while (!st.over && g++ < 8000) {
        for (const x of B.step(st)) {
          if (x.t === 'turn' && x.id === h.id) agg.turns++;
          if (x.t === 'skill' && x.src === h.id) { agg.casts[x.skill] = (agg.casts[x.skill] || 0) + 1; last = x.skill; }
          if (x.t === 'auto' && x.src === h.id) { agg.autos++; last = '__auto';
            // A staff swing with mana to spare; a healer's free heal is also an 'auto' event and is not a swing, and a healer that had
            // nothing to heal and no damage spell (Restoration before 23) may swing.
            if (!agg.autoRanged && x.name === agg.autoName && h.role !== 'heal' && h.maxMana > 0 && h.mana / h.maxMana > 0.2 && isCaster(h)) agg.autoMeleeWithMana++; }
          if (x.t === 'dmg' && x.src === h.id && last && !x.dot) agg.dmgBySkill[last] = (agg.dmgBySkill[last] || 0) + x.amt;
          if (x.t === 'eskill' && x.id === 'approach') agg.approach++;
          if (x.t === 'eskill' && x.id === 'stun') { const e = st.enemies.find(v => v.id === x.src); if (e) { agg.stunSkips++; const f = e.effects.find(v => v.kind === 'stun'); if (f && f.src === h.id) agg.stunSkipBy[f.name || 'stun'] = (agg.stunSkipBy[f.name || 'stun'] || 0) + 1; } }
        }
        for (const f of h.effects) if ((f.turns || 0) >= PERMANENT) agg.longEffects[f.name || f.kind] = true;
        for (const e of st.enemies) for (const f of e.effects) if (f.kind === 'stun' && f.src === h.id && !f.__seen) { f.__seen = 1; agg.stunApplied[f.name || 'stun'] = (agg.stunApplied[f.name || 'stun'] || 0) + 1; }
      }
      agg.fights++;
      if (st.result === 'win') { agg.wins++; agg.hpLost += 1 - Math.max(0, h.hp) / h.maxHp; } else agg.hpLost += 1;
    }
  } finally { enc.done(); }
  return agg;
}

// Contexts in which a kit should show every ability: solo vs two enemies, a long single-target fight, a long three-enemy fight,
// and the spec's own role in a party (tank/healer only work there).
function contexts(cls, spec, L, role, n) {
  const sp = B.CLASSES[cls].specs[spec], me = member(cls, spec, L, role), mob = mobFor(L), out = {};
  out.solo2 = probe({ party: [me], L, enemies: [mob, mob], n });
  out.long1 = probe({ party: [me], L, enemies: [mob], n: Math.max(4, n >> 2), hpMul: 6 });
  const tank = member('warrior', 'prot', L, 'companion'), heal = member('priest', 'holy', L, 'companion'), dd = member('mage', 'fire', L, 'main');
  const party = sp.role === 'tank' ? [dd, me, heal] : sp.role === 'heal' ? [dd, tank, me] : [me, tank, heal], at = party.indexOf(me);
  // Three tough enemies with a tank and a healer around the subject: long enough for cooldowns to come back.
  out.long3 = probe({ party, L, enemies: [mob, mob, mob], n: Math.max(4, n >> 2), hpMul: 5, subject: at });
  if (L >= 15 || role === 'companion') {
    out.party = probe({ party, L, enemies: [mob, mob, mob], n: Math.max(4, n >> 1), hpMul: 2, subject: at });
    // A hard fight (four tougher enemies three levels up) for situational spells: big heals, mana and panic buttons.
    out.hard = probe({ party, L: L + 3, enemies: [mob, mob, mob, mob], n: Math.max(4, n >> 1), hpMul: 2.5, subject: at });
  }
  return out;
}

// Declared unlock level of each kit skill for this character, as the hero tab shows it.
function declaredUnlocks(cls, spec, L, role) {
  if (role === 'main' && L < 15) return Object.fromEntries(B.neutralTraining.slots(cls, L).map(r => [r.id, r.unlockLevel]));
  return Object.assign({}, B.ABILITY_UNLOCKS[cls + ':' + spec] || {});
}

module.exports = { isCaster, PERMANENT, B, CLASSES, PET, MOBS, mobFor, CASTERS, member, probe, contexts, declaredUnlocks, starter };
