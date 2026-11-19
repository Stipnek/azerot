'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-06')&&n.endsWith('.edits.json')).sort()){const spec=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(spec.sourceSha256,hash);for(const e of spec.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a,start);return source.slice(a,b);}
const code=section('  function wmOpen() {','  (function () {\n    const vp = $(\'wm-vp\')')+section('  function zoneSync() {','  function polyBtn() {')+section('  function crossZone(z, next) {','  /* Цепочка «Рыбья опасность»');
const places={},zones={},keys=['elwynn','westfall','redridge','duskwood'];
for(const [index,key] of keys.entries()){const entry=key+'-entry';places[entry]={z:key,x:10+index,y:20+index};zones[key]={name:key,entry,lv:['1–10','10–20','15–25','20–30'][index],wm:[40,60]};}
zones.future={name:'Future',entry:'missing',lv:'30–40'};
const h={zone:'elwynn',q:{story:0},hxp:{me:0}},nodes={};
for(const id of ['wm-map','qsheet','wmsheet','map'])nodes[id]={innerHTML:'',hidden:true,dataset:{},classList:{add(){},remove(){}},setAttribute(){},insertAdjacentHTML(){}};nodes['wm-vp']={clientWidth:400,clientHeight:600};
const events={saved:[],rendered:[],next:0},c={S:{hero:h,level:1,view:null,mapZ:'elwynn'},ZONES:zones,PLACES:places,QUESTS:[],WM_ZONES:[],
 $:id=>nodes[id],heroZone:()=>h.zone,viewZone:()=>c.S.view||h.zone,qVisible:()=>false,qZone:()=>'',zoneHas:key=>key==='elwynn',
 esc:s=>String(s).replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x])),
 document:{body:{classList:{add(){}}}},wmFocus(){},window:{AzerothAudio:{world(){}}},
 spot:entry=>({x:places[entry].x,y:places[entry].y}),clearTimeout(){},setTimeout:fn=>{fn();return 0;},
 save:()=>{events.saved.push(JSON.stringify(h));return true;},renderMap:()=>events.rendered.push(h.zone),zoneIntro(){}};
vm.createContext(c);vm.runInContext(code,c);vm.runInContext('wmOpen()',c);
const html=nodes['wm-map'].innerHTML,buttons=Array.from(html.matchAll(/<button\b[^>]*data-wmz="([^"]+)"[^>]*>/g));assert.equal(buttons.length,5);
for(const key of keys){const button=buttons.find(match=>match[1]===key);assert.ok(button,key);assert.ok(!/\sdisabled(?:\s|>)/.test(button[0]),key);}
assert.ok(/\sdisabled(?:\s|>)/.test(buttons.find(match=>match[1]==='future')[0]));assert.ok(html.includes('опасно для текущего уровня, посещение разрешено'));
const questBefore=JSON.stringify(h.q);
for(const key of keys){c.destination=key;vm.runInContext('crossZone(destination,()=>{})',c);assert.equal(h.zone,key);assert.equal(h.at,zones[key].entry);assert.equal(c.S.view,key);assert.equal(JSON.stringify(h.q),questBefore);assert.equal(h.hxp.me,0);}
c.S.view=null;c.S.mapZ=null;h.zone='duskwood';assert.equal(vm.runInContext('zoneSync()',c),'duskwood');assert.equal(nodes.map.dataset.zone,'duskwood');
assert.ok(!source.includes('const lock = !n && !zoneHas(z)'));
console.log('Free travel tests passed: actual world-map renderer, all four implemented-zone buttons for a level-one hero with no available quests, unavailable-entry guard, actual crossZone transitions, preserved quest/XP state and no automatic map redirection. Browser pointer interaction is not covered.');
