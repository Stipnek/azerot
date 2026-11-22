'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){
 const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));
 assert.equal(spec.sourceSha256,hash,name);
 for(const edit of spec.edits){assert.equal(source.split(edit.old).length-1,1,name+': '+edit.name);source=source.replace(edit.old,edit.new);}
}
new vm.Script(source);
const start=source.indexOf('  function azItemReceiptHtml('),end=source.indexOf('  function turnIn(',start);
assert.ok(start>=0&&end>start);
const c={esc:s=>String(s).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))};
vm.createContext(c);vm.runInContext(source.slice(start,end),c);
const item={name:'Жилет Североземья · кольчуга',slot:'chest',label:'Грудь',questProfile:'mail:strength',requiredLevel:1,armorFlat:32,stamina:1,strength:1,color:'#1eff00'};
assert.equal(c.questItemReceiptHtml([]),'');
for(const count of [1,2,12]){
 const html=c.questItemReceiptHtml([{item,count}]);
 assert.ok(html.includes('width:min(360px,calc(100vw - 48px))'));
 assert.ok(html.includes('padding:0;margin:8px 0 0;list-style:none'));
 assert.ok(html.includes("<details class='az-quest-item-compact'"));
 assert.ok(!/<details\b[^>]*\sopen(?:\s|=|>)/i.test(html));
 const summary=html.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)[1];
 assert.ok(summary.includes(item.name));assert.ok(summary.includes('×'+count));assert.ok(summary.includes('<svg'));
 assert.ok(!summary.includes('Броня'));assert.ok(!summary.includes('Выносливость'));assert.ok(!summary.includes('Требуется уровень'));
 assert.ok(html.includes('Броня +32'));assert.ok(html.includes('Выносливость +1'));assert.ok(html.includes('Сила +1'));
 const full=c.azItemReceiptHtml(item,count);assert.ok(!full.includes('<details'));assert.ok(full.includes('Броня +32'));
}
const multiple=c.questItemReceiptHtml([{item,count:1},{item:{...item,name:'Второй предмет'},count:3}]);
assert.equal((multiple.match(/<details\b/g)||[]).length,2);
const unsafe=c.questItemReceiptHtml([{item:{...item,name:'<img src=x onerror=alert(1)>',color:'red;position:fixed'},count:1}]);
assert.ok(unsafe.includes('&lt;img'));assert.ok(!unsafe.includes('<img'));assert.ok(!unsafe.includes('red;position:fixed'));
assert.ok(source.includes('azItemReceiptHtml(receipt.item, 1)'));
console.log('Quest compact receipt regressions passed: collapsed details, icon/name/quantity, escaping, multiple items and unchanged full-card mode. HTML/VM only; browser geometry and interaction acceptance still required.');
