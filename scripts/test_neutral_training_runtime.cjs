'use strict';
const assert=require('node:assert/strict'),B=require('./lib_engine_load.cjs')(),plain=x=>JSON.parse(JSON.stringify(x));
const expected={warrior:['heroicstrike','rend','thunder'],paladin:['crusader','judgement','hoj'],druid:['wrath','moonfire','entangle'],priest:['smiteh','swp','mindblast'],mage:['fireball','frostbolt','missiles'],hunter:['raptor','serpent','arcshot'],rogue:['sinister','eviscerate','sliceanddice'],warlock:['shadowbolt','immolate','corruption']};
const LEVELS={warrior:[1,4,6],paladin:[1,4,8],druid:[1,4,8],priest:[1,4,10],mage:[1,4,8],hunter:[1,4,6],rogue:[1,1,10],warlock:[1,1,4]}; // PLAY-11 (owner 2026-11-27, option A): Classic trainer levels
const SHAPE=B.neutralTraining.shape;
function make(cls,spec,level,extra={}){return B.createBattle({party:[{cls,spec,level,main:true,neutralTraining:true,...extra}],main:cls,level,encounter:'test',seed:901,test:{mode:'dps',level,count:3,limit:100}});}
function turn(st){st.heroes[0].tm=2000;st.enemies.forEach(e=>{e.tm=0;});return B.step(st);}
function view(h){const keys=['spec','ai','role','maxHp','atk','armor','res','spd','crit','threatMult','type','healPow','fury','shadowform','pids','skills','primary','resource','maxEnergy','energy','maxRage','rage','maxMana','mana','maxCp','cp','effects'];return plain(Object.fromEntries(keys.map(k=>[k,h[k]])));}
let profiles=0;
for(const [cls,c]of Object.entries(B.CLASSES)){
 for(const level of [1,2,4,5,8,9,14]){
  let first;
  for(const spec of Object.keys(c.specs)){
   const st=make(cls,spec,level),h=st.heroes[0],v=view(h);
   assert.equal(h.neutralTraining,true);assert.equal(h.spec,null);assert.equal(h.role,'training');assert.equal(h.ai,'neutral_training');
   assert.deepEqual(plain(h.skills),expected[cls].filter((id,i)=>level>=LEVELS[cls][i]));assert.deepEqual(plain(h.pids),[]);assert.deepEqual(plain(h.effects),[]);
   assert.equal(h.autoMul,SHAPE[cls].auto);assert.equal(h.trainSkill,SHAPE[cls].skill);for(const key of ['parryBase','dodgeBase','impwps','shatter','critMul','arcConc','mdAll','mdMagic','mdTaken'])assert.ok(!h[key],cls+' inherited '+key);assert.equal(B.autoOf(cls,h.spec).hits||1,1);assert.equal(h.fury,false);assert.equal(h.shadowform,false);assert.equal(h.healPow,0);assert.equal(h.threatMult,1);assert.deepEqual(plain(st.aura),{res:[]});
   if(first)assert.deepEqual(v,first);else first=v;
   assert.equal(h.resource,cls==='warrior'?'rage':cls==='rogue'?'energy':'mana');assert.equal(h.maxCp,cls==='rogue'?5:0);
   const ev=turn(st);if(level===1)assert.ok(ev.some(e=>e.t==='skill'&&e.src===h.id&&expected[cls].includes(e.skill)),cls+': a Classic level-1 ability from level 1');profiles++;
  }
 }
 const base=Object.keys(c.specs)[0],st=make(cls,base,10),h=st.heroes[0],used=new Set();
 st.enemies.forEach(e=>{e.boss=false;});h.crit=1;
 for(let i=0;i<25;i++){if(h.maxMana)h.mana=h.maxMana;if(h.maxEnergy)h.energy=h.maxEnergy;if(h.maxRage)h.rage=h.maxRage;
  for(const e of turn(st))if(e.t==='skill'&&e.src===h.id){assert.ok(expected[cls].includes(e.skill));used.add(e.skill);}
  assert.ok(h.mana>=0&&h.mana<=h.maxMana);assert.ok(h.energy>=0&&h.energy<=h.maxEnergy);assert.ok(h.rage>=0&&h.rage<=h.maxRage);assert.ok(h.cp>=0&&h.cp<=h.maxCp);assert.deepEqual(plain(h.pids),[]);
 }
 assert.deepEqual([...used].sort(),expected[cls].slice().sort(),cls+' must actually use all three actives in suitable conditions');
 assert.ok(!h.effects.some(f=>['veng','hidden','nfb'].includes(f.kind)));assert.ok(!st.enemies.some(e=>e.effects.some(f=>['Глубокие раны','Воспламенение'].includes(f.name))));
 const dry=make(cls,base,2),d=dry.heroes[0];d.mana=0;d.energy=0;d.rage=0;d.atk=0;
 assert.ok(!turn(dry).some(e=>e.t==='skill'&&e.src===d.id),cls+' must wait for its resource');
 for(const spec of Object.keys(c.specs)){
  const normal=make(cls,spec,15,{neutralTraining:false}),boundary=make(cls,spec,15);
  assert.deepEqual(plain(boundary),plain(normal));assert.notEqual(boundary.heroes[0].neutralTraining,true);
  const off=make(cls,spec,9,{neutralTraining:false}),absent=make(cls,spec,9,{neutralTraining:undefined});assert.deepEqual(plain(off),plain(absent));
 }
}
for(const [cls,c]of Object.entries(B.CLASSES))for(const spec of Object.keys(c.specs)){
 const lead={cls,spec,level:15,main:true},comp={cls:'rogue',spec:'subt',level:9,neutralTraining:true};
 assert.deepEqual(plain(B.leaderAura([lead,comp])),plain(B.leaderAura([lead])));
}
for(const cls of ['paladin','druid']){const st=make(cls,B.CLASSES[cls].def,9);for(let i=0;i<8;i++){st.heroes[0].mana=st.heroes[0].maxMana;turn(st);}assert.ok(!st.enemies.some(e=>e.effects.some(f=>f.kind==='stun')));}
for(const spec of ['aff','demo','destro']){const st=make('warlock',spec,9,{pet:'imp'}),h=st.heroes[0],pet=st.pets[0];assert.ok(pet);assert.ok(!h.mdMagic&&!h.mdAll&&!h.mdTaken);assert.ok(!pet.frenzy);const ref=make('warlock','aff',9,{pet:'imp'}).pets[0];for(const k of ['atk','maxHp','crit','spd'])assert.equal(pet[k],ref[k]);}
for(const level of [undefined,0,-1,1.5,'2',NaN])assert.throws(()=>make('mage','fire',level),/explicit own level/);
assert.throws(()=>make('warrior','arms',9,{proto:'arms'}),/cannot use a specialization prototype/);
const trained={cls:'warrior',spec:'prot',main:true,level:9,neutralTraining:true},copy=JSON.stringify(trained);Object.freeze(trained);B.createBattle({party:[trained],level:9,encounter:'test',seed:901});assert.equal(JSON.stringify(trained),copy);
console.log('Neutral combat foundation passed:',profiles,'own-level/profile cases; all 24 skills cast, resource waits, no future passives/auras/pet bonuses, level-15 and opt-out boundaries. UI activation/save migration are intentionally not covered.');
