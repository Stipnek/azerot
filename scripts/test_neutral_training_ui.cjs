'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{createRequire}=require('node:module');
const fixturePath=path.resolve(__dirname,'test_spec15_transition.cjs');
const extra=`
vm.runInContext(['neutralTrainingText','neutralTrainingSkillsHtml','armsHeroPanel','skillsHtml','integratedUnitPassives','previewStats','kStats'].map(fn).join(';'),context);
sandbox.wowIcon=()=>'<i></i>';sandbox.passivesOf=sp=>sp.passives||(sp.passive?[sp.passive]:[]);
sandbox.esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
sandbox.ARMS_HERO_MODE=true;sandbox.SPEC_LEVEL=15;
let cases=0;
for(const [cls,c] of Object.entries(B.CLASSES))for(const roll of [0,0.999999])for(const level of [1,2,5,9,14]){
 const raw=character(level,c.def);raw.cls=cls;raw.race=cls==='druid'?'nelf':cls==='hunter'?'dwarf':'human';raw.specs[cls]=c.def;raw.autoSpec15={version:1,roll,chosen:null};install(raw);S.party=['me'];
 assert.deepEqual(plain(call("armsLoadout('me')")),{neutralTraining:true});assert.ok(!call("armsLoadout('g_low').neutralTraining"));
 const party=plain(call('partyArg()')),state=B.createBattle({party,main:cls,level:30,encounter:'daily_wf_coast',seed:13}),h=state.heroes[0];
 assert.equal(h.neutralTraining,true);assert.equal(h.level,level);assert.equal(h.spec,null);assert.deepEqual(plain(h.skills),plain(B.neutralTraining.active(cls,level)));assert.deepEqual(plain(call('integratedUnitPassives({neutralTraining:true})')),[]);
 const view=plain(call("kStats('me')"));assert.equal(view.role,'training');assert.equal(view.unit.spec,null);assert.deepEqual(view.primary,plain(h.primary));
 const html=call('armsHeroPanel()'),generic=call("skillsHtml(S.main,B.specOf(S.main,specKey('me')),B.CLASSES[S.main],true,hLevel('me'))");assert.equal(html,generic);assert.ok(html.includes('data-neutral-training="'+cls+'"'));assert.ok(!html.includes('data-arms-panel'));
 for(const slot of B.neutralTraining.slots(cls,level)){const tag=html.match(new RegExp('<li[^>]*data-neutral-skill="'+slot.id+'"[^>]*>'));assert.ok(tag);assert.ok(tag[0].includes('data-available="'+slot.available+'"'));assert.ok(tag[0].includes('data-own-level="'+level+'"'));}
 assert.equal(call('save()'),true);const saved=JSON.parse(values.get('isolated-test')).chars[0];install(saved);assert.equal(S.hero.autoSpec15.roll,roll);assert.equal(S.hero.autoSpec15.chosen,null);assert.equal(S.hero.money,12345);assert.deepEqual(plain(S.hero.items),{'57001':3});assert.deepEqual(plain(S.hero.gear),{chest:57001});
 S.hero.hxp.me=B.xpAt(15);call('syncLevel()');assert.ok(!call("armsLoadout('me').neutralTraining"));const choices=Object.keys(c.specs).filter(s=>c.specs[s].role==='dd').sort();assert.equal(S.specs.me,choices[Math.floor(roll*choices.length)]);
 const after=B.createBattle({party:plain(call('partyArg()')),main:cls,level:30,encounter:'daily_wf_coast',seed:13}).heroes[0];assert.ok(!after.neutralTraining);assert.equal(after.spec,S.specs.me);
 const expected=cls==='warrior'&&after.spec==='arms'?B.armsIntegrated.kit(15,{},true):B.abilityProgression.active(cls,after.spec,15);assert.deepEqual(plain(after.skills),plain(expected));cases++;
}
install(character(14,'prot'));assert.ok(!call("armsLoadout('me').neutralTraining"));
for(const marker of [{version:2,roll:0,chosen:null},{version:1,roll:-1,chosen:null},{version:1,roll:1,chosen:null},{version:1,roll:'0',chosen:null},{version:1,roll:0,chosen:'arms'}]){S.hero.autoSpec15=marker;assert.ok(!call("armsLoadout('me').neutralTraining"));}
S.hero.autoSpec15={version:1,roll:0,chosen:null};sandbox.ARMS_HERO_MODE=false;assert.deepEqual(plain(call("armsLoadout('me')")),{});sandbox.ARMS_HERO_MODE=true;
const originalB=sandbox.B;sandbox.B={...B,neutralTraining:{...B.neutralTraining,slots:(cls,level)=>B.neutralTraining.slots(cls,level).map(s=>({...s,name:'<unsafe>',description:'<unsafe-description>'}))}};
const escaped=call("neutralTrainingSkillsHtml('mage',2)");assert.ok(escaped.includes('&lt;unsafe&gt;'));assert.ok(escaped.includes('&lt;unsafe-description&gt;'));assert.ok(!escaped.includes('<unsafe>'));sandbox.B=originalB;
assert.ok(!call("neutralTrainingText('heroicstrike',B.SKILLS.heroicstrike.text)").includes('сохраняет 20'));
assert.ok(source.includes("u.neutralTraining ? neutralTrainingText(sid,d.text) : d.text"));assert.ok(source.includes("u.neutralTraining ? 'Без специализации' : RN[u.role]"));
console.log('New-main neutral UI adapter passed:',cases,'class/roll/own-level cases, actual partyArg and previewStats, shared slots, reload, resources, 14/15 DD replacement, escaping, old heroes and flag-off. Browser click/layout coverage remains separate.');
`;
vm.runInNewContext(fs.readFileSync(fixturePath,'utf8')+'\n'+extra,{require:createRequire(fixturePath),console},{filename:fixturePath,timeout:30000});
