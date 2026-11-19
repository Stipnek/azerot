'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const edit of spec.edits){assert.equal(source.split(edit.old).length-1,1,edit.name);source=source.replace(edit.old,edit.new);}}
new vm.Script(source);
const engine={module:{exports:{}}};vm.runInNewContext(fs.readFileSync('src/scripts/script-05.txt','utf8'),engine,{timeout:15000});const B=engine.module.exports;
const begin=source.indexOf('  function questItemReceipt('),end=source.indexOf('  function navOff()',begin);
const catalogStart=source.indexOf('  const gearItems='),inventoryEnd=source.indexOf('  function equipmentStats(',catalogStart),statsEnd=source.indexOf('  function hasMorbentsBane(',inventoryEnd);
assert.ok(catalogStart>=0&&inventoryEnd>catalogStart&&statsEnd>inventoryEnd&&begin>=0&&end>begin);
const code=source.slice(catalogStart,statsEnd)+source.slice(begin,end);
function fixture(key='kobold_camp',options={}){
 const q={k:key,v56:options.v56!==false,daily:!!options.daily,rep:!!options.rep};
 const hero={cls:options.cls,level:8,items:Object.assign({},options.items),gear:Object.assign({},options.gear),q:{[key]:options.state??2},dly:{},rep:{}};
 const events={xp:0,sounds:0,toasts:[],saved:null,journal:0};
 const tv={st:0},node={textContent:'',classList:{remove(){}}};
 const c={B,S:{hero,money:0,specs:{me:options.spec}},QUESTS:[q],DAY:86400000,PULL_COST:50,
 esc:s=>String(s).replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x])),
 qIdx:k=>k===key?0:-1,qState:k=>hero.q[k]||0,questGoalsDone:()=>options.goals!==false,
 tavOpen(){},completeV57Party(){},qDone(){return false;},showWorld(){},questSound(){events.sounds++;},
 encOf:()=>({res:0}),qMoney:()=>40,giveXp:()=>{events.xp++;return {main:100,mainUp:0};},
 qStones:()=>6,tavOf:()=>tv,setQ:(k,v)=>{hero.q[k]=v;},qRepN:k=>hero.rep[k]||0,
 syncLevel(){},save:()=>{events.saved=JSON.stringify(hero);return options.save!==false;},
 qVisible:()=>false,renderHead(){},renderMap(){},renderJournal(){events.journal++;},$:()=>node,moneyHtml:n=>'<span>'+n+'</span>',
 tvToast:(html,duration)=>events.toasts.push({html,duration})};
 vm.createContext(c);vm.runInContext(code,c);c.key=key;
 return {c,hero,tv,events,turn(){vm.runInContext('turnIn(key)',c);}};
}
let f=fixture();f.turn();assert.equal(f.hero.items[57001],1);assert.ok(f.events.toasts[0].html.includes('Потёртый жилет'));assert.ok(f.events.toasts[0].html.includes('Броня +1'));assert.equal(f.events.toasts[0].duration,6500);assert.equal(JSON.parse(f.events.saved).items[57001],1);
f.turn();assert.equal(f.events.xp,1);assert.equal(f.c.S.money,40);assert.equal(f.tv.st,6);assert.equal(f.events.toasts.length,1);
f=fixture('cl_sven15');f.turn();assert.equal(f.hero.items[2954],1);assert.ok(f.events.toasts[0].html.includes('Штаны Ночного Дозора'));assert.ok(f.events.toasts[0].html.includes('Выносливость +9'));
f=fixture('kobold_camp',{items:{57001:1}});f.turn();assert.equal(f.hero.items[57001],2);assert.ok(f.events.toasts[0].html.includes('Получено в сумку'));assert.equal(f.events.toasts[0].duration,6500);assert.equal(JSON.parse(f.events.saved).items[57001],2);
for(const state of [0,1,3]){f=fixture('kobold_camp',{state});f.turn();assert.equal(f.events.xp,0);assert.equal(f.events.toasts.length,0);assert.equal(f.hero.items[57001],undefined);}
f=fixture('kobold_camp',{goals:false});f.turn();assert.equal(f.events.xp,0);assert.equal(f.hero.items[57001],undefined);
f=fixture('ordinary',{v56:false});f.turn();f.turn();assert.equal(f.events.xp,1);assert.equal(f.events.toasts.length,1);
f=fixture('daily',{daily:true});f.turn();f.turn();assert.equal(f.events.xp,1);assert.equal(f.hero.q.daily,0);assert.ok(f.hero.dly.daily>Date.now());
f=fixture('repeatable',{rep:true});f.turn();f.turn();assert.equal(f.events.xp,1);assert.equal(f.hero.rep.repeatable,1);
f=fixture('kobold_camp',{save:false});f.turn();assert.ok(f.events.toasts[0].html.includes('Не удалось сохранить'));
vm.runInContext("gearItems[0].name='<img src=x onerror=alert(1)>'",f.c);f.c.before={};f.c.after={57001:1};assert.ok(vm.runInContext('questItemReceiptHtml(questItemReceipt(before,after))',f.c).includes('&lt;img'));
let profiles=0;
for(const [cls,spec,profile] of [['warrior','prot','mail:strength'],['paladin','holy','mail:intellect'],['paladin','ret','mail:strength'],['druid','balance','leather:intellect'],['druid','resto','leather:intellect'],['druid','cat','leather:agility'],['druid','bear','leather:agility'],['rogue','combat','leather:agility'],['hunter','mm','leather:agility'],['mage','fire','cloth:intellect'],['priest','holy','cloth:intellect'],['warlock','aff','cloth:intellect']]){
 f=fixture('kobold_camp',{cls,spec});assert.equal(vm.runInContext('questGearProfile(S.hero)',f.c),profile);
 const chest=vm.runInContext('resolveQuestGear(S.hero,key)',f.c);assert.ok(chest);f.turn();assert.equal(f.hero.items[chest.id],1);assert.equal(f.hero.items[57001],undefined);assert.equal(f.hero.gear.chest,undefined);assert.equal(JSON.parse(f.events.saved).items[chest.id],1);
 f.turn();assert.equal(f.events.xp,1);assert.equal(f.hero.items[chest.id],1);
 f.hero.gear.chest=chest.id;const bonuses=vm.runInContext("equipmentStats('me')",f.c),before=B.heroStats(cls,spec,8),after=B.heroStats(cls,spec,8,bonuses);assert.ok(after.hp>before.hp);assert.ok(after.rawAtk>before.rawAtk);
 f.c.loaded=JSON.parse(JSON.stringify(f.hero));assert.equal(vm.runInContext('cleanInventory(loaded.items)[loaded.gear.chest]',f.c),1);assert.equal(vm.runInContext('cleanGear(loaded).chest',f.c),chest.id);
 f=fixture('wolves',{cls,spec});f.turn();assert.equal(Object.values(f.hero.items).reduce((a,b)=>a+b,0),1);
 f=fixture('hogger',{cls,spec});const options=vm.runInContext('questGearOptions(S.hero,key)',f.c);assert.equal(options.length,2);f.turn();assert.equal(f.events.xp,0);assert.equal(f.c.S.money,0);assert.equal(f.tv.st,0);assert.equal(f.hero.q.hogger,2);
 f.c.choice=options[1].id;assert.equal(vm.runInContext('selectQuestGear(S.hero,key,choice)',f.c),true);f.turn();f.turn();assert.equal(f.events.xp,1);assert.equal(f.hero.items[options[1].id],1);assert.equal(f.hero.items[options[0].id],undefined);profiles++;
}
f=fixture('hogger',{cls:'mage',spec:'fire'});assert.equal(vm.runInContext('selectQuestGear(S.hero,key,910003)',f.c),false);f.c.other={cls:'mage'};assert.equal(vm.runInContext('selectQuestGear(other,key,910043)',f.c),false);
f=fixture('hogger',{cls:'druid',spec:'balance'});assert.equal(vm.runInContext('selectQuestGear(S.hero,key,910033)',f.c),true);f.c.S.specs.me='bear';assert.equal(vm.runInContext('resolveQuestGear(S.hero,key)',f.c),false);f.turn();assert.equal(f.events.xp,0);
f=fixture('kobold_camp',{cls:'warrior',spec:'prot',items:{910001:Number.MAX_SAFE_INTEGER}});f.turn();assert.equal(f.events.xp,0);assert.equal(f.hero.q.kobold_camp,2);assert.equal(f.hero.items[910001],Number.MAX_SAFE_INTEGER);assert.equal(f.c.S.money,0);
f=fixture('kobold_camp',{cls:'mage',spec:'fire',state:3});f.turn();assert.equal(Object.keys(f.hero.items).length,0);
f=fixture('kobold_camp',{cls:'mage',spec:'fire',items:{910001:1,57001:1},gear:{chest:910001}});assert.equal(vm.runInContext('cleanGear(S.hero).chest',f.c),undefined);assert.equal(vm.runInContext("equipmentStats('me').strength",f.c),undefined);f.hero.gear.chest=57001;assert.equal(vm.runInContext('cleanGear(S.hero).chest',f.c),57001);
assert.equal(vm.runInContext('gearItems.filter(item=>item.questProfile).length',f.c),20);assert.ok(source.includes('    renderQuestGear(k);'));assert.ok(source.includes('!canEquipQuestGear(h,selected)'));
console.log('Quest receipt regressions and '+profiles+' class/spec progression cases passed with real catalogue, reward functions and Battle stats. Includes explicit choice, overflow, no retroactive grants, character isolation and quantity/load normalization. DOM clicks, actual localStorage and full gameplay still require browser/manual checks.');
