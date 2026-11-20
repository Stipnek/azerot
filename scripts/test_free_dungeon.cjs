'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const e of spec.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
const engine={module:{exports:{}}};vm.runInNewContext(fs.readFileSync('src/scripts/script-05.txt','utf8'),engine,{timeout:15000});const B=engine.module.exports;
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
const code=section('  const dungeonRoomReceipts','  function beginBattle(')+section('  function giveXp(','  /* Новый уровень')+section('  function questRewardEncounter(','  function turnIn(');
function fixture(status=3){
 const key='dungeon:deadmines',hero={q:{[key]:status},hxp:{me:B.xpAt(20),g1:0,g2:B.xpAt(30)}},events={begins:[],travel:[],saved:[],buttons:[]},nodes={battle:{hidden:true}};
 const q={k:key,d:'entrance',rep:true,daily:true};
 const c={B,S:{hero,chars:[hero],party:['me','g1'],main:'warrior',level:20,enc:'hogger',auto:false,amb:null,walk:null},run:null,playing:false,tavBusy:null,autoTimer:null,lines:[],QUESTS:[q],PLACES:{entrance:{z:'westfall'}},ZONES:{westfall:{entry:'entrance'}},
 document:{getElementById:id=>id==='v571-services'?{append:b=>events.buttons.push(b)}:id==='free-deadmines-entry'?events.buttons[0]:null},
 gearButton:(text,fn)=>({textContent:text,onclick:fn}),$:id=>nodes[id],travel:(place,fn)=>{events.travel.push(place);fn();},clearTimeout(){},setTimeout(){},partyArg:()=>[],
 isDungeon:key=>key.startsWith('dungeon:'),beginBattle:(key,carry)=>events.begins.push({key,carry}),rosterKeys:()=>['g1','g2'],hLevel:key=>B.levelOf(hero.hxp[key]||0),
 syncLevel:()=>{c.S.level=B.levelOf(hero.hxp.me);},save:()=>{events.saved.push(JSON.stringify(hero));return true;},encOf:key=>key==='dungeon:deadmines'?B.DUNGEONS.deadmines:B.ENCOUNTERS.hogger};
 vm.createContext(c);vm.runInContext(code,c);return {c,hero,events,q,nodes};
}
for(const status of [0,1,2,3]){const f=fixture(status);assert.equal(vm.runInContext('enterFreeDeadmines()',f.c),true);assert.equal(f.c.run.idx,0);assert.equal(f.c.run.carry,null);assert.equal(f.events.begins[0].key,B.DUNGEONS.deadmines.rooms[0]);assert.equal(f.hero.q['dungeon:deadmines'],status);}
let f=fixture();vm.runInContext('mountFreeDeadmines();mountFreeDeadmines()',f.c);assert.equal(f.events.buttons.length,0);assert.equal(f.q.rep,undefined);assert.equal(f.q.daily,undefined);
f.hero.rep={'dungeon:deadmines':2};f.hero.q['dungeon:deadmines']=0;vm.runInContext('mountFreeDeadmines()',f.c);assert.equal(f.hero.q['dungeon:deadmines'],3);
f=fixture();vm.runInContext('enterFreeDeadmines()',f.c);const first=f.c.run,initial=f.hero.hxp.me;
for(const key of B.DUNGEONS.deadmines.rooms){f.c.room={encounter:key,result:'win',heroes:[{hp:100,maxHp:100,mana:50,maxMana:50}]};vm.runInContext('settleDungeonRoom(room)',f.c);const idx=f.c.run.idx,xp=f.hero.hxp.me;vm.runInContext('settleDungeonRoom(room)',f.c);assert.equal(f.c.run.idx,idx);assert.equal(f.hero.hxp.me,xp);}
assert.equal(f.c.run.state,'cleared');assert.equal(f.hero.hxp.me-initial,B.dungeonXp(20,'deadmines'));assert.ok(f.hero.hxp.g1>0);assert.ok(f.hero.hxp.g2>B.xpAt(30));
f.c.run=null;assert.equal(vm.runInContext('enterFreeDeadmines()',f.c),true);assert.notEqual(f.c.run,first);assert.equal(f.c.run.idx,0);assert.equal(f.c.run.kills,0);assert.equal(f.c.run.xp,0);assert.equal(f.c.run.carry,null);
f.c.room={encounter:B.roomKey(f.c.run),result:'lose',heroes:[]};const before=f.hero.hxp.me;vm.runInContext('settleDungeonRoom(room)',f.c);assert.equal(f.c.run.state,'wipe');assert.equal(f.hero.hxp.me,before);
f=fixture();f.c.S.walk={};assert.equal(vm.runInContext('enterFreeDeadmines()',f.c),false);f.c.S.walk=null;f.nodes.battle.hidden=false;assert.equal(vm.runInContext('enterFreeDeadmines()',f.c),false);
f=fixture();const bonus=vm.runInContext("questRewardEncounter('dungeon:deadmines')",f.c);assert.equal(bonus.rooms,null);assert.ok(B.xpFor(20,bonus)>0);assert.ok(B.xpFor(20,bonus)<B.dungeonXp(20,'deadmines'));
assert.ok(source.includes('mountFreeDeadmines();'));assert.ok(source.includes('id="again">Новый забег'));
console.log('Free Deadmines entry, migration, room XP, repeat guards and fresh runs passed. Service instant-start button is absent. Lobby clicks are checked separately in Chromium.');
