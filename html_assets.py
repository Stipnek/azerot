import argparse
import hashlib
import re
from pathlib import Path
from unittest.mock import patch
import css_assets

TEMPLATE = Path('src/template.html')
ASSETS = Path('src/html-assets')
DATA = re.compile(rb'''(data:[a-z0-9.+-]+/[a-z0-9.+-]+[^,\s"']{0,120};base64,)([A-Za-z0-9+/=]+)''', re.I)
MARKER = re.compile(rb'__AZEROT_HTML_ASSET_([a-f0-9]{64})__')

def extract():
    original = TEMPLATE.read_bytes()
    if MARKER.search(original):
        raise SystemExit('Template already contains HTML asset markers')
    ASSETS.mkdir()
    def save(match):
        payload = match[2]
        key = hashlib.sha256(payload).hexdigest()
        (ASSETS / (key + '.b64')).write_bytes(payload)
        return match[1] + f'__AZEROT_HTML_ASSET_{key}__'.encode('ascii')
    updated, count = DATA.subn(save, original)
    if not count:
        raise SystemExit('No HTML Base64 payloads found')
    TEMPLATE.write_bytes(updated)
    print(f'Extracted {count} payloads: template {len(original)} -> {len(updated)} bytes')

def verify():
    def restore(match):
        key = match[1].decode('ascii')
        payload = (ASSETS / (key + '.b64')).read_bytes()
        if hashlib.sha256(payload).hexdigest() != key:
            raise SystemExit('HTML asset checksum mismatch')
        return payload
    restored, count = MARKER.subn(restore, TEMPLATE.read_bytes())
    if not count:
        raise SystemExit('No HTML asset markers found')
    original_read = Path.read_bytes
    def read(path):
        return restored if path == TEMPLATE else original_read(path)
    with patch.object(Path, 'read_bytes', read):
        css_assets.verify()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--extract', action='store_true')
    if parser.parse_args().extract:
        extract()
    verify()
