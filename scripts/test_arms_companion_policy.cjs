'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const B = load(), P = B.armsProto;
const plain = value => JSON.parse(JSON.stringify(value));
const activeIds = P.TREE.filter(node => node.active).map(node => node.id);
function main() { return {cls:'warrior',spec:'arms',level:30,main:true,proto:'arms',talents:plain(P.line(30))}; }
function create(level, enabled) {
  return B.createBattle({encounter:'daily_wf_coast',level:30,main:'warrior',seed:13,party:[main(),{cls:'warrior',spec:'arms',level,proto:'arms',protoNoExtraActive:enabled}]});
}
let checked = 0;
for (let level = 1; level <= B.XPC.cap; level++) {
  const baseline = plain(P.line(level));
  const expected = {...baseline};
  for (const id of activeIds) delete expected[id];
  assert.equal(P.validate(expected,level).ok,true,'filtered allocation remains legal at '+level);
  const state = create(level,true), companion = state.heroes[1];
  assert.ok(!state.protoErrors || !state.protoErrors.length);
  assert.deepEqual(plain(companion.tal),expected,'preserve passive ranks at '+level);
  for (const id of activeIds) {
    assert.ok(!companion.skills.includes(id),'no inherited active '+id+' at '+level);
    assert.ok(!companion.tal[id],'no spent rank in main-only active '+id);
  }
  assert.deepEqual(plain(P.line(level)),baseline,'do not mutate the historical line');
  assert.deepEqual(plain(state.heroes[0].tal),plain(P.line(30)),'main ranks unchanged');
  checked++;
}
const historical = create(30,false);
assert.deepEqual(plain(historical.heroes[1].tal),plain(P.line(30)),'historical isolated prototype unchanged without policy');
assert.ok(historical.heroes[1].skills.includes('sweeping'));
const state = create(30,true), companionId = state.heroes[1].id;
let steps = 0;
while (!state.over && steps++ < 6000) {
  B.step(state);
  for (const event of state.events) {
    if (event.src === companionId && event.t === 'skill') assert.ok(!activeIds.includes(event.skill),'no forbidden active execution');
    if (event.src === companionId && event.t === 'proc') assert.notEqual(event.proc,'sweeping');
  }
  state.events.length = 0;
}
assert.ok(state.over,'complete the combat fixture');
const source = load.source('src/scripts/script-06.txt');
const begin = source.indexOf('  /* ARMS_HERO_BEGIN */'), end = source.indexOf('  /* ARMS_HERO_END */',begin);
assert.ok(begin >= 0 && end > begin);
function adapter(enabled) {
  return vm.runInNewContext(source.slice(begin,end)+'\n({main:armsLoadout("me"),companion:armsLoadout("companion")})',{
    B,ARMS_HERO_MODE:enabled,S:{hero:{id:'hero',armsTalents:plain(P.line(30))},main:'warrior'},
    clsOf:()=> 'warrior',specKey:()=> 'arms',hLevel:()=>30,document:{addEventListener(){}}
  });
}
const wired = adapter(true);
// TALENT-03 (owner 2026-11-27): integrated companions take ability talents (Sweeping Strikes, Mortal Strike) on their own line;
// the main-only policy above remains only for the historical isolated prototype.
assert.ok(!wired.companion.protoNoExtraActive,'integrated companions are not restricted to passives');
assert.equal(wired.companion.integratedArms,true);
{const st=B.createBattle({encounter:'daily_wf_coast',level:30,main:'warrior',seed:13,party:[main(),Object.assign({cls:'warrior',spec:'arms',level:30},plain(wired.companion))]});
 assert.ok(st.heroes[1].skills.includes('mortal')&&st.heroes[1].skills.includes('sweeping'),'integrated companion at 30 has Mortal Strike and Sweeping Strikes');
 assert.deepEqual(plain(st.heroes[1].tal),plain(B.armsIntegrated.line(30)));}
assert.ok(!wired.main.protoNoExtraActive,'do not disable main talents');
assert.deepEqual(plain(wired.main.talents),plain(P.line(30)));
assert.deepEqual(plain(adapter(false)),{main:{},companion:{}},'flag-off adapter unchanged');
console.log('Integrated companion policy passed:',checked,'own levels, passive ranks, real adapter, combat execution and historical flag-off');
