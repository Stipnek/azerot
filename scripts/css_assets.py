import argparse
import hashlib
import re
from pathlib import Path

ROOT = Path('src')
ASSETS = ROOT / 'css-assets'
STYLES = ROOT / 'styles.css'
DATA = re.compile(rb'''(data:[^,\s"']{1,120};base64,)([A-Za-z0-9+/=]+)''', re.I)
ASSET = re.compile(rb'__AZEROT_CSS_ASSET_([a-f0-9]{64})__')
BLOCK = re.compile(rb'__AZEROT_CSS_BLOCK_([1-9][0-9]*)__')

def extract():
    original = STYLES.read_bytes()
    if ASSET.search(original):
        raise SystemExit('CSS already contains asset markers')
    ASSETS.mkdir()

    def save(match):
        payload = match[2]
        key = hashlib.sha256(payload).hexdigest()
        (ASSETS / (key + '.b64')).write_bytes(payload)
        return match[1] + f'__AZEROT_CSS_ASSET_{key}__'.encode('ascii')

    updated, count = DATA.subn(save, original)
    if not count:
        raise SystemExit('No embedded CSS assets found')
    STYLES.write_bytes(updated)
    print(f'Extracted {count} payloads: styles.css {len(original)} -> {len(updated)} bytes')

def verify():
    def restore_asset(match):
        key = match[1].decode('ascii')
        payload = (ASSETS / (key + '.b64')).read_bytes()
        if hashlib.sha256(payload).hexdigest() != key:
            raise SystemExit(f'Asset checksum mismatch: {key}')
        return payload

    def restore_block(match):
        i = int(match[1])
        if i == 1:
            css, count = ASSET.subn(restore_asset, STYLES.read_bytes())
            if not count:
                raise SystemExit('No CSS asset markers found')
            return css
        return (ROOT / f'styles-{i}.css').read_bytes()

    rebuilt = BLOCK.sub(restore_block, (ROOT / 'template.html').read_bytes())
    original = Path('game-1.txt').read_bytes() + Path('game-2.txt').read_bytes()
    if rebuilt != original:
        raise SystemExit('Rebuilt HTML differs from original')
    print(f'OK: all {len(original)} HTML bytes match')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--extract', action='store_true')
    if parser.parse_args().extract:
        extract()
    verify()
