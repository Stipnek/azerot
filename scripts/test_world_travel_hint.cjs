const fs=require('node:fs'),vm=require('node:vm');
const spec=JSON.parse(fs.readFileSync('src/scripts/script-06.zzzzzzzzzz-world-hint.edits.json','utf8'));
const source=spec.edits[0].new.replace('  function polyBtn() {','');
const tests=`
const assert=require('node:assert/strict');
let S={hero:{}},QUESTS=[],ZONES={a:{entry:'pa',name:'A'},b:{entry:'pb',name:'B'},c:{entry:'missing',name:'C'}},PLACES={pa:{z:'a'},pb:{z:'b'}},states={};
const heroZone=()=> 'a',qState=k=>states[k]||0,qVisible=i=>QUESTS[i].visible!==false,qPlace=q=>q.p,qZone=q=>PLACES[q.p]?.z||q.zone;
function set(rows,s={}){QUESTS=rows;states=s;}
set([{k:'local',p:'pa'},{k:'remote',p:'pb'}]);assert.equal(worldTravelHint(),'');
set([{k:'local',p:'pa'},{k:'remote',p:'pb'}],{remote:1});assert.match(worldTravelHint(),/^Квест/);
set([{k:'remote',p:'pb'}],{remote:2});assert.match(worldTravelHint(),/^Квест/);
set([{k:'remote',p:'pb'}]);assert.match(worldTravelHint(),/^Здесь/);
set([{k:'remote',p:'pb'}],{remote:3});assert.equal(worldTravelHint(),'');
set([{k:'remote',p:'pb',visible:false}]);assert.equal(worldTravelHint(),'');
set([]);assert.equal(worldTravelHint(),'');
PLACES.pc={z:'c'};set([{k:'missing',p:'pc'}],{missing:1});assert.equal(worldTravelHint(),'');
S.hero=null;assert.equal(worldTravelHint(),'');
console.log('9 world travel hint logic cases passed; browser rendering not covered');
`;
vm.runInNewContext(source+'\n'+tests,{require,console});
