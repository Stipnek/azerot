'use strict';
const assert=require('node:assert/strict'), vm=require('node:vm');
const load=require('./lib_engine_load.cjs'), B=load();
const source=load.source('src/scripts/script-06.txt');
const begin=source.indexOf('  /* ARMS_HERO_BEGIN */'), end=source.indexOf('  /* ARMS_HERO_END */',begin);
assert.ok(begin>=0 && end>begin);
function scenario(mode) {
  const frames=[], scrolls=[];
  const detail={dataset:{armsHelp:'ihs'},open:false};
  const rect=(top,height)=>({x:6,y:top,top,bottom:top+height,width:738,height});
  const values={};let styleResets=0,position=100;
  const naturalHeight=mode==='shrink'?180:102.59375;
  const box={hidden:true,style:{maxHeight:'',removeProperty(name){assert.equal(name,'max-height');this.maxHeight='';styleResets++;}},
    getBoundingClientRect(){const height=Math.min(naturalHeight,parseFloat(this.style.maxHeight)||Infinity);return rect(336-height,height);}};
  const close={getBoundingClientRect:()=>rect(0,44)};
  const reset={getBoundingClientRect:()=>rect(342-Math.ceil(box.getBoundingClientRect().height)-12-56,56)};
  const dialog={parentElement:null,clientHeight:342,scrollHeight:342,clientTop:0,
    style:{setProperty(key,value){assert.equal(key,'--arms-inspector-height');values[key]=value;}},
    getBoundingClientRect:()=>rect(0,342),
    querySelector(selector){assert.equal(selector,':scope>button.btn');return close;},
    contains(target){return target===scroller||target===dialog;}};
  const scroller={parentElement:dialog,clientTop:0,clientHeight:330,scrollHeight:1000,
    getBoundingClientRect:()=>rect(6,330),
    get scrollTop(){return position;},set scrollTop(value){const next=Math.max(0,Math.min(670,value));scrolls.push(next-position);position=next;}};
  const note={textContent:''},actions={innerHTML:''};
  const fields={'[data-arms-inspector]':box,'[data-arms-status]':note,'[data-arms-actions]':actions,
    '[data-arms-heading]':{textContent:''},'[data-arms-effect]':{textContent:''},
    '[data-arms-reset]':{parentElement:reset}};
  const panel={
    closest(selector){assert.equal(selector,'dialog');return dialog;},
    querySelectorAll(selector){assert.ok(['details[data-arms-help]','details[data-arms-help][open]'].includes(selector));return selector.endsWith('[open]')&&!detail.open?[]:[detail];},
    querySelector(selector){if(selector==='details[data-arms-help][open]')return detail.open?detail:null;assert.ok(Object.hasOwn(fields,selector),selector);return fields[selector];}
  };
  const initialY=mode==='above'?40:mode==='visible'?60:96.21875;
  const button={dataset:{armsHero:'reveal-test',armsNode:'ihs'},isConnected:mode!=='detached',parentElement:scroller,
    closest(selector){if(selector==='[data-arms-panel]')return panel;assert.equal(selector,'dialog');return dialog;},
    getBoundingClientRect:()=>rect(initialY+100-position,83),
    scrollIntoView(){throw Error('Use measured safe bounds, not nearest scrolling');}};
  const S={hero:{id:'reveal-test',armsTalents:{}},main:'warrior'};
  const context=vm.createContext({B,S,ARMS_HERO_MODE:true,st:null,esc:String,hLevel:()=>30,specKey:()=>'arms',
    document:{addEventListener(){}},window:{alert(){throw Error('Unexpected alert');}},
    getComputedStyle(element){assert.equal(element,scroller);return {overflowY:'auto'};},
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
  if(['active','above','visible','shrink'].includes(mode)) {
    assert.equal(styleResets,1);
    const selected=button.getBoundingClientRect();
    assert.ok(selected.top>=close.getBoundingClientRect().bottom+8-1e-6);
    assert.ok(selected.bottom<=reset.getBoundingClientRect().top-8+1e-6);
    const expected={active:16.21875,above:-12,visible:0,shrink:44.21875}[mode];
    assert.equal(position,100+expected);
    assert.equal(scrolls.length,1);
    assert.equal(values['--arms-inspector-height'],mode==='shrink'?'131px':'103px');
    assert.equal(box.style.maxHeight,mode==='shrink'?'131px':'');
  } else {
    assert.deepEqual(scrolls,[]);assert.equal(styleResets,0);assert.equal(position,100);
  }
  assert.equal(JSON.stringify(S),before);
}
for(const mode of ['active','above','visible','shrink','detached','removed','closed','hidden'])scenario(mode);
console.log('Arms preview reveal: measured safe bounds, adaptive inspector, stale/closed guards and no writes passed');
