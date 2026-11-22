'use strict';
const assert=require('node:assert/strict');
const B=require('./lib_engine_load.cjs')();
const T=B.neutralTraining,plain=x=>JSON.parse(JSON.stringify(x));
const expected={warrior:['heroicstrike','thunder','rend'],paladin:['judgement','crusader','hoj'],druid:['wrath','moonfire','entangle'],priest:['smiteh','swp','mindblast'],mage:['fireball','frostbolt','missiles'],hunter:['steady','arcshot','serpent'],rogue:['sinister','eviscerate','sliceanddice'],warlock:['shadowbolt','immolate','corruption']};
assert.ok(T&&Object.isFrozen(T));assert.equal(T.specLevel,15);assert.ok(Object.isFrozen(T.classes));
assert.deepEqual(plain(T.classes).sort(),Object.keys(expected).sort());
assert.deepEqual(Object.keys(B.CLASSES).sort(),Object.keys(expected).sort());
let cases=0;
for(const [cls,ids] of Object.entries(expected)){
 for(let level=1;level<15;level++){
  const slots=T.slots(cls,level),active=T.active(cls,level);
  assert.deepEqual(plain(slots.map(s=>s.id)),ids);
  assert.deepEqual(plain(slots.map(s=>s.unlockLevel)),[2,5,9]);
  assert.deepEqual(plain(active),ids.filter((id,i)=>level>=[2,5,9][i]));
  for(const row of slots){assert.ok(Object.isFrozen(row));assert.equal(row.source,'training');assert.equal(row.name,B.SKILLS[row.id].name);assert.equal(row.description,B.SKILLS[row.id].text);assert.equal(row.available,level>=row.unlockLevel);}
  slots.length=0;active.length=0;assert.equal(T.slots(cls,level).length,3);
  cases++;
 }
 for(const level of [0,15,30,60,1.5,'2',null,undefined,NaN,Infinity])assert.throws(()=>T.slots(cls,level),/Training requires own level/);
}
for(const cls of ['missing','constructor','__proto__'])assert.throws(()=>T.active(cls,2),/Unknown training class/);
assert.deepEqual(plain(B.abilityProgression.configuredProfiles),[]);
for(const [cls,c] of Object.entries(B.CLASSES))for(const [spec,def]of Object.entries(c.specs))for(const level of [1,14,15,30])assert.deepEqual(plain(B.abilityProgression.active(cls,spec,level)),plain(def.skills));
console.log('Approved neutral training registry passed:',cases,'class/level cases, 2/5/9 boundaries, source metadata, immutable rows, input guards and unchanged legacy progression. Registry only: combat, AI, resource setup, UI and transition wiring are not covered.');
