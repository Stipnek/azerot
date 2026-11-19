'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const e of spec.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
const code=section('  const gearItems=','  function equipmentStats(')+section('  var vendorSavePending','  function vendorSaleRender(');
function fixture(money=10000){const h={money,items:{},gear:{},tav:{st:5,coll:{}}},env={fail:false,saved:[]},c={h,env,S:{hero:h},tavOf:()=>h.tav,save:()=>{env.saved.push(JSON.stringify(h));return !env.fail;}};Object.defineProperty(c.S,'money',{get:()=>h.money,set:n=>{h.money=n;}});vm.createContext(c);vm.runInContext(code,c);return c;}
function call(c,expression){return vm.runInContext(expression,c);}
let c=fixture();let r=call(c,'buyVendorItem(h,1433)');assert.equal(r.ok,true);assert.equal(r.saved,true);assert.equal(c.h.money,9880);assert.equal(c.h.items[1433],1);assert.equal(c.h.gear.chest,undefined);let stored=JSON.parse(c.env.saved[0]);assert.equal(stored.money,9880);assert.equal(stored.items[1433],1);
r=call(c,'buyVendorStones(h,10)');assert.equal(r.ok,true);assert.equal(c.h.money,8880);assert.equal(c.h.tav.st,15);stored=JSON.parse(c.env.saved.at(-1));assert.equal(stored.money,8880);assert.equal(stored.tav.st,15);
c=fixture(99);assert.equal(call(c,'buyVendorStones(h,1)').ok,false);assert.equal(c.h.money,99);assert.equal(c.h.tav.st,5);assert.equal(c.env.saved.length,0);assert.equal(call(c,'buyVendorItem(h,1433)').ok,false);
c=fixture();for(const id of [2954,999,-1])assert.equal(call(c,'buyVendorItem(h,'+id+')').ok,false);for(const quantity of [0,-1,2,1.5])assert.equal(call(c,'buyVendorStones(h,'+quantity+')').ok,false);
c.other={items:{},gear:{},tav:{st:0}};assert.equal(call(c,'buyVendorItem(other,1433)').ok,false);assert.equal(call(c,'buyVendorStones(other,1)').ok,false);
c=fixture();c.h.items[1433]=Number.MAX_SAFE_INTEGER;assert.equal(call(c,'buyVendorItem(h,1433)').ok,false);assert.equal(c.h.money,10000);
c=fixture();c.h.tav.st=Number.MAX_SAFE_INTEGER;assert.equal(call(c,'buyVendorStones(h,1)').ok,false);assert.equal(c.h.money,10000);
c=fixture();c.env.fail=true;r=call(c,'buyVendorStones(h,10)');assert.equal(r.ok,true);assert.equal(r.saved,false);assert.equal(c.h.money,9000);assert.equal(c.h.tav.st,15);assert.equal(c.vendorSavePending,true);
assert.equal(call(c,'buyVendorStones(h,1)').ok,false);assert.equal(call(c,'buyVendorItem(h,57001)').ok,false);c.h.items[57001]=2;assert.equal(call(c,'sellInventoryItem(h,57001)'),false);
assert.equal(call(c,'retryVendorSave()'),false);assert.equal(c.h.money,9000);assert.equal(c.h.tav.st,15);c.env.fail=false;assert.equal(call(c,'retryVendorSave()'),true);assert.equal(c.vendorSavePending,false);assert.equal(c.h.money,9000);assert.equal(c.h.tav.st,15);assert.equal(call(c,'sellInventoryItem(h,57001)'),true);assert.equal(c.h.items[57001],1);
c=fixture();c.save=()=>{throw Error('storage');};assert.equal(call(c,'buyVendorItem(h,1433)').saved,false);assert.equal(c.vendorSavePending,true);
assert.ok(source.includes("['equipment','Экипировка'],['stones','Камни призыва'],['sale','Продажа']"));assert.ok(source.includes('vendorSavePending=!saved'));
console.log('Merchant tests passed: complete patched UI syntax, server-independent price lookup, item and stone purchases, single serialized balances, inventory overflow, insufficient money, active-character checks, unsaved trade lock and non-purchasing save retries. Tab interactions and real browser storage are not covered.');
