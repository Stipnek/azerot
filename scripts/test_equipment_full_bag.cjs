'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const raw=fs.readFileSync('src/scripts/script-16.txt'),sha=crypto.createHash('sha256').update(raw).digest('hex'),blob=crypto.createHash('sha1').update(Buffer.from('blob '+raw.length+'\0')).update(raw).digest('hex');
let source=raw.toString('utf8');
for(const name of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-16')&&n.endsWith('.edits.json')).sort()){
 const p=JSON.parse(fs.readFileSync('src/scripts/'+name,'utf8'));
 assert.ok(p.sourceSha256===sha||p.sourceBlobSha1===blob,name);
 for(const e of p.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,name+': '+e.name);source=source.replace(e.old,e.new);}
}
new vm.Script(source);
assert.ok(source.includes('.az-slot-tabs button[aria-pressed=true]{outline:2px solid #e8bd68;outline-offset:-2px;background:#493b24;border-color:#e8bd68;color:#fff2dc}')); // bug hunt 1.3: readable pressed slot
const start=source.indexOf('function azDecorate('),end=source.indexOf('window.AzerotEquipmentWindow=',start);assert.ok(start>=0&&end>start);
function node(){return {dataset:{},style:{},children:[],attrs:{},classList:{add(){},remove(){}},append(...x){this.children.push(...x);},setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k]??null;},querySelectorAll(s){assert.equal(s,'button');return this.children;}};}
function fixture(){
 const d=node();d.events={};d.addEventListener=(k,fn)=>{d.events[k]=fn;};
 const root=node(),footer={textContent:''},clicks=[];let bag=[],equipped=[];
 root.before=(...x)=>{root.beforeNodes=x;};
 root.querySelectorAll=s=>s==='.az573-cell'?[...equipped,...bag]:s==='.az573-equip .az573-cell'?equipped:s==='.az573-bag .az573-cell'?bag:assert.fail(s);
 root.querySelector=s=>{assert.equal(s,'.az-gear-footer');return footer;};
 function cell(slot,disabled=false){const b=node();b.dataset.gearSlot=slot;b.disabled=disabled;b.parentElement={hidden:false};b.setAttribute('aria-label','Предмет: '+slot);b.click=()=>{[...equipped,...bag].forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');clicks.push(slot);};return b;}
 bag=[cell('head'),cell('chest'),cell('legs'),cell('',true)];equipped=[cell('chest')];
 const c={document:{documentElement:node(),getElementById:()=>({}),querySelector:()=>null,createElement:()=>node()},MutationObserver:class{constructor(fn){this.fn=fn;}observe(){}disconnect(){}}};
 vm.createContext(c);vm.runInContext(source.slice(start,end),c);c.azDecorate(d,root);
 return {d,root,footer,clicks,cell,bag:()=>bag,setBag:x=>{bag=x;},setWorn:x=>{equipped=x;},nav:()=>root.beforeNodes[0],reopen:()=>c.azDecorate(d,root)};
}
const f=fixture(),button=key=>f.nav().children.find(b=>b.dataset.slot===key);
const noneSelected=()=>f.nav().children.every(b=>b.getAttribute('aria-pressed')==='false');
const visibility=()=>f.bag().map(b=>b.parentElement.hidden);
assert.equal(f.nav().children.length,6);assert.equal(button('all'),undefined);assert.ok(noneSelected());assert.deepEqual(visibility(),[false,false,false,true]);
assert.equal(f.root.beforeNodes[1].textContent,'Надето: chest'); // bug hunt 1.3: the all-items view names what is wornassert.equal(f.clicks.length,1);
f.d._gearObserver.fn();assert.equal(f.clicks.length,1,'Observer must not repeatedly auto-select in all mode');
button('head').onclick();assert.deepEqual(visibility(),[false,true,true,true]);assert.equal(button('head').getAttribute('aria-pressed'),'true');
button('head').onclick();assert.deepEqual(visibility(),[false,false,false,true]);assert.ok(noneSelected());
button('chest').onclick();assert.deepEqual(visibility(),[true,false,true,true]);assert.equal(button('chest').getAttribute('aria-pressed'),'true');
button('head').onclick();assert.deepEqual(visibility(),[false,true,true,true]);assert.equal(button('head').getAttribute('aria-pressed'),'true');assert.equal(button('chest').getAttribute('aria-pressed'),'false');
button('offhand').onclick();assert.ok(f.bag().every(b=>b.parentElement.hidden));assert.equal(f.footer.textContent,'В этом слоте пока нет предметов.');
button('offhand').onclick();assert.deepEqual(visibility(),[false,false,false,true]);assert.ok(noneSelected());
button('head').onclick();const nav=f.nav();f.reopen();assert.equal(f.nav(),nav);assert.ok(noneSelected());assert.deepEqual(visibility(),[false,false,false,true]);
f.setBag([f.cell('feet'),f.cell('',true)]);f.d._gearObserver.fn();assert.deepEqual(visibility(),[false,true]);
f.setBag([f.cell('',true)]);f.d._gearObserver.fn();assert.equal(f.clicks[f.clicks.length-1],'chest','bug hunt 1.3: empty bag opens the worn item, not "no items"');
f.setWorn([]);f.reopen();assert.equal(f.root.beforeNodes[1].textContent,'Надето: ничего');assert.equal(f.footer.textContent,'В сумке пока нет предметов.');
console.log('Full-bag toggle tests passed: default all, no extra button, repeat-click reset, switching slots, pressed states, highlight CSS, reopen, empty bag and rerender observer. Mock DOM/source only; browser layout and equip/save acceptance remain required.');
