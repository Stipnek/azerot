'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const spec = JSON.parse(fs.readFileSync('src/scripts/script-06.edits.json', 'utf8'));
let source = fs.readFileSync('src/scripts/script-06.txt', 'utf8');
assert.equal(crypto.createHash('sha256').update(source).digest('hex'), spec.sourceSha256);
for (const edit of spec.edits) {
  assert.ok(edit.old.length > 0);
  assert.equal(source.split(edit.old).length - 1, 1, edit.name);
  source = source.replace(edit.old, edit.new);
}
new vm.Script(source);
const helper = spec.edits[0].new.split('  function finish() {')[0];
function fixture() {
  const context = {S:{hero:{},money:100,amb:null},B:{ENCOUNTERS:{ordinary:{level:1},room:{level:10}}},save:()=>true,moneyHtml:n=>String(n)};
  vm.createContext(context);
  vm.runInContext(helper, context);
  return context;
}
function battle(key='ordinary', count=2) {
  return {result:'win',encounter:key,enemies:Array.from({length:count},()=>({hp:0}))};
}
function credit(context, state) {
  context.state=state;
  return vm.runInContext('creditBattleCoins(state)',context);
}
let c=fixture(), s=battle(), r=credit(c,s);
assert.equal(r.money,20);assert.equal(r.saved,true);assert.equal(c.S.money,120);
assert.equal(credit(c,s),r);assert.equal(c.S.money,120);
c=fixture();s=battle();s.result='lose';assert.equal(credit(c,s),null);assert.equal(c.S.money,100);
c=fixture();s=battle();s.test=true;assert.equal(credit(c,s),null);assert.equal(c.S.money,100);
c=fixture();c.S.amb={};assert.equal(credit(c,battle()),null);assert.equal(c.S.money,100);
c=fixture();c.S.hero=null;assert.equal(credit(c,battle()),null);
c=fixture();assert.equal(credit(c,battle('unknown')),null);
c=fixture();assert.equal(credit(c,battle('ordinary',0)),null);
c=fixture();s=battle();s.enemies.forEach(e=>e.hp=1);assert.equal(credit(c,s),null);
c=fixture();r=credit(c,battle('room',3));assert.equal(r.money,44);assert.equal(c.S.money,144);
credit(c,battle('room',3));assert.equal(c.S.money,188);
c=fixture();c.save=()=>false;s=battle();r=credit(c,s);assert.equal(r.saved,false);credit(c,s);assert.equal(c.S.money,120);
c.receipt=r;assert.ok(vm.runInContext('battleCoinsHtml(receipt)',c).includes('Не закрывайте'));
c=fixture();c.save=()=>{throw Error('storage denied');};r=credit(c,battle());assert.equal(r.saved,false);
assert.equal(vm.runInContext('battleCoinsHtml(null)',c),'');
c=fixture();r=credit(c,battle());c.receipt=r;assert.ok(vm.runInContext('battleCoinsHtml(receipt)',c).includes('Получено: 20'));
console.log('Battle coin tests passed: syntax, source anchors, win/loss/test/ambush, defeated enemies, room scaling, repeat guard, save errors and receipt rendering. Not a browser gameplay test.');
