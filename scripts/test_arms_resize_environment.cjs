'use strict';
const assert=require('node:assert/strict'), vm=require('node:vm');
const source=require('./lib_engine_load.cjs').source('src/scripts/script-06.txt');
const begin=source.indexOf('  /* ARMS_HERO_BEGIN */');
const end=source.indexOf('  /* ARMS_HERO_END */',begin);
const at=source.indexOf('  if (typeof window',begin);
const stop=source.indexOf('\n  function armsHeroRefusal',at);
assert.ok(begin>=0 && at>begin && stop>at && end>stop,'find real resize registration');
const registration=source.slice(at,stop);
for (const globals of [{},{window:undefined},{window:{}},{window:{addEventListener:0}}]) {
  vm.runInNewContext(registration,globals);
}
const handlers=[], measured=[], panels=[{},{}];let queries=0;
const context={
  window:{addEventListener(event,callback){assert.equal(event,'resize');handlers.push(callback);}},
  document:{querySelectorAll(selector){assert.equal(selector,'#w-hero [data-arms-panel]');queries++;return panels;}},
  armsHeroMeasure(panel){measured.push(panel);}
};
vm.runInNewContext(registration,context);
assert.equal(handlers.length,1,'register once in browser');
assert.equal(queries,0,'do not query DOM at registration');
handlers[0]();
assert.equal(queries,1);
assert.deepEqual(measured,panels,'remeasure every Arms panel on resize');
assert.throws(()=>vm.runInNewContext(registration.replace("typeof window !== 'undefined' && ",''),{}),/window is not defined/,'reproduce original missing-window regression');
console.log('Arms resize environment: absent window, missing listener API, browser registration and resize callback passed');
