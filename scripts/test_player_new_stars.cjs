'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'src/scripts');
let source = fs.readFileSync(path.join(dir, 'script-06.txt'), 'utf8');
for (const name of fs.readdirSync(dir).filter(n => n.startsWith('script-06') && n.endsWith('.edits.json')).sort()) {
  const spec = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  for (const edit of spec.edits) {
    assert.ok(edit.old, name);
    assert.equal(source.split(edit.old).length - 1, 1, name + ': ' + edit.name);
    source = source.replace(edit.old, () => edit.new);
  }
}
function section(start, end) {
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a, start);
  return source.slice(a, b);
}
const paidName = source.includes('function tavPullResolved()') ? 'tavPullResolved' : 'tavPull';
const paid = section('  function ' + paidName + '()', '  function tavReveal(');
const free = section('  function v57Hire()', '  function completeV57Party(');
const tier = source.match(/function tavTier\(g\) \{[^}]+\}/);
assert.ok(tier);
function setup(isFree, existing) {
  const table = {st:100,coll:existing ? {gexisting:existing} : {}};
  const math = Object.create(Math); math.random = () => 0;
  const ctx = {Math:math, tavBusy:null, PULL_COST:50, LIMIT:5,
    RAR:[{w:100,n:'Ordinary'},{w:0,n:'Uncommon'},{w:0,n:'Rare'},{w:0,n:'Epic'},{w:0,n:'Legendary'}], AZ54_LEG:[],
    B:{CLASSES:{warrior:{specs:{prot:{}}}}},
    S:{hero:{cls:'warrior',hxp:{},v57onboarding:false},specs:{},party:[],tab:'map'},
    tavOf:()=>table, v571CanFree:()=>isFree, renderHead:()=>{},
    az54HeroName:()=> 'Test', newGid:()=> 'gnew', pickRace:()=> 'human',
    save:()=>true, esc:x=>String(x), tavBonus:()=>0,
    tavReveal:(o)=>{ctx.reveal=o;}};
  ctx.S.hero.tav=table;
  vm.createContext(ctx);
  vm.runInContext(paid+'\n'+free+'\n'+tier[0],ctx);
  return {ctx,table};
}
let env=setup(false);
vm.runInContext(paidName+'()',env.ctx);
assert.equal(env.table.coll.gnew.k,0);
assert.equal(env.ctx.reveal.k1,0);
assert.equal(env.table.st,50);
env=setup(true);
vm.runInContext('v57Hire()',env.ctx);
assert.equal(env.table.coll.gnew.k,0);
assert.equal(env.ctx.reveal.k1,0);
assert.equal(env.table.st,100);
assert.equal(env.ctx.S.hero.v57recruit,'gnew');
for (const rank of [0,1,3,4]) {
  const hero={cls:'warrior',sp:'prot',br:0,r:0,k:rank,n:'Existing'};
  env=setup(false,hero); vm.runInContext(paidName+'()',env.ctx);
  assert.equal(hero.k,rank+1); assert.equal(env.ctx.reveal.k1,rank+1);
}
const hero={cls:'warrior',sp:'prot',br:0,r:0,k:5,n:'Existing'};
env=setup(false,hero);vm.runInContext(paidName+'()',env.ctx);
assert.equal(hero.r,1);assert.equal(hero.k,1);
assert.equal(vm.runInContext('tavTier({r:0,k:0})',env.ctx),0);
for (let r=0;r<=4;r++) for(let k=1;k<=5;k++) {
  assert.equal(vm.runInContext('tavTier({r:'+r+',k:'+k+'})',env.ctx),r*4+k-1);
}
console.log('PASS: paid/free zero-star grants and reveals; duplicates, existing rank bonuses and ascension preserved.');
