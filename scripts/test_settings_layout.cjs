'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const original=fs.readFileSync('src/scripts/script-17.txt');let source=original.toString('utf8');const hash=crypto.createHash('sha256').update(original).digest('hex'),blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+original.length+'\0'),original])).digest('hex');
for(const n of fs.readdirSync('src/scripts').filter(n=>n.startsWith('script-17')&&n.endsWith('.edits.json')).sort()){const p=JSON.parse(fs.readFileSync('src/scripts/'+n,'utf8'));assert.ok(p.sourceSha256||p.sourceBlobSha1,n+': missing source hash');if(p.sourceSha256)assert.equal(p.sourceSha256,hash);if(p.sourceBlobSha1)assert.equal(p.sourceBlobSha1,blob);for(const e of p.edits){assert.ok(e.old);assert.equal(source.split(e.old).length-1,1,n+': '+e.name);source=source.replace(e.old,e.new);}}
new vm.Script(source);
const a=source.indexOf('// AZ_SETTINGS_CLEANUP_BEGIN'),b=source.indexOf('// AZ_SETTINGS_CLEANUP_END',a);assert.ok(a>=0&&b>a);const code=source.slice(a,b);
const styles=[],headings=[];let callback,removed=0;const root={querySelectorAll:()=>headings};
const context={document:{getElementById:id=>id==='w-more'?root:null,createElement:()=>({}),head:{append:s=>styles.push(s)}},MutationObserver:class{constructor(fn){callback=fn;}observe(target,options){assert.equal(target,root);assert.equal(options.subtree,true);}}};
function heading(text){const block={parentElement:root,remove(){removed++;}},h={textContent:text,parentElement:block};headings.push(h);return h;}
heading('Звук и музыка');heading('Тест');heading('Таверна, манекены и герои');vm.runInNewContext(code,context);assert.equal(removed,1);assert.equal(styles.length,1);assert.ok(styles[0].textContent.includes('#world #w-more:not([hidden])'));assert.ok(styles[0].textContent.includes('flex-direction:column!important'));assert.ok(styles[0].textContent.includes('min-height:0!important'));
headings.length=0;heading('Таверна Златоземья');heading('Манекены');callback();assert.equal(removed,1);
headings.length=0;heading('Таверна, манекены и герои');callback();assert.equal(removed,2);
assert.ok(!code.includes('localStorage'));console.log('Settings cleanup passed: both source hash formats, exact showcase removal, late insertion, unrelated headings preserved and scoped layout. Real browser geometry not covered.');
