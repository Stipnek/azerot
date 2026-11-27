'use strict';
// Classic class tools added after the 2026-11-27 class audit: whole-fight effects by own level, not in the neutral training kit.
const assert = require('node:assert/strict');
const B = require('./lib_engine_load.cjs')();
const kinds = (cls, spec, level, extra) => B.createBattle({ encounter: 'cl_watch1', level: 24, main: cls, seed: 3, party: [Object.assign({ cls, spec, level, main: true }, extra || {})] }).heroes[0].effects.map(e => e.kind).join(',');
assert.equal(kinds('paladin', 'prot', 15).split(',').sort().join(','), 'reflect,rf', 'Protection paladin: Righteous Fury and holy damage back from 15');
assert.equal(kinds('paladin', 'prot', 14), '', 'not before 15');
assert.equal(kinds('paladin', 'holy', 1), 'seal', 'Holy paladin: Seal of Righteousness from 1');
assert.equal(kinds('mage', 'arcane', 19), '', 'Mana Shield not before 20');
const st = B.createBattle({ encounter: 'cl_watch1', level: 24, main: 'mage', seed: 3, party: [{ cls: 'mage', spec: 'arcane', level: 20, main: true }] });
const sh = st.heroes[0].effects.find(e => e.kind === 'shield');
assert.ok(sh && sh.amt === Math.round(st.heroes[0].maxHp * B.CLASS_TOOLS['mage:arcane'].shield), 'Arcane: Mana Shield absorbs a share of max HP');
assert.equal(kinds('paladin', 'ret', 20), '', 'other specs untouched');
console.log('class tools ok');
