'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('src/build-info.js','utf8');
function fixture(mode='same',loading=false){
 const nodes=new Map(),requests=[],commit='a'.repeat(40),info={version:'build-aaaaaaa',sourceCommit:commit,sourceDate:'2026-11-20T00:00:00Z'};
 function node(tag){return {tag,style:{},children:[],textContent:'',setAttribute(){},append(...items){this.children.push(...items);for(const item of items)if(item.id)nodes.set(item.id,item);}};}
 const root=node('div');nodes.set('w-more',root);nodes.set('az-build-metadata',{textContent:JSON.stringify(info)});
 let ready;const document={title:'v57.3 · Азерот: сумка и отряд',baseURI:'https://example.test/azerot/',readyState:loading?'loading':'complete',getElementById:id=>nodes.get(id),createElement:node,addEventListener:(name,fn)=>{assert.equal(name,'DOMContentLoaded');ready=fn;}};
 const c={document,URL,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{requests.push({url:String(url),options});if(mode==='offline')throw Error('offline');return {ok:mode!=='http',status:503,json:async()=>({sourceCommit:mode==='invalid'?'bad':mode==='same'?commit:'b'.repeat(40)})};}};
 vm.createContext(c);vm.runInContext(code,c);if(loading){assert.equal(root.children.length,0);ready();}
 return {c,root,document,requests,box:()=>nodes.get('az-build-info')};
}
(async()=>{
 for(const loading of [false,true]){const f=fixture('same',loading);assert.equal(f.document.title,'Азерот · build-aaaaaaa');assert.equal(f.root.children.length,1);vm.runInContext(code,f.c);if(!loading)assert.equal(f.root.children.length,1);assert.ok(f.box().children.some(n=>n.textContent==='Коммит: '+'a'.repeat(40)));}
 for(const mode of ['same','different','offline','http','invalid']){const f=fixture(mode),children=f.box().children,button=children.find(n=>n.tag==='button'),status=children.at(-1);const pending=button.onclick();assert.equal(button.disabled,true);await pending;assert.equal(button.disabled,false);assert.equal(f.requests.length,1);assert.equal(f.requests[0].url,'https://example.test/azerot/version.json');assert.equal(f.requests[0].options.cache,'no-store');assert.ok(status.textContent.includes(mode==='same'?'актуальная':mode==='different'?'другая сборка':'Не удалось'));}
 console.log('Build info tests passed: title, embedded identity, ready states, duplicate mount, same/different published commit and offline/HTTP/invalid responses. Mocked DOM/network only; not browser acceptance.');
})().catch(error=>{console.error(error);process.exitCode=1;});
