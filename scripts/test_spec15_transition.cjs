'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const B = load(), source = load.source('src/scripts/script-06.txt');
const plain = x => JSON.parse(JSON.stringify(x));
const limitMatch = source.match(/^  const LIMIT = (\d+);$/m);
assert.ok(limitMatch, 'load actual party limit from assembled source');
const LIMIT = Number(limitMatch[1]);
function fn(name) {
  const start = source.indexOf('  function ' + name + '(');
  assert.ok(start >= 0, 'function ' + name);
  let depth = 0, quote = null, escaped = false;
  const brace = source.indexOf('{', start);
  for (let i = brace; i < source.length; i++) {
    const c = source[i];
    if (quote) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('Unclosed function: ' + name);
}
const names = ['hLevel','selectedSpec','canSpecialize','runtimeLeaderAura','startSpec','effectiveSpec','ddSpec','syncLevel','specKey','save','cleanChar','cleanSpecs','cleanHxp','legacyXpToV2','cleanNames','cleanQuestProgress','inventoryCount','worldQuestItems','cleanInventory','canEquipQuestGear','cleanGear','cleanTav','migrateTav','isGid','cleanParty','startParty','clsOf','tavRec','armsHeroData','armsLoadout','partyArg','petFree'];
const code = names.map(fn).join('\n');
const S = {main:'warrior',specs:{me:'fury'},level:14,party:['me','g_low'],allSpecs:false,chars:[],cur:'hero'};
const values = new Map();
const sandbox = {B,S,LIMIT,ARMS_HERO_MODE:true,SPEC_LEVEL:15,PET_SELECTION_LEVEL:10,KEY:'isolated-test',
  HERO_NAMES:{},ZONE_KEYS:['elwynn'],RACES:{human:{classes:['warrior','paladin','rogue','priest','mage','warlock']},dwarf:{classes:['warrior','paladin','hunter','rogue','priest']},nelf:{classes:['warrior','hunter','rogue','priest','druid']}},
  gearItems:[{id:57001,slot:'chest',armorFlat:1}],
  az54HeroName:()=>null,raceOk:()=>true,pickRace:()=> 'human',newId:()=> 'generated',
  applyDailyLevels(){},petFor:()=>null,heroName:k=>k,equipmentStats:()=>({}),hasMorbentsBane:()=>false,tavBonus:()=>0,
  battleParty:()=>S.party,esc:x=>String(x),
  localStorage:{getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v))}
};
const context = vm.createContext(sandbox);vm.runInContext(code,context);
const call = expr => vm.runInContext(expr,context);
assert.deepEqual(plain(call("cleanInventory({57001:'3',999:8})")),{'57001':3},'real inventory normalization, not a stub');
function character(level,spec) {
  return {id:'hero',name:'Hero',cls:'warrior',race:'human',level,xpCurve:2,hxp:{me:B.xpAt(level),g_low:B.xpAt(14)},specs:{warrior:'prot',me:spec,g_low:'prot'},party:['me','g_low'],money:12345,items:{57001:3},gear:{chest:57001},tav:{st:0,coll:{g_low:{cls:'warrior',sp:'prot',br:0,r:0,k:1,n:'Companion',race:'human'}}}};
}
function install(raw) {context.raw=raw;S.hero=call('cleanChar(raw)');assert.ok(S.hero);S.chars=[S.hero];S.main=S.hero.cls;S.specs=plain(S.hero.specs);S.level=S.hero.level;call('syncLevel()');}
for (const spec of ['prot','arms','fury']) for (let level=10;level<=14;level++) {
  install(character(level,spec));
  assert.equal(S.specs.me,spec,'preserve chosen path');assert.equal(call("selectedSpec('me')"),spec);
  assert.equal(call("specKey('me')"),'arms','shared warrior training profile');
  assert.equal(call("canSpecialize('me')"),false);assert.equal(call('effectiveSpec(S.hero)'),null);
  const state=B.createBattle({encounter:'daily_wf_coast',level:30,main:'warrior',party:plain(call('partyArg()')),seed:13});
  assert.deepEqual(plain(state.heroes[0].skills),plain(B.armsProto.kit(level,{})));
  assert.deepEqual(plain(state.heroes[0].pids),[]);assert.deepEqual(plain(state.heroes[0].tal),{});
  assert.equal(state.heroes[0].parryBase,0);assert.equal(state.aura.name,undefined);
  assert.equal(call('runtimeLeaderAura([]).name'),undefined);
  assert.equal(call('save()'),true);
  const saved=JSON.parse(values.get('isolated-test')).chars[0];install(saved);
  assert.equal(S.specs.me,spec);assert.equal(S.hero.hxp.me,B.xpAt(level));assert.equal(S.hero.money,12345);
  assert.deepEqual(plain(S.hero.items),{'57001':3});assert.deepEqual(plain(S.hero.gear),{chest:57001});
  S.hero.hxp.me=B.xpAt(15);call('syncLevel()');
  assert.equal(call("canSpecialize('me')"),true);assert.equal(call("specKey('me')"),spec);
  assert.equal(call("canSpecialize('g_low')"),false);assert.equal(call("specKey('g_low')"),'prot','PLAY-02: companions use their shown spec from level 1');
  S.hero.hxp.g_low=B.xpAt(15);assert.equal(call("specKey('g_low')"),'prot');
}
let preservedProfiles=0;
for (const [cls,definition] of Object.entries(B.CLASSES)) for (const spec of Object.keys(definition.specs)) {
  const raw=character(14,spec);raw.cls=cls;raw.race=cls==='druid'?'nelf':cls==='hunter'?'dwarf':'human';raw.specs[cls]=definition.def;
  install(raw);assert.equal(S.specs.me,spec);assert.equal(call('effectiveSpec(S.hero)'),null);
  assert.equal(call('save()'),true);install(JSON.parse(values.get('isolated-test')).chars[0]);
  assert.equal(S.specs.me,spec);S.hero.hxp.me=B.xpAt(15);call('syncLevel()');
  assert.equal(call("specKey('me')"),spec);preservedProfiles++;
}
install(character(14,'fury'));S.allSpecs=true;
assert.equal(call("canSpecialize('me')"),false,'debug switch cannot leak future spec in integration');
assert.equal(call("specKey('me')"),'arms');assert.equal(S.specs.me,'fury');
S.hero.hxp.g_low=B.xpAt(10);assert.equal(call("petFree('g_low')"),true,'pet threshold remains 10');
S.allSpecs=false;
sandbox.ARMS_HERO_MODE=false;sandbox.SPEC_LEVEL=10;
S.hero.hxp.me=B.xpAt(12);S.specs.me='fury';call('syncLevel()');assert.equal(call("specKey('me')"),'fury');
S.hero.hxp.me=B.xpAt(9);call('syncLevel()');assert.equal(S.specs.me,'prot','legacy mode unchanged');
assert.ok(source.includes("if (!canSpecialize('me') || !B.CLASSES[S.main].specs[b.dataset.hspec]) return;"));
assert.ok(source.includes('!canSpecialize(spB.dataset.cls)'));
console.log('Spec-15 warrior transition passed: real inventory/character cleaner/save, 10..14 migration, 14/15 own-level units, no pre-15 aura/passives, item quantities/equipment/XP preservation and legacy mode');
