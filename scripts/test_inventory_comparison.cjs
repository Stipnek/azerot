'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const edit of spec.edits){assert.ok(edit.old);assert.equal(source.split(edit.old).length-1,1,edit.name);source=source.replace(edit.old,edit.new);}}
new vm.Script(source);
const start=source.indexOf('  function azGearStatRows('),end=source.indexOf('  function renderV56Gear(',start);
assert.ok(start>=0&&end>start);
const context={};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
function rows(selected,other,on){context.selected=selected;context.other=other;context.on=on;return JSON.parse(JSON.stringify(vm.runInContext('azGearStatRows(selected,other,on)',context)));}
let result=rows({armorFlat:12,stamina:2},{armorFlat:12,stamina:2},true);
assert.deepEqual(result.map(r=>[r.value,r.delta]),[[12,null],[2,null]]);
result=rows({armorFlat:15},{armorFlat:12},false);assert.equal(result[0].value,15);assert.equal(result[0].delta,3);
result=rows({armorFlat:8},{armorFlat:12},false);assert.equal(result[0].value,8);assert.equal(result[0].delta,-4);
result=rows({armorFlat:12},{armorFlat:12,stamina:2},false);assert.equal(result.find(r=>r.key==='stamina').value,0);assert.equal(result.find(r=>r.key==='stamina').delta,-2);
result=rows({intellect:3},undefined,false);assert.equal(result[0].delta,3);
result=rows({armorFlat:12},{armorFlat:12},false);assert.equal(result[0].delta,0);
assert.deepEqual(rows({},undefined,true),[]);
assert.ok(source.includes("comparison.textContent=' · При замене: '"));
assert.ok(!source.includes('delta=on?-value:value-(other?.[key]||0)'));
console.log('Inventory comparison passed: worn stats stay neutral, upgrades/downgrades are separate, removed stats and empty slots handled. Browser appearance not covered.');
