'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const e of spec.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
function catalogueCode(){const a=source.indexOf('  function dmCatalogue(){'),b=source.indexOf('  function dmGrant(',a);assert.ok(a>=0&&b>a,'Deadmines catalogue dependency');return source.slice(a,b);}
const inventory=source.indexOf('  function inventoryCount('),inventoryEnd=source.indexOf('  function equipmentStats(',inventory);
const drops=source.indexOf('  const worldDropReceipts'),dropsEnd=source.indexOf('  function creditBattleCoins(',drops);
assert.ok(inventory>=0&&inventoryEnd>inventory&&drops>=0&&dropsEnd>drops);
const catalog=catalogueCode()+source.slice(source.indexOf('  const gearItems='),inventory);
const helper=catalog+source.slice(inventory,inventoryEnd)+source.slice(drops,dropsEnd);
function fixture(level=5){
 const h={level,items:{},gear:{}},env={rolls:[0,0],saved:[]},math=Object.create(Math);math.random=()=>env.rolls.shift()??0.5;
 const c={h,env,Math:math,S:{hero:h},hLevel:()=>h.level,
 B:{ENCOUNTERS:{low:{level:2,enemies:['wolf']},pair:{level:2,enemies:['wolf','wolf']},mid:{level:5,enemies:['bandit']},high:{level:11,enemies:['bandit']},dummy:{level:5,enemies:['v56_dummy']},tutorial57_train:{level:5,enemies:['wolf']}}},
 save:()=>{env.saved.push(JSON.stringify(h));return true;},
 esc:s=>String(s).replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]))};
 vm.createContext(c);vm.runInContext(helper,c);return c;
}
function battle(encounter='low',enemies=[{key:'wolf',hp:0}]){return {result:'win',encounter,enemies};}
function roll(c,state,values=[0,0]){c.state=state;c.values=values;return vm.runInContext('rollWorldDrop(state,h.level,()=>values.shift())',c);}
function credit(c,state){c.state=state;return vm.runInContext('creditWorldDrop(state)',c);}
let c=fixture();assert.equal(roll(c,battle()).id,1433);assert.equal(roll(c,battle(),[0.03]),null);
assert.equal(roll(c,battle('pair',[{key:'wolf',hp:0},{key:'wolf',hp:0}]),[0.025,0]).id,1433);
assert.equal(roll(c,battle(),[0.025]),null);
assert.equal(roll(c,battle('mid',[{key:'bandit',hp:0}]),[0,0.99]).id,1427);
c=fixture(2);assert.equal(roll(c,battle('mid',[{key:'bandit',hp:0}]),[0,0.99]).id,1433);
c=fixture(1);assert.equal(roll(c,battle()),null);
c=fixture();for(const key of ['high','dummy','tutorial57_train','missing'])assert.equal(roll(c,battle(key,[{key:key==='dummy'?'v56_dummy':'wolf',hp:0}])),null);
let s=battle();s.test=true;assert.equal(roll(c,s),null);s=battle();s.result='lose';assert.equal(roll(c,s),null);
assert.equal(roll(c,battle('low',[{key:'wolf',hp:1}])),null);assert.equal(roll(c,battle('low',[{key:'summoned',hp:0}])),null);
assert.equal(roll(c,battle('low',[{key:'wolf',hp:0},{key:'wolf',hp:0}]),[0.025]),null);
for(const value of [-1,1,NaN,Infinity])assert.equal(roll(c,battle(),[value]),null);
c=fixture();s=battle();let r=credit(c,s);assert.equal(r.item.id,1433);assert.equal(c.h.items[1433],1);assert.equal(c.h.gear.chest,undefined);assert.equal(c.env.saved.length,1);
assert.equal(credit(c,s),r);assert.equal(c.h.items[1433],1);assert.equal(c.env.saved.length,1);
c.env.rolls=[0,0];credit(c,battle());assert.equal(c.h.items[1433],2);assert.equal(JSON.parse(c.env.saved.at(-1)).items[1433],2);
c.h.items=JSON.parse(c.env.saved.at(-1)).items;assert.equal(vm.runInContext('cleanInventory(h.items)[1433]',c),2);
c=fixture();c.env.rolls=[0.9];s=battle();r=credit(c,s);assert.equal(r.item,null);c.env.rolls=[0,0];assert.equal(credit(c,s).item,null);assert.equal(c.h.items[1433],undefined);
c=fixture();c.save=()=>false;r=credit(c,battle());assert.equal(r.saved,false);assert.equal(c.h.items[1433],1);c.receipt=r;assert.ok(vm.runInContext('worldDropHtml(receipt)',c).includes('Не удалось сохранить'));
c=fixture();c.h.items[1433]=Number.MAX_SAFE_INTEGER;r=credit(c,battle());assert.equal(r.failed,true);assert.equal(r.item,null);assert.equal(c.env.saved.length,0);
c=fixture();r=credit(c,battle());c.receipt=r;assert.ok(vm.runInContext('worldDropHtml(receipt)',c).includes('Лоскутная броня'));assert.equal(vm.runInContext('worldDropHtml(null)',c),'');
assert.ok(source.includes('const worldDrop = creditWorldDrop(st);'));assert.ok(source.includes('worldDropHtml(worldDrop)'));assert.ok(source.includes('action.disabled=!on&&hLevel(\'me\')<required'));
console.log('Starter world-drop tests passed: complete patched UI parses, eligible kills, bounded probability, level filtering, training exclusions, repeat/no-reroll protection, real inventory helpers, saved quantities and receipt errors. Full browser gameplay and final item artwork are not covered.');
