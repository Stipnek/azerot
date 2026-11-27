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
const S = { hero: {id:'first',cls:'warrior',race:'human',name:'First',level:30,hxp:{me:B.xpAt(30)},armsTalents:plain(B.armsIntegrated.line(30))}, main:'warrior', party:['me','low','healer'] };
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
assert.deepEqual(party[0].talents,plain(B.armsIntegrated.line(30)));
assert.equal(party[0].proto,'arms');assert.equal(party[1].proto,'arms');
assert.equal(party[1].level,14);assert.ok(!('talents' in party[1]));assert.ok(!('proto' in party[2]));
let battle = B.createBattle({party,main:'warrior',level:30,encounter:'daily_wf_coast',seed:1});
assert.deepEqual(plain(battle.heroes[0].tal),plain(B.armsIntegrated.line(30)));
assert.deepEqual(plain(battle.heroes[1].tal),{});
assert.deepEqual(plain(battle.heroes[1].skills),['heroicstrike','thunder','rend']);
levels.low=25;party=plain(call('partyArg()'));
battle=B.createBattle({party,main:'warrior',level:30,encounter:'daily_wf_coast',seed:1});
assert.deepEqual(plain(battle.heroes[1].tal),plain(B.armsIntegrated.line(25)));
const html=call('armsHeroPanel()');
assert.match(html,/data-arms-panel="first"/);
const icons=[...html.matchAll(/<button\b[^>]*data-arms-node="[^"]+"[^>]*>/g)].map(m=>m[0]).filter(tag=>!tag.includes('data-arms-delta'));
assert.equal(icons.length,B.armsIntegrated.TREE.length);
for (const icon of icons) {
  assert.match(icon,/aria-label="Описание таланта:/);
  assert.doesNotMatch(icon,/\baria-disabled=|\sdisabled(?:\s|>|=)/);
}
function click(dataset,type='click') {
  const detail={dataset:{armsHelp:dataset.armsNode},open:false};
  const other={dataset:{armsHelp:'other'},open:true};
  const box={hidden:true},note={textContent:'stale'},heading={textContent:''},effect={textContent:''},actions={innerHTML:''};
  const panel={
    closest(selector){assert.equal(selector,'dialog');return null;},
    querySelectorAll(selector){
      if(selector==='details[data-arms-help]')return [detail,other];
      if(selector==='details[data-arms-help][open]')return [detail,other].filter(d=>d.open);
      throw new Error('Unexpected querySelectorAll: '+selector);
    },
    querySelector(selector){
      if(selector==='details[data-arms-help][open]')return [detail,other].find(d=>d.open)||null;
      const fields={'[data-arms-inspector]':box,'[data-arms-status]':note,'[data-arms-heading]':heading,'[data-arms-effect]':effect,'[data-arms-actions]':actions};
      assert.ok(Object.hasOwn(fields,selector),'Unexpected querySelector: '+selector);
      return fields[selector];
    }
  };
  const button={dataset,closest(selector){assert.equal(selector,'[data-arms-panel]');return panel;}};
  context.ev={type,target:{closest:()=>button},preventDefault(){},stopPropagation(){}};
  call('armsHeroAction(ev)');
  return {detail,other,box,note,heading,effect,actions};
}
S.hero.armsTalents={};
function checkPreview(id) {
  const before=JSON.stringify(S.hero),beforeStored=stored,beforeWrites=writes,beforeRefreshes=refreshes;
  const ui=click({armsHero:S.hero.id,armsNode:id});
  assert.equal(JSON.stringify(S.hero),before);assert.equal(stored,beforeStored);
  assert.equal(writes,beforeWrites);assert.equal(refreshes,beforeRefreshes);
  assert.equal(ui.detail.open,true);assert.equal(ui.other.open,false);assert.equal(ui.box.hidden,false);
  assert.equal(ui.note.textContent,'');
  assert.equal(ui.heading.textContent,B.armsIntegrated.TREE.find(n=>n.id===id).ru);
  assert.ok(ui.effect.textContent.length>0);
  assert.match(ui.actions.innerHTML,/data-arms-delta="1"/);assert.match(ui.actions.innerHTML,/data-arms-delta="-1"/);
  return ui;
}
checkPreview('imprend');checkPreview('imprend');
const locked=B.armsIntegrated.CONFIG.unavailable[0];
assert.ok(locked);checkPreview(locked);
click({armsHero:'first',armsNode:locked,armsDelta:'1'});
assert.deepEqual(plain(S.hero.armsTalents),{});assert.equal(writes,0);
click({armsHero:'first',armsNode:'imprend',armsDelta:'1'});
assert.equal(S.hero.armsTalents.imprend,1);assert.equal(writes,1);assert.equal(refreshes,1);
assert.deepEqual(JSON.parse(stored).armsTalents,{imprend:1});
const first=JSON.parse(stored);S.hero={id:'second',cls:'warrior',armsTalents:{}};
assert.deepEqual(plain(call("armsLoadout('me').talents")),{});
const stale=click({armsHero:'first',armsNode:'imprend'});assert.equal(stale.detail.open,false);assert.equal(writes,1);
click({armsHero:'first',armsNode:'imprend',armsDelta:'1'});assert.equal(writes,1);
S.hero=first;click({armsHero:'first',armsNode:'imprend'},'contextmenu');
assert.deepEqual(plain(S.hero.armsTalents),{});
allowSave=false;click({armsHero:'first',armsNode:'imprend',armsDelta:'1'});
assert.deepEqual(plain(S.hero.armsTalents),{});assert.equal(alerts,1);
allowSave=true;context.st={over:false};const before=writes;
click({armsHero:'first',armsNode:'imprend',armsDelta:'1'});assert.equal(writes,before);context.st=null;
const maxNode=B.armsIntegrated.TREE.find(n=>n.id==='imprend');
S.hero.armsTalents={imprend:maxNode.max};assert.ok(B.armsIntegrated.validate(S.hero.armsTalents,30).ok);
checkPreview('imprend');const beforeMax=writes;
click({armsHero:'first',armsNode:'imprend',armsDelta:'1'});assert.equal(writes,beforeMax);
click({armsHero:'first',armsNode:'imprend',armsDelta:'-1'});assert.equal(S.hero.armsTalents.imprend,maxNode.max-1);
click({armsHero:'first',armsReset:'1'});assert.deepEqual(plain(S.hero.armsTalents),{});
S.hero.armsTalents=plain(B.armsIntegrated.line(30));levels.me=14;
assert.deepEqual(plain(call("armsLoadout('me').talents")),{});
assert.match(call('armsHeroPanel()'),/откроются на 15 уровне/);
levels.me=30;specs.me='prot';assert.deepEqual(plain(call("armsLoadout('me')")),{talents:{}},'Protection main without a saved build');assert.equal(call('armsHeroPanel()'),'');
{const R=B.specTalents.rules('warrior','prot');S.hero.specTalents={prot:plain(R.line(30)),fury:{bad:1}};
 assert.deepEqual(plain(call("armsLoadout('me')")),{talents:plain(R.line(30))},'TALENT-01: own Protection build goes into battle');
 specs.me='fury';assert.deepEqual(plain(call("armsLoadout('me')")),{talents:{}},'an invalid build of another spec is ignored');
 assert.deepEqual(plain(call('specTalentsClean(S.hero,30)')),{prot:plain(R.line(30))});
 assert.deepEqual(plain(call('armsHeroData(S.hero,30)')),plain(B.armsIntegrated.line(30)),'Arms build kept separately');
 delete S.hero.specTalents;}
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
console.log('Arms hero integration: preview without writes, explicit actions, own-level adapter, isolation, validation, rollback and flag-off passed');
