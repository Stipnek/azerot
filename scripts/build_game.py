from pathlib import Path
import argparse
import hashlib
import re

p = argparse.ArgumentParser(description='Build Azerot without publishing')
p.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
p.add_argument('--check-original', action='store_true')
a = p.parse_args()
root = a.root.resolve()
src = root / 'src'

def script(m):
    return (src / 'scripts' / f'script-{int(m[1]):02d}.txt').read_bytes()

def asset(folder):
    def restore(m):
        key = m[1].decode()
        data = (src / folder / (key + '.b64')).read_bytes()
        if hashlib.sha256(data).hexdigest() != key:
            raise SystemExit(f'Asset checksum mismatch: {folder}/{key}')
        return data
    return restore

def css(m):
    i = int(m[1])
    return (src / ('styles.css' if i == 1 else f'styles-{i}.css')).read_bytes()

data = (src / 'template.html').read_bytes()
data = re.sub(rb'__AZEROT_SCRIPT_SOURCE_([0-9]+)__', script, data)
data = re.sub(rb'__AZEROT_CSS_BLOCK_([0-9]+)__', css, data)
data = re.sub(rb'__AZEROT_HTML_ASSET_([a-f0-9]{64})__', asset('html-assets'), data)
data = re.sub(rb'__AZEROT_CSS_ASSET_([a-f0-9]{64})__', asset('css-assets'), data)
if re.search(rb'__AZEROT_(?:SCRIPT_SOURCE|CSS_BLOCK|HTML_ASSET|CSS_ASSET)_[A-Za-z0-9_]*__', data):
    raise SystemExit('Unresolved source marker in build')
if a.check_original:
    original = (root / 'game-1.txt').read_bytes() + (root / 'game-2.txt').read_bytes()
    if data != original:
        raise SystemExit('Rebuilt HTML differs from original')
    print('OK: byte-for-byte original match')
output = root / 'preview' / 'index.html'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_bytes(data)
print(f'Built {len(data)} bytes; SHA256 {hashlib.sha256(data).hexdigest()}')
