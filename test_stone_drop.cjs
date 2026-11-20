'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const e of spec.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
const begin=source.indexOf('  const stoneDropReceipts'),end=source.indexOf('  function creditBattleCoins(',begin);
const cleanStart=source.indexOf('  function cleanTav('),cleanEnd=source.indexOf('  function migrateTav(',cleanStart);
assert.ok(begin>=0&&end>begin&&cleanStart>=0&&cleanEnd>cleanStart);
const helper=source.slice(cleanStart,cleanEnd)+source.slice(begin,end);
function fixture(){
 const h={tav:{st:10,coll:{}}},env={roll:0,saved:[]},math=Object.create(Math);math.random=()=>env.roll;
 const c={h,env,Math:math,S:{hero:h},tavOf:()=>h.tav,
 B:{ENCOUNTERS:{low:{level:2,enemies:['wolf']},pair:{level:2,enemies:['wolf','wolf']},room:{level:20,enemies:['bandit']},first:{level:1,enemies:['wolf']},dummy:{level:2,enemies:['v56_dummy']},tutorial57_team:{level:2,enemies:['wolf']}}},
 save:()=>{env.saved.push(JSON.stringify(h));return true;}};
 vm.createContext(c);vm.runInContext(helper,c);return c;
}
function battle(encounter='low',enemies=[{key:'wolf',hp:0}]){return {result:'win',encounter,enemies};}
function roll(c,state,value=0){c.state=state;c.value=value;return vm.runInContext('rollStoneDrop(state,()=>value)',c);}
function credit(c,state){c.state=state;return vm.runInContext('creditStoneDrop(state)',c);}
let c=fixture();assert.equal(roll(c,battle()),1);assert.equal(roll(c,battle(),0.015),0);assert.equal(roll(c,battle('pair',[{key:'wolf',hp:0},{key:'wolf',hp:0}]),0.015),1);
assert.equal(roll(c,battle('room',[{key:'bandit',hp:0}])),1);
for(const key of ['first','dummy','tutorial57_team','missing'])assert.equal(roll(c,battle(key,[{key:key==='dummy'?'v56_dummy':'wolf',hp:0}])),0);
let s=battle();s.result='lose';assert.equal(roll(c,s),0);s=battle();s.test=true;assert.equal(roll(c,s),0);
assert.equal(roll(c,battle('low',[{key:'wolf',hp:1}])),0);assert.equal(roll(c,battle('low',[{key:'summoned',hp:0}])),0);
assert.equal(roll(c,battle('low',[{key:'wolf',hp:0},{key:'wolf',hp:0}]),0.015),0);
for(const value of [-1,1,NaN,Infinity])assert.equal(roll(c,battle(),value),0);
c=fixture();s=battle();let r=credit(c,s);assert.equal(r.stones,1);assert.equal(c.h.tav.st,11);assert.equal(c.env.saved.length,1);assert.equal(credit(c,s),r);assert.equal(c.h.tav.st,11);assert.equal(c.env.saved.length,1);
c.savedWallet=JSON.parse(c.env.saved[0]).tav;assert.equal(vm.runInContext('cleanTav(savedWallet).st',c),11);
c.h.tav.st+=6;credit(c,battle());assert.equal(c.h.tav.st,18);
c=fixture();c.env.roll=0.9;s=battle();assert.equal(credit(c,s).stones,0);c.env.roll=0;assert.equal(credit(c,s).stones,0);assert.equal(c.h.tav.st,10);assert.equal(c.env.saved.length,0);
c=fixture();c.save=()=>false;r=credit(c,battle());assert.equal(r.saved,false);assert.equal(c.h.tav.st,11);c.receipt=r;assert.ok(vm.runInContext('stoneDropHtml(receipt)',c).includes('Не удалось сохранить'));
c=fixture();c.save=()=>{throw Error('storage');};assert.equal(credit(c,battle()).saved,false);
c=fixture();c.h.tav.st=Number.MAX_SAFE_INTEGER;r=credit(c,battle());assert.equal(r.failed,true);assert.equal(r.stones,0);assert.equal(c.h.tav.st,Number.MAX_SAFE_INTEGER);
c=fixture();c.h.tav=null;assert.equal(credit(c,battle()).failed,true);
c=fixture();c.S.hero=null;assert.equal(credit(c,battle()),null);
c=fixture();r=credit(c,battle());c.receipt=r;assert.ok(vm.runInContext('stoneDropHtml(receipt)',c).includes('Получено: +1'));assert.equal(vm.runInContext('stoneDropHtml(null)',c),'');
assert.ok(source.includes('const stoneDrop = creditStoneDrop(st);'));assert.ok(source.includes('stoneDropHtml(stoneDrop)'));
console.log('Stone drop tests passed: combined syntax, original-enemy eligibility, training exclusions, capped probability, existing wallet credit, no rerolls or double grants, actual cleanTav reload normalization, save errors and rendering. Not a full browser gameplay test.');
