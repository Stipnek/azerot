'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const spec=JSON.parse(fs.readFileSync('src/scripts/script-06.edits.json','utf8'));
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'),spec.sourceSha256);
for(const edit of spec.edits){assert.equal(source.split(edit.old).length-1,1,edit.name);source=source.replace(edit.old,edit.new);}
new vm.Script(source);
const begin=source.indexOf('  function questItemReceipt('),end=source.indexOf('  function navOff()',begin);
assert.ok(begin>=0&&end>begin);
const code=source.slice(begin,end);
function fixture(key='kobold_camp',options={}){
 const q={k:key,v56:options.v56!==false,daily:!!options.daily,rep:!!options.rep};
 const hero={items:Object.assign({},options.items),q:{[key]:options.state??2},dly:{},rep:{}};
 const events={xp:0,sounds:0,toasts:[],saved:null};
 const tv={st:0},node={textContent:'',classList:{remove(){}}};
 const c={S:{hero,money:0},QUESTS:[q],DAY:86400000,PULL_COST:50,
 gearItems:[{id:57001,name:'Потёртый жилет',label:'Грудь',armorFlat:1},{id:2954,name:'Штаны Ночного Дозора',label:'Ноги',armorFlat:39,stamina:9,intellect:8}],
 esc:s=>String(s).replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x])),
 qIdx:k=>k===key?0:-1,qState:k=>hero.q[k]||0,questGoalsDone:()=>options.goals!==false,
 tavOpen(){},completeV57Party(){},qDone(){return false;},showWorld(){},questSound(){events.sounds++;},
 encOf:()=>({res:0}),qMoney:()=>40,giveXp:()=>{events.xp++;return {main:100,mainUp:0};},
 qStones:()=>6,tavOf:()=>tv,setQ:(k,v)=>{hero.q[k]=v;},qRepN:k=>hero.rep[k]||0,
 syncLevel(){},save:()=>{events.saved=JSON.stringify(hero);return options.save!==false;},
 qVisible:()=>false,renderHead(){},renderMap(){},$:()=>node,moneyHtml:n=>'<span>'+n+'</span>',
 tvToast:(html,duration)=>events.toasts.push({html,duration})};
 vm.createContext(c);vm.runInContext(code,c);c.key=key;
 return {c,hero,tv,events,turn(){vm.runInContext('turnIn(key)',c);}};
}
let f=fixture();f.turn();assert.equal(f.hero.items[57001],1);assert.ok(f.events.toasts[0].html.includes('Потёртый жилет'));assert.ok(f.events.toasts[0].html.includes('Броня +1'));assert.equal(f.events.toasts[0].duration,6500);assert.equal(JSON.parse(f.events.saved).items[57001],1);
f.turn();assert.equal(f.events.xp,1);assert.equal(f.c.S.money,40);assert.equal(f.tv.st,6);assert.equal(f.events.toasts.length,1);
f=fixture('cl_sven15');f.turn();assert.equal(f.hero.items[2954],1);assert.ok(f.events.toasts[0].html.includes('Штаны Ночного Дозора'));assert.ok(f.events.toasts[0].html.includes('Выносливость +9'));
f=fixture('kobold_camp',{items:{57001:1}});f.turn();assert.ok(!f.events.toasts[0].html.includes('Получено в сумку'));assert.equal(f.events.toasts[0].duration,4200);
for(const state of [0,1,3]){f=fixture('kobold_camp',{state});f.turn();assert.equal(f.events.xp,0);assert.equal(f.events.toasts.length,0);assert.equal(f.hero.items[57001],undefined);}
f=fixture('kobold_camp',{goals:false});f.turn();assert.equal(f.events.xp,0);assert.equal(f.hero.items[57001],undefined);
f=fixture('ordinary',{v56:false});f.turn();f.turn();assert.equal(f.events.xp,1);assert.equal(f.events.toasts.length,1);
f=fixture('daily',{daily:true});f.turn();f.turn();assert.equal(f.events.xp,1);assert.equal(f.hero.q.daily,0);assert.ok(f.hero.dly.daily>Date.now());
f=fixture('repeatable',{rep:true});f.turn();f.turn();assert.equal(f.events.xp,1);assert.equal(f.hero.rep.repeatable,1);
f=fixture('kobold_camp',{save:false});f.turn();assert.ok(f.events.toasts[0].html.includes('Не удалось сохранить'));
f.c.gearItems[0].name='<img src=x onerror=alert(1)>';f.c.before={};f.c.after={57001:1};assert.ok(vm.runInContext('questItemReceiptHtml(questItemReceipt(before,after))',f.c).includes('&lt;img'));
console.log('Quest receipt tests passed: actual turnIn function with mocked dependencies; both existing item grants, duplicate guard, quest eligibility, daily/repeatable reset, save warning, escaped text. Not browser gameplay or real-storage integration.');
