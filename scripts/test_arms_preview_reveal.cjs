'use strict';
const assert=require('node:assert/strict'), vm=require('node:vm');
const load=require('./lib_engine_load.cjs'), B=load();
const source=load.source('src/scripts/script-06.txt');
const begin=source.indexOf('  /* ARMS_HERO_BEGIN */'), end=source.indexOf('  /* ARMS_HERO_END */',begin);
assert.ok(begin>=0 && end>begin);
function scenario(mode) {
  const frames=[], scrolls=[];
  const detail={dataset:{armsHelp:'ihs'},open:false};
  const box={hidden:true}, note={textContent:''}, actions={innerHTML:''};
  const fields={'[data-arms-inspector]':box,'[data-arms-status]':note,'[data-arms-actions]':actions,
    '[data-arms-heading]':{textContent:''},'[data-arms-effect]':{textContent:''}};
  const panel={
    querySelectorAll(selector){assert.ok(['details[data-arms-help]','details[data-arms-help][open]'].includes(selector));return selector.endsWith('[open]')&&!detail.open?[]:[detail];},
    querySelector(selector){if(selector==='details[data-arms-help][open]')return detail.open?detail:null;assert.ok(Object.hasOwn(fields,selector));return fields[selector];}
  };
  const button={dataset:{armsHero:'reveal-test',armsNode:'ihs'},isConnected:mode!=='detached',
    closest(selector){assert.equal(selector,'[data-arms-panel]');return panel;},
    scrollIntoView(options){scrolls.push(JSON.parse(JSON.stringify(options)));}};
  const S={hero:{id:'reveal-test',armsTalents:{}},main:'warrior'};
  const context=vm.createContext({B,S,ARMS_HERO_MODE:true,st:null,esc:String,hLevel:()=>30,specKey:()=>'arms',
    document:{addEventListener(){}},window:{alert(){throw Error('Unexpected alert');}},
    requestAnimationFrame(callback){frames.push(callback);},
    save(){throw Error('Preview must not save');},showWorld(){throw Error('Preview must not refresh world');},
    ev:{type:'click',target:{closest:()=>button},preventDefault(){},stopPropagation(){}}});
  vm.runInContext(source.slice(begin,end),context);
  const before=JSON.stringify(S);
  vm.runInContext('armsHeroAction(ev)',context);
  assert.equal(detail.open,true);assert.equal(box.hidden,false);assert.equal(JSON.stringify(S),before);
  assert.equal(frames.length,mode==='detached'?0:1);
  if(mode==='removed')button.isConnected=false;
  if(mode==='closed')detail.open=false;
  if(mode==='hidden')box.hidden=true;
  frames.forEach(callback=>callback());
  assert.deepEqual(scrolls,mode==='active'?[{block:'nearest',inline:'nearest'}]:[]);
  assert.equal(JSON.stringify(S),before);
}
for(const mode of ['active','detached','removed','closed','hidden'])scenario(mode);
console.log('Arms preview reveal: connected selection only, stale/closed guards and no writes passed');
