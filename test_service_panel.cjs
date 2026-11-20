const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const spec=JSON.parse(fs.readFileSync('src/scripts/script-17.services.edits.json','utf8'));
const original=fs.readFileSync('src/scripts/script-17.txt');
const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+original.length+'\0'),original])).digest('hex');
assert.equal(blob,spec.sourceBlobSha1);
let source=original.toString('utf8');
for(const edit of spec.edits){assert.equal(source.split(edit.old).length-1,1);source=source.replace(edit.old,edit.new);}
new (require('node:vm').Script)(source);
assert(source.includes("bar.querySelector('#free-deadmines-entry')?.remove()"));
assert(source.includes('dialog.append(action)'));
assert(!source.includes('cloneNode'));
assert(source.includes("if(!bar.querySelector('#az-services-toggle'))"));
assert(source.includes('observer.disconnect()'));
assert(source.includes("toggle.setAttribute('aria-controls','az-services-menu')"));
console.log('Service panel static checks passed: source hash, unique patch, syntax, existing-node transfer, duplicate guard, removed dungeon shortcut. Browser behavior remains to be verified.');
