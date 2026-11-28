'use strict';
const assert=require('node:assert/strict');
const B=require('./lib_engine_load.cjs')();
const T=B.neutralTraining,plain=x=>JSON.parse(JSON.stringify(x));
const expected={warrior:['heroicstrike','rend','thunder','hamstring','bloodrage','taunt','sunder','overpower','demoshout','revenge','mockingblow','disarm','cleave','retaliation','intimshout','execute','challshout','slam'],paladin:['crusader','judgement','hoj'],druid:['wrath','moonfire','entangle'],priest:['smiteh','swp','mindblast'],mage:['fireball','frostbolt','missiles'],hunter:['raptor','serpent','arcshot'],rogue:['sinister','eviscerate','sliceanddice'],warlock:['shadowbolt','immolate','corruption']};
const LEVELS={warrior:[1,4,6,8,10,10,10,12,14,14,16,18,20,20,22,24,26,30],paladin:[1,4,8],druid:[1,4,8],priest:[1,4,10],mage:[1,4,8],hunter:[1,4,6],rogue:[1,1,10],warlock:[1,1,4]}; // PLAY-11 (owner 2026-11-27, option A): Classic trainer levels; warrior: CLASS-01 full Classic trainer list (owner 2026-11-28)
assert.ok(T&&Object.isFrozen(T));assert.equal(T.specLevel,15);assert.ok(Object.isFrozen(T.classes));
assert.deepEqual(plain(T.classes).sort(),Object.keys(expected).sort());
assert.deepEqual(Object.keys(B.CLASSES).sort(),Object.keys(expected).sort());
let cases=0;
for(const [cls,ids] of Object.entries(expected)){
 for(let level=1;level<15;level++){
  const slots=T.slots(cls,level),active=T.active(cls,level);
  assert.deepEqual(plain(slots.map(s=>s.id)),ids);
  assert.deepEqual(plain(slots.map(s=>s.unlockLevel)),LEVELS[cls]);
  assert.deepEqual(plain(active),ids.filter((id,i)=>level>=LEVELS[cls][i]));
  for(const row of slots){assert.ok(Object.isFrozen(row));assert.equal(row.source,'training');assert.equal(row.name,B.SKILLS[row.id].name);assert.equal(row.description,B.SKILLS[row.id].text);assert.equal(row.available,level>=row.unlockLevel);}
  slots.length=0;active.length=0;assert.equal(T.slots(cls,level).length,expected[cls].length);
  cases++;
 }
 for(const level of [0,15,30,60,1.5,'2',null,undefined,NaN,Infinity])assert.throws(()=>T.slots(cls,level),/Training requires own level/);
}
for(const cls of ['missing','constructor','__proto__'])assert.throws(()=>T.active(cls,2),/Unknown training class/);
assert.equal(B.abilityProgression.configuredProfiles.length,Object.keys(B.ABILITY_UNLOCKS).length); // owner 2026-11-27: production unlock schedule
for(const [cls,c] of Object.entries(B.CLASSES))for(const [spec,def]of Object.entries(c.specs))assert.deepEqual(plain(B.abilityProgression.active(cls,spec,30)),plain(def.skills));
console.log('Approved neutral training registry passed:',cases,'class/level cases, Classic trainer-level boundaries, source metadata, immutable rows, input guards and unchanged legacy progression. Registry only: combat, AI, resource setup, UI and transition wiring are not covered.');
