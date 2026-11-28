'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm');
const load=require('./lib_engine_load.cjs'),B=load(),P=B.armsProto,I=B.armsIntegrated;
const plain=x=>JSON.parse(JSON.stringify(x));
assert.ok(I,'integrated rules exported');
function fixture(mainLevel,compLevel,alloc,integrated=true){return B.createBattle({encounter:'daily_wf_coast',level:30,main:'warrior',seed:13,party:[{cls:'warrior',spec:'arms',level:mainLevel,main:true,proto:'arms',integratedArms:integrated,talents:alloc},{cls:'warrior',spec:'arms',level:compLevel,proto:'arms',integratedArms:integrated,protoNoExtraActive:true}]});}
// TALENT-03 (owner 2026-11-27): Classic tiers compressed to 3 points; Mortal Strike (tier 7) and Sweeping Strikes (tier 5) only through talents,
// companions take both on their line; Heroic Strike stays in the kit; Deep Wounds is the Classic talent (20/40/60%), not a level-15 baseline.
const base=B.WARRIOR_TRAINER||[['heroicstrike',1],['rend',4],['thunder',6],['hamstring',8],['bloodrage',10],['taunt',10],['sunder',10],['overpower',12],['demoshout',14],['revenge',14],['mockingblow',16],['disarm',18],['cleave',20],['retaliation',20],['intimshout',22],['execute',24],['challshout',26],['slam',30]]; // CLASS-01
for(let level=1;level<=B.XPC.cap;level++){
 const main=I.kit(level,{},true),comp=I.kit(level,{},false);
 assert.equal(new Set(main).size,main.length);assert.equal(new Set(comp).size,comp.length);
 assert.deepEqual(plain(main),base.filter(x=>level>=x[1]).map(x=>x[0]),'main without talents: trainer kit only at '+level);
 assert.equal(main.includes('mortal')||main.includes('sweeping'),false);
 assert.equal(comp.includes('sweeping'),level>=22,'companion takes Sweeping Strikes at its 13th point');
 assert.equal(comp.includes('mortal'),level>=28,'companion takes Mortal Strike at its 19th point');
 assert.equal(I.passives(level,{}).length,0,'no free Deep Wounds');
 assert.equal(I.passives(level,I.line(level)).length,level>=16?1:0);
 assert.equal(I.validate(I.line(level),level).ok,true,'companion line valid at '+level);
 for(const slot of I.slots(level,{},true))assert.ok(B.SKILLS[slot.id],'metadata '+slot.id);
 const state=fixture(level,level,{});
 assert.ok(!state.protoErrors || !state.protoErrors.length);
 assert.deepEqual(plain(state.heroes[0].skills),plain(main));
 assert.deepEqual(plain(state.heroes[1].skills),plain(comp));
 assert.ok(!state.heroes[0].pids.includes('deepwounds'),'no ordinary duplicate proc');
 assert.equal(!!state.aura.name,level>=15);
}
assert.equal(I.kit(30,{},true).length,base.length);
assert.equal(I.kit(30,I.line(30),true).length,base.length+2);
assert.equal(I.kit(30,I.line(30),true).filter(x=>x==='mortal').length,1);
const ms=I.TREE.find(n=>n.id==='mortal');
assert.ok(ms && ms.tier===7 && ms.active && ms.req==='sweeping','Mortal Strike is the tier-7 talent');
assert.equal(I.CONFIG.perTier,3);
assert.equal(I.change({},'mortal',1,30).ok,false,'tier 7 needs 18 points below');
assert.equal(I.validate({imprend:3,tactical:1},15).ok,true,'tier 2 needs 3 points');
assert.equal(I.validate({imprend:2,tactical:1},15).ok,false);
assert.equal(I.line(27).mortal,undefined);assert.equal(I.line(28).mortal,1);
assert.equal(I.validate([],30).ok,false);
assert.equal(I.validate(JSON.parse('{"constructor":1}'),30).ok,false);
assert.equal(I.validate({axe:1,imprend:3},20).ok,false,'weapon specializations stay closed');
assert.equal(I.validate({impcharge:2,imprend:3},20).ok,true,'Improved Charge is open (battle-start rage)');
assert.equal(I.bleed(14,{deepwounds:3}).totalOfAtk,0);
for(let rank=0;rank<=3;rank++)assert.ok(Math.abs(I.bleed(15,{deepwounds:rank}).totalOfAtk-[0,.2,.4,.6][rank])<1e-12);
for(const [level,alloc] of [[16,I.line(16)],[30,I.line(30)]]){
 const state=fixture(level,14,alloc),h=state.heroes[0];h.crit=1;h.rage=100;
 for(const e of state.enemies){e.hp=1e9;e.maxHp=1e9;e.atk=0;}
 let proc=false,steps=0;
 while(!state.over && !proc && steps++<200){B.step(state);proc=state.events.some(e=>e.t==='proc'&&e.proc==='deepwounds'&&e.src===h.id);state.events.length=0;}
 assert.ok(proc,'Deep Wounds talent procs at '+level);
 const effects=state.enemies.flatMap(e=>e.effects.filter(f=>f.name==='Глубокие раны'&&f.src===h.id));
 assert.ok(effects.length>0);
 for(const e of state.enemies)assert.ok(e.effects.filter(f=>f.name==='Глубокие раны'&&f.src===h.id).length<=1);
 for(const effect of effects)assert.ok(Math.abs(effect.mult-I.bleed(level,alloc).totalOfAtk/I.bleed(level,alloc).ticks)<1e-12);
}
{const state=fixture(30,14,{}),h=state.heroes[0];h.crit=1;h.rage=100;for(const e of state.enemies){e.hp=1e9;e.maxHp=1e9;e.atk=0;}
 let proc=false,steps=0;while(!state.over&&steps++<120){B.step(state);proc=proc||state.events.some(e=>e.t==='proc'&&e.proc==='deepwounds');state.events.length=0;}
 assert.equal(proc,false,'no Deep Wounds without the talent');}
{const st=fixture(30,14,{impcharge:2,imprend:3});assert.ok(st.heroes[0].rage>=6,'Improved Charge rage at battle start');}
const h=fixture(30,14,I.line(30)).heroes[0];h.rage=100;
assert.equal(B.rageCost(h,'mortal'),I.cost('mortal',h.tal));
assert.equal(I.cost('mortal',{ihs:3}),B.RAGE_COST.mortal,'Improved Heroic Strike no longer changes Mortal Strike');
assert.equal(I.cost('heroicstrike',{ihs:3}),B.RAGE_COST.heroicstrike-3,'Classic Improved Heroic Strike');
h.tal={ihs:2};assert.equal(B.rageCost(h,'heroicstrike'),B.RAGE_COST.heroicstrike-2);h.tal=I.line(30);
h.rage=P.CONFIG.sweeping.rage-1;assert.equal(B.canPayRage(h,'sweeping'),false);
h.rage=P.CONFIG.sweeping.rage;assert.equal(B.rageCost(h,'sweeping'),P.CONFIG.sweeping.rage);
const historical=fixture(15,14,{},false);
assert.ok(!historical.heroes[0].skills.includes('mortal'));
assert.deepEqual(plain(historical.heroes[0].skills),plain(P.kit(15,{})));
const source=load.source('src/scripts/script-06.txt');
function fn(name){const start=source.indexOf('  function '+name+'(');assert.ok(start>=0,name);let depth=0,quote=null,escaped=false;for(let i=source.indexOf('{',start);i<source.length;i++){const c=source[i];if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue;}if(c==='"'||c==="'"){quote=c;continue;}if(c==='{')depth++;if(c==='}'&&--depth===0)return source.slice(start,i+1);}throw Error(name);}
const S={hero:{armsTalents:{}}};
const context=vm.createContext({B,S,ARMS_HERO_MODE:true,openSk:{},esc:x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),wowIcon:()=>''});
vm.runInContext(['armsHeroData','integratedSkillsHtml','skillsHtml','passivesOf','integratedUnitPassives','integratedRageText'].map(fn).join('\n'),context);
for(const level of [1,14,15,19,20,23,24,29,30])for(const isMain of [false,true]){
 const html=vm.runInContext("skillsHtml('warrior',B.CLASSES.warrior.specs.arms,B.CLASSES.warrior,"+isMain+','+level+')',context);
 for(const slot of I.slots(level,{},isMain))assert.ok(html.includes('data-integrated-skill="'+slot.id+'" data-available="'+slot.available+'" data-own-level="'+level+'"'));
 assert.equal(html.includes('data-integrated-passive="deepwounds"'),!isMain&&level>=16);
}
S.hero.armsTalents=plain(I.line(30));
const mainHtml=vm.runInContext('integratedSkillsHtml(30,true)',context),compHtml=vm.runInContext('integratedSkillsHtml(30,false)',context);
assert.ok(mainHtml.includes('data-integrated-skill="sweeping" data-available="true"'));
assert.ok(mainHtml.includes('data-integrated-skill="mortal" data-available="true"'));
assert.ok(compHtml.includes('data-integrated-skill="mortal" data-available="true"'),'companions take ability talents');
assert.equal(vm.runInContext('integratedUnitPassives({integratedArms:true,level:14,tal:{}}).length',context),0);
console.log('Integrated Arms rules passed: 1..30 kits, trainer kit + talent abilities, Mortal Strike at tier 7 (3-point tiers), Classic Deep Wounds talent, costs, own-level UI and historical isolation');
