'use strict';
const fs = require('node:fs');
const path = require('node:path');
const B = require('./lib_engine_load.cjs')();
if (!B.abilityProgression || !B.CLASSES) throw new Error('Missing effective ability registry');
const levels = [1, 2, 5, 9, 10, 14, 15, 20, 24, 29, 30];
const profiles = [];
for (const [cls, def] of Object.entries(B.CLASSES)) {
  for (const spec of Object.keys(def.specs)) {
    const samples = levels.map(level => ({ level, slots: B.abilityProgression.slots(cls, spec, level) }));
    profiles.push({ cls, spec, usesLegacyAvailability: samples.some(s => s.slots.some(x => x.source === 'legacy' || x.unlockLevel === null)), samples });
  }
}
if (!profiles.length) throw new Error('No ability profiles found');
if (!B.armsIntegrated || typeof B.armsIntegrated.slots !== 'function') throw new Error('Missing integrated Arms API');
const arms = levels.map(level => ({
  level,
  mainWithoutAllocatedTalents: B.armsIntegrated.slots(level, {}, true),
  ordinaryCompanion: B.armsIntegrated.slots(level, {}, false)
}));
const report = {
  sourceCommit: process.env.GITHUB_SHA || null,
  status: 'inventory-only-not-release-acceptance',
  scope: 'Effective engine APIs; not browser, AI, migration, live, or design acceptance.',
  configuredProfiles: B.abilityProgression.configuredProfiles,
  legacyProfiles: profiles.filter(p => p.usesLegacyAvailability).map(p => p.cls + ':' + p.spec),
  profiles,
  optInArms: { requiresExplicitIntegration: true, allocation: {}, samples: arms },
  unresolvedGates: [
    'Reconcile each kit and unlock level with approved design; do not invent schedules.',
    'Reconcile main and companion training roles, passives, auras and replacement rules.',
    'Verify execution guards, AI and all skill views on the combined candidate.',
    'Verify normal-save compatibility and exact release-flag configuration.'
  ]
};
const output = path.join('test-results', 'entry-screen', 'ability-release-audit.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ report: output, profiles: profiles.length, legacyProfiles: report.legacyProfiles.length, status: report.status }));
