'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const e of spec.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
function catalogueCode(){const a=source.indexOf('  function dmCatalogue(){'),b=source.indexOf('  function dmGrant(',a);assert.ok(a>=0&&b>a,'Deadmines catalogue dependency');return source.slice(a,b);}
const start=source.indexOf('  function inventoryCount('),end=source.indexOf('  function equipmentStats(',start);assert.ok(start>=0&&end>start);
const catalog=catalogueCode()+source.slice(source.indexOf('  const gearItems='),start),helper=source.slice(start,end);
function fixture(items={},gear={}){const h={items,gear,money:100},c={S:{hero:h},h};Object.defineProperty(c.S,'money',{get:()=>h.money,set:n=>{h.money=n;}});vm.createContext(c);vm.runInContext(catalog+helper,c);return c;}
let c=fixture({57001:3,2954:1});
let clean=vm.runInContext('cleanInventory(h.items)',c);assert.equal(clean[57001],3);assert.equal(clean[2954],1);
c.h.items=JSON.parse(JSON.stringify(clean));assert.equal(vm.runInContext('cleanInventory(h.items)[57001]',c),3);
c=fixture({57001:true,2954:'2',999:4});clean=vm.runInContext('cleanInventory(h.items)',c);assert.equal(clean[57001],1);assert.equal(clean[2954],2);assert.equal(clean[999],undefined);
for(const bad of [-1,1.5,NaN,Infinity,{},'no',false]){c=fixture({57001:bad},{chest:57001});assert.equal(vm.runInContext('inventoryCount(h.items,57001)',c),0);assert.equal(vm.runInContext('cleanGear(h).chest',c),undefined);}
c=fixture({57001:3},{chest:57001});assert.equal(vm.runInContext('bagItemCount(h,gearItems[0])',c),2);
assert.equal(vm.runInContext('sellInventoryItem(h,57001)',c),true);assert.equal(c.h.items[57001],2);assert.equal(c.h.money,105);
assert.equal(vm.runInContext('sellInventoryItem(h,57001)',c),true);assert.equal(c.h.items[57001],1);assert.equal(c.h.money,110);
assert.equal(vm.runInContext('sellInventoryItem(h,57001)',c),false);assert.equal(c.h.gear.chest,57001);assert.equal(c.h.items[57001],1);
c=fixture({57001:1});assert.equal(vm.runInContext('sellInventoryItem(h,57001)',c),true);assert.equal(c.h.items[57001],undefined);assert.equal(c.h.money,105);
c=fixture({2954:1});assert.equal(vm.runInContext('sellInventoryItem(h,2954)',c),false);
c=fixture({57001:2});c.other={items:{57001:2},gear:{}};assert.equal(vm.runInContext('sellInventoryItem(other,57001)',c),false);
assert.equal(vm.runInContext('addInventoryItem(h,57001,1)',c),true);assert.equal(c.h.items[57001],3);
assert.equal(vm.runInContext('addInventoryItem(h,999,1)',c),false);assert.equal(vm.runInContext('addInventoryItem(h,57001,-1)',c),false);
c=fixture({57001:Number.MAX_SAFE_INTEGER});assert.equal(vm.runInContext('addInventoryItem(h,57001,1)',c),false);assert.equal(c.h.items[57001],Number.MAX_SAFE_INTEGER);
c=fixture();vm.runInContext("gearItems.push({id:90001,slot:'feet',label:'Ступни',name:'Test',price:1})",c);assert.equal(vm.runInContext('addInventoryItem(h,90001,4)',c),true);assert.equal(vm.runInContext('cleanInventory(h.items)[90001]',c),4);
assert.ok(source.includes('Math.max(12,Math.ceil(inventory.length/6)*6)'));assert.ok(source.includes('items:cleanInventory(h.items)'));
console.log('Inventory tests passed: combined UI syntax, quantities, legacy values, JSON round-trip, worn-copy reservation, single-copy sales, character isolation, overflow and catalogue extension. Full browser inventory interaction is not covered.');
