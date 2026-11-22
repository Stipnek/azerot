'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const load = require('./lib_engine_load.cjs');
const B = load(), P = B.armsProto, source = load.source('src/scripts/script-06.txt');
const plain = value => JSON.parse(JSON.stringify(value));
const begin = source.indexOf('  /* ARMS_HERO_BEGIN */');
const end = source.indexOf('  /* ARMS_HERO_END */', begin);
assert.ok(begin >= 0 && end > begin);
const funcs = source.slice(begin, end);
const partySource = source.match(/  function partyArg\(\) \{[^\n]+\}/);
assert.ok(partySource);
assert.ok(source.includes('...armsLoadout(key), cls: clsOf(key)'));
assert.ok(source.includes('armsTalents: armsHeroData(h, B.levelOf(cleanHxp(h).me))'));
const esc = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let stored, writes = 0, refreshes = 0, allowSave = true, alerts = 0;
const S = { hero: {id:'first',cls:'warrior',race:'human',name:'First',level:30,hxp:{me:B.xpAt(30)},armsTalents:plain(P.line(30))}, main:'warrior', party:['me','low','healer'] };
const specs = {me:'arms',low:'arms',healer:'holy'}, levels = {me:30,low:14,healer:30};
const context = vm.createContext({B,S,ARMS_HERO_MODE:true,st:null,esc,
  document:{addEventListener(){}}, window:{alert(){alerts++;}},
  clsOf:k=>k==='me'?S.main:k==='healer'?'priest':'warrior',specKey:k=>specs[k],hLevel:k=>levels[k],
  battleParty:()=>S.party,tavRec:()=>null,petFor:()=>null,heroName:k=>k,equipmentStats:()=>({}),hasMorbentsBane:()=>false,tavBonus:()=>0,
  save(){writes++;if(allowSave)stored=JSON.stringify(S.hero);return allowSave;},showWorld(tab){assert.equal(tab,'hero');refreshes++;}
});
vm.runInContext(funcs+'\n'+partySource[0],context);
const call = code => vm.runInContext(code,context);
assert.throws(()=>call('armsHeroData(S.hero)'), /Own hero level required/);
assert.deepEqual(plain(call('armsHeroData({}, 30)')),{});
for (const bad of [[],false,'bad',{unknown:1},{deepwounds:3},{ihs:99}]) {
  context.raw={armsTalents:bad};assert.deepEqual(plain(call('armsHeroData(raw, 30)')),{});
}
let party = plain(call('partyArg()'));
assert.deepEqual(party[0].talents,plain(P.line(30)));
assert.equal(party[0].proto,'arms');assert.equal(party[1].proto,'arms');
assert.equal(party[1].level,14);assert.ok(!('talents' in party[1]));assert.ok(!('proto' in party[2]));
let battle = B.createBattle({party,main:'warrior',level:30,encounter:'daily_wf_coast',seed:1});
assert.deepEqual(plain(battle.heroes[0].tal),plain(P.line(30)));
assert.deepEqual(plain(battle.heroes[1].tal),{});
assert.deepEqual(plain(battle.heroes[1].skills),['heroicstrike','thunder','rend']);
levels.low=25;party=plain(call('partyArg()'));
battle=B.createBattle({party,main:'warrior',level:30,encounter:'daily_wf_coast',seed:1});
assert.deepEqual(plain(battle.heroes[1].tal),plain(P.line(25)));
assert.match(call('armsHeroPanel()'),/data-arms-panel="first"/);
function click(dataset,type='click') {
  context.ev={type,target:{closest:()=>({dataset})},preventDefault(){},stopPropagation(){}};
  call('armsHeroAction(ev)');
}
S.hero.armsTalents={};
click({armsHero:'first',armsNode:'imprend'});
assert.equal(S.hero.armsTalents.imprend,1);assert.equal(writes,1);assert.equal(refreshes,1);
assert.deepEqual(JSON.parse(stored).armsTalents,{imprend:1});
const first=JSON.parse(stored);S.hero={id:'second',cls:'warrior',armsTalents:{}};
assert.deepEqual(plain(call("armsLoadout('me').talents")),{});
click({armsHero:'first',armsNode:'imprend'});assert.equal(writes,1);
S.hero=first;click({armsHero:'first',armsNode:'imprend'},'contextmenu');
assert.deepEqual(plain(S.hero.armsTalents),{});
allowSave=false;click({armsHero:'first',armsNode:'imprend'});
assert.deepEqual(plain(S.hero.armsTalents),{});assert.equal(alerts,1);
allowSave=true;context.st={over:false};const before=writes;
click({armsHero:'first',armsNode:'imprend'});assert.equal(writes,before);context.st=null;
S.hero.armsTalents=plain(P.line(30));levels.me=14;
assert.deepEqual(plain(call("armsLoadout('me').talents")),{});
assert.match(call('armsHeroPanel()'),/откроются на 15 уровне/);
levels.me=30;specs.me='prot';assert.deepEqual(plain(call("armsLoadout('me')")),{});assert.equal(call('armsHeroPanel()'),'');
specs.me='arms';context.ARMS_HERO_MODE=false;
assert.deepEqual(plain(call("armsLoadout('me')")),{});assert.equal(call('armsHeroPanel()'),'');
const keyBegin=source.indexOf('  const ARMS_HERO_MODE =');
const keyEnd=source.indexOf('  /* Все зоны игры.',keyBegin);
assert.ok(keyBegin>=0&&keyEnd>keyBegin);
const original=JSON.stringify({chars:[{id:'keep'}]}),values=new Map([['azeroth-ab-setup-v5',original]]),keys=[];
const keyCode=source.slice(keyBegin,keyEnd);
function openSave(){return vm.runInNewContext(keyCode+'\nKEY',{window:{__AZEROT_ARMS_HERO__:true},localStorage:{getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){keys.push(k);values.set(k,String(v));}}});}
assert.equal(openSave(),'azeroth-arms-hero-v1');assert.equal(values.get('azeroth-arms-hero-v1'),original);
values.set('azeroth-arms-hero-v1','updated');openSave();
assert.equal(values.get('azeroth-arms-hero-v1'),'updated');assert.equal(values.get('azeroth-ab-setup-v5'),original);
assert.deepEqual(keys,['azeroth-arms-hero-v1']);
console.log('Arms hero integration: own-level battle adapter, persistence actions, isolation, validation, rollback and flag-off passed');
