'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){
  const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));
  assert.equal(spec.sourceSha256,hash,name);
  for(const edit of spec.edits){assert.ok(edit.old);assert.equal(source.split(edit.old).length-1,1,edit.name);source=source.replace(edit.old,edit.new);}
}
new vm.Script(source);
const ca=source.indexOf('  function dmCatalogue(){'),cb=source.indexOf('  function dmGrant(',ca);
const gs=source.indexOf('  const gearItems='),start=source.indexOf('  function inventoryCount('),end=source.indexOf('  function equipmentStats(',start);
assert.ok(ca>=0&&cb>ca&&gs>=0&&start>gs&&end>start,'Inventory dependency slices');
const code=source.slice(ca,cb)+source.slice(gs,start)+source.slice(start,end);
const id='quest:ef_bundle:wood';
function fixture(items={},gear={}){
  const h={items,gear,money:100},context={S:{hero:h},h};
  Object.defineProperty(context.S,'money',{get:()=>h.money,set:n=>{h.money=n;}});
  vm.createContext(context);vm.runInContext(code,context);return context;
}
let c=fixture({[id]:4,57001:2,unknown:9},{chest:57001,feet:id});
let clean=vm.runInContext('cleanInventory(h.items)',c);
assert.equal(clean[id],4);assert.equal(clean[57001],2);assert.equal(clean.unknown,undefined);
c.h.items=JSON.parse(JSON.stringify(clean));
assert.equal(vm.runInContext('cleanInventory(h.items)["quest:ef_bundle:wood"]',c),4);
assert.equal(vm.runInContext('cleanGear(h).feet',c),undefined);
assert.equal(vm.runInContext('cleanGear(h).chest',c),57001);
assert.equal(vm.runInContext('sellInventoryItem(h,"quest:ef_bundle:wood")',c),false);
assert.equal(c.h.items[id],4);assert.equal(c.h.money,100);
assert.equal(vm.runInContext('addInventoryItem(h,"quest:ef_bundle:wood",1)',c),false,'Equipment grant API must not grant quest objects');
assert.equal(vm.runInContext('gearItems.some(i=>i.id==="quest:ef_bundle:wood")',c),false,'Quest item must not enter equipment/drop catalogue');
assert.equal(vm.runInContext('sellInventoryItem(h,57001)',c),true);
assert.equal(c.h.items[57001],1);assert.equal(c.h.money,105);
for(const bad of [-1,1.5,null,false,{},'invalid',Infinity,NaN]){
  c=fixture({[id]:bad});assert.equal(vm.runInContext('cleanInventory(h.items)["quest:ef_bundle:wood"]',c),undefined);
}
c=fixture({[id]:'4'});assert.equal(vm.runInContext('cleanInventory(h.items)["quest:ef_bundle:wood"]',c),4);
c=fixture();assert.equal(vm.runInContext('cleanInventory(h.items)["quest:ef_bundle:wood"]',c),undefined);
assert.ok(source.includes('renderWorldQuestBag(root);'));
console.log('Quest inventory helpers passed: combined patch syntax, known-item save round-trip, quantity validation, no equipment/vendor/drop catalogue entry and unchanged ordinary sales. Bag rendering and collection gameplay require separate browser tests.');
