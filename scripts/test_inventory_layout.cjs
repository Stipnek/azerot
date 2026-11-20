'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const p=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(p.sourceSha256,hash);for(const e of p.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,name+': '+e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
const a=source.indexOf('  function azGearTypeCount('),b=source.indexOf('  function azGearStatRows(',a);assert.ok(a>=0&&b>a);const c={};vm.createContext(c);vm.runInContext(source.slice(a,b),c);
for(const [n,label] of [[0,'0 типов'],[1,'1 тип'],[2,'2 типа'],[4,'4 типа'],[5,'5 типов'],[11,'11 типов'],[12,'12 типов'],[14,'14 типов'],[21,'21 тип'],[22,'22 типа'],[25,'25 типов'],[111,'111 типов']])assert.equal(c.azGearTypeCount(n),label);
assert.equal(c.azGearSlotIcon({slot:'legs'}),'M7 5h18v22h-7l-2-13-2 13H7z');assert.notEqual(c.azGearSlotIcon({slot:'legs'}),c.azGearSlotIcon({slot:'chest'}));assert.notEqual(c.azGearSlotIcon({slot:'feet'}),c.azGearSlotIcon({slot:'chest'}));assert.equal(c.azGearSlotIcon({slot:'legs',iconPath:'custom'}),'custom');
assert.ok(source.includes("root.querySelector('.az573-inv').prepend(detail)"));assert.ok(source.includes('height:auto;max-height:none;overflow:visible;min-width:0;overflow-wrap:anywhere'));assert.ok(source.includes("azGearTypeCount(inventory.length)+' · '"));assert.equal(source.split("const group=host.querySelector('#rnext')?.parentElement||host.querySelector('.btns')||host;group.append(b);").length-1,2);
console.log('Inventory layout source regressions passed. Browser geometry and appearance require separate verification.');
