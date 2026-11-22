'use strict';
// Reuse the existing real cleaner/save fixture and all of its baseline assertions.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');
const fixturePath=path.resolve(__dirname,'test_spec15_transition.cjs');
const extra=`
sandbox.ARMS_HERO_MODE=true;sandbox.SPEC_LEVEL=15;
let autoCases=0;
for(const [cls,definition] of Object.entries(B.CLASSES)) {
 const choices=Object.keys(definition.specs).filter(key=>definition.specs[key].role==='dd').sort();
 assert.ok(choices.length,cls+': DD choices');
 for(const roll of [0,0.49,0.999999]) {
  const raw=character(14,definition.def);raw.cls=cls;raw.race=cls==='druid'?'nelf':cls==='hunter'?'dwarf':'human';raw.specs[cls]=definition.def;
  raw.autoSpec15={version:1,roll,chosen:null};install(raw);
  assert.equal(S.hero.autoSpec15.chosen,null);assert.equal(S.specs.me,definition.def);
  assert.equal(call('save()'),true);install(JSON.parse(values.get('isolated-test')).chars[0]);
  assert.equal(S.hero.autoSpec15.roll,roll);assert.equal(S.hero.autoSpec15.chosen,null);
  S.hero.hxp.me=B.xpAt(15);call('syncLevel()');
  const expected=choices[Math.floor(roll*choices.length)];
  assert.equal(S.specs.me,expected);assert.equal(S.hero.autoSpec15.chosen,expected);
  assert.equal(B.CLASSES[cls].specs[expected].role,'dd');
  for(let i=0;i<5;i++){call('syncLevel()');assert.equal(S.specs.me,expected);}
  assert.equal(call('save()'),true);const saved=JSON.parse(values.get('isolated-test')).chars[0];install(saved);
  assert.equal(S.specs.me,expected);assert.equal(S.hero.autoSpec15.chosen,expected);
  assert.equal(S.hero.hxp.me,B.xpAt(15));assert.equal(S.hero.money,12345);
  assert.deepEqual(plain(S.hero.items),{'57001':3});assert.deepEqual(plain(S.hero.gear),{chest:57001});
  S.specs.me=definition.def;call('syncLevel()');assert.equal(S.specs.me,definition.def,'Do not override a subsequent explicit selection');
  autoCases++;
 }
}
for(const marker of [{version:1,roll:-1,chosen:null},{version:1,roll:1,chosen:null},{version:1,roll:'0.5',chosen:null},{version:1,roll:NaN,chosen:null},{version:2,roll:0,chosen:null},{version:1,roll:0,chosen:'prot'}]) {
 const raw=character(14,'prot');raw.autoSpec15=marker;install(raw);assert.equal(S.hero.autoSpec15,undefined);
 S.hero.hxp.me=B.xpAt(15);call('syncLevel()');assert.equal(S.specs.me,'prot');
}
install(character(14,'prot'));S.hero.hxp.me=B.xpAt(15);call('syncLevel()');assert.equal(S.specs.me,'prot');assert.equal(S.hero.autoSpec15,undefined);
sandbox.ARMS_HERO_MODE=false;sandbox.SPEC_LEVEL=10;
const legacy=character(14,'prot');legacy.autoSpec15={version:1,roll:0,chosen:null};install(legacy);
assert.equal(S.hero.autoSpec15,undefined);S.hero.hxp.me=B.xpAt(15);call('syncLevel()');assert.equal(S.specs.me,'prot');
assert.ok(source.includes('autoSpec15: { version: 1, roll: Math.random(), chosen: null }'));
console.log('Auto-DD phase 1 passed:',autoCases,'class/roll cases; actual character cleaner/save, 14/15 boundary, repeated sync/reload, invalid markers, existing heroes and ordinary mode. Training kits, companions, creation clicks and browser migration not covered.');
`;
vm.runInNewContext(fs.readFileSync(fixturePath,'utf8')+'\n'+extra,{require:createRequire(fixturePath),console},{filename:fixturePath,timeout:30000});
