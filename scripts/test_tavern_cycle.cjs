'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
let source=fs.readFileSync('src/scripts/script-06.txt','utf8');const hash=crypto.createHash('sha256').update(source).digest('hex');
for(const name of fs.readdirSync('src/scripts').filter(name=>name.startsWith('script-06')&&name.endsWith('.edits.json')).sort()){const patch=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));assert.equal(patch.sourceSha256,hash);for(const edit of patch.edits){assert.ok(edit.old);assert.equal(source.split(edit.old).length-1,1,edit.name);source=source.replace(edit.old,edit.new);}}
new vm.Script(source);
const begin=source.indexOf('  let tavReversePending = null;'),end=source.indexOf('  function tavPullResolved() {',begin);assert.ok(begin>=0&&end>begin);
const wrapper=source.slice(begin,end);
function fixture(options={}){
 const events={draws:0,skips:0,toasts:[],animations:[],cancelled:0},button={disabled:false,textContent:''},sheet={hidden:false};
 const card={setAttribute(){},removeAttribute(){},getAnimations:()=>[],animate(frames,timing){let resolve,reject;const finished=new Promise((a,b)=>{resolve=a;reject=b;});const animation={frames,timing,finished,resolve,reject,cancel(){events.cancelled++;reject(Error('cancelled'));}};events.animations.push(animation);return animation;}};
 const stage={isConnected:true,classList:{contains:name=>name==='flip'},querySelector:()=>card};
 const c={S:{hero:{id:'original'}},PULL_COST:50,tavBusy:null,reduced:!!options.reduced,ready:options.ready!==false,
 $:id=>id==='tv-stage'?(options.idle?null:stage):id==='tavsheet'?sheet:button,tavReady:()=>c.ready,v571CanFree:()=>!!options.free,
 tvToast:(text)=>events.toasts.push(text),getComputedStyle:()=>({transform:'matrix3d(open)'}),
 tavPullResolved(){events.draws++;},events};
 vm.createContext(c);vm.runInContext(wrapper,c);
 return {c,events,card,stage,sheet,button,pull(){vm.runInContext('tavPull()',c);},cancel(){vm.runInContext('cancelTavReverse()',c);}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 let f=fixture();f.pull();f.pull();f.pull();assert.equal(f.events.draws,0);assert.equal(f.events.animations.length,1);assert.equal(f.button.disabled,true);assert.equal(f.events.animations[0].timing.duration,600);assert.equal(f.events.animations[0].frames[1].transform,'rotateY(0deg)');f.events.animations[0].resolve();await flush();assert.equal(f.events.draws,1);assert.equal(f.button.disabled,false);
 f=fixture();f.pull();f.cancel();f.events.animations[0].resolve();await flush();assert.equal(f.events.draws,0);assert.equal(f.button.disabled,false);
 for(const mode of ['changedHero','hidden','removed','funds']){f=fixture();f.pull();if(mode==='changedHero')f.c.S.hero={};if(mode==='hidden')f.sheet.hidden=true;if(mode==='removed')f.stage.isConnected=false;if(mode==='funds')f.c.ready=false;f.events.animations[0].resolve();await flush();assert.equal(f.events.draws,0,mode);}
 for(const options of [{idle:true},{idle:true,free:true},{reduced:true}]){f=fixture(options);f.pull();assert.equal(f.events.draws,1);assert.equal(f.events.animations.length,0);}
 f=fixture({ready:false});f.pull();assert.equal(f.events.draws,0);assert.equal(f.events.animations.length,0);assert.equal(f.events.toasts.length,1);
 f=fixture();f.c.tavBusy={skip(){f.events.skips++;f.c.tavBusy=null;}};f.pull();assert.equal(f.events.skips,1);assert.equal(f.events.draws,0);assert.equal(f.events.animations.length,0);
 f=fixture();f.card.animate=()=>{throw Error('animation unsupported');};f.pull();assert.equal(f.events.draws,1);assert.equal(f.button.disabled,false);
 f=fixture();f.pull();f.events.animations[0].reject(Error('cancelled externally'));await flush();assert.equal(f.events.draws,0);assert.equal(f.button.disabled,false);
 assert.ok(source.includes("$('tav-result').addEventListener('click'"));assert.ok(source.includes("$('tav-result').addEventListener('keydown'"));assert.ok(source.includes('function tavClose() { cancelTavReverse();'));assert.ok(!source.includes("st.addEventListener('click', function () { if (tavBusy) tavBusy.skip(); });"));
 console.log('Tavern cycle wrapper tests passed: reverse-before-draw, repeated taps, cancellation, changed hero, closed/removed UI, funds recheck, idle/free entry, reduced motion and animation failure fallback. Shared event wiring checked statically. Real visual smoothness, CSS orientation, browser taps and existing summon transactions still require integration/manual checks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
