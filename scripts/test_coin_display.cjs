'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const spec=JSON.parse(fs.readFileSync('src/scripts/script-06.edits.json','utf8'));
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');
for(const edit of spec.edits){assert.equal(source.split(edit.old).length-1,1,edit.name);source=source.replace(edit.old,edit.new);}
const begin=source.indexOf('  function moneyParts('),end=source.indexOf('  const Q_MARK',begin);
assert.ok(begin>=0&&end>begin);
const c={};vm.createContext(c);vm.runInContext(source.slice(begin,end),c);
function show(n){c.amount=n;return vm.runInContext('moneyHtml(amount)',c);}
for(const [amount,names] of [[0,['медь']],[99,['медь']],[100,['серебро']],[101,['серебро','медь']],[10000,['золото']],[10001,['золото','медь']],[10101,['золото','серебро','медь']]]){
 const html=show(amount);assert.equal((html.match(/<img /g)||[]).length,names.length);
 for(const name of names)assert.ok(html.includes('alt="'+name+'"'));
 assert.ok(!html.includes('src="https:'));
}
assert.ok(show(10101).includes('1 <img'));
assert.equal(show(-10),show(0));
for(const key of ['gold','silver','copper'])assert.ok(show(10101).includes('data:image/png;base64,__AZEROT_COIN_ICON_'+key+'__'));
console.log('Coin formatter tests passed; PNG marker resolution and verified fetching are exercised by the subsequent full build.');
