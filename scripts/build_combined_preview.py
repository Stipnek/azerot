"""Build an isolated combined entry/Arms preview; never publish or enable ordinary saves."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
from build_entry_preview import assemble

ROOT = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(ROOT / 'scripts/build_arms_hero.py')], cwd=ROOT, check=True)
ordinary = (ROOT / 'preview/index.html').read_bytes()
hero = (ROOT / 'preview/arms-hero.html').read_bytes()
if b'id="pa-entry"' in ordinary or b'id="pa-entry"' in hero:
    raise SystemExit('Expected previews without an existing entry overlay')
if hero.count(b'window.__AZEROT_ARMS_HERO__=true;') != 1:
    raise SystemExit('Expected exactly one opt-in Arms flag')
combined = assemble(ROOT, hero.decode('utf-8')).encode('utf-8')
if combined.count(b'id="pa-entry"') != 1 or combined.count(b'window.__AZEROT_ARMS_HERO__=true;') != 1:
    raise SystemExit('Combined preview lost entry or Arms integration')
if (ROOT / 'preview/index.html').read_bytes() != ordinary or (ROOT / 'preview/arms-hero.html').read_bytes() != hero:
    raise SystemExit('Combination unexpectedly changed an existing preview')
(ROOT / 'preview/combined.html').write_bytes(combined)
commit = subprocess.check_output(['git', '-C', str(ROOT), 'rev-parse', 'HEAD'], text=True).strip()
manifest = {'sourceCommit': commit, 'scope': 'Isolated opt-in combined preview; not publication or normal-save migration acceptance.',
    'sha256': {name: hashlib.sha256(data).hexdigest() for name, data in [('index.html', ordinary), ('arms-hero.html', hero), ('combined.html', combined)]}}
(ROOT / 'preview/combined-build.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest))
