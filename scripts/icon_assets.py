"""Vendored Wowhead ability icons (owner 2026-11-28: no runtime icon loads from Wowhead).

src/assets/icons/<name>.jpg are unchanged 56x56 copies of https://wow.zamimg.com/images/wow/icons/large/<name>.jpg
(World of Warcraft artwork, copyright Blizzard Entertainment; see src/assets/icons/NOTICE.md; no licence is granted).
The build (scripts/build_game.py) calls vendor() on the assembled HTML:
  1. every literal icon URL becomes a data: URI of its vendored file;
  2. runtime-built URLs ('...large/' + name + '.jpg', AZ_ICON_ROOT + name + '.jpg': class and spec badges, two older panels)
     call azIconData(name), a map of every vendored icon injected before the first script;
  3. the build fails if a Wowhead icon URL is left or a literal URL has no vendored file.
Add a new icon: python3 scripts/icon_assets.py --fetch <name> ... (needs network), commit the .jpg and the manifest."""
import base64
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / 'src' / 'assets' / 'icons'
PREFIX = 'https://wow.zamimg.com/images/wow/icons/large/'
LITERAL = re.compile(rb'https://wow\.zamimg\.com/images/wow/icons/large/([A-Za-z0-9_\-]+)\.jpg')
DYNAMIC = re.compile(rb"https://wow\.zamimg\.com/images/wow/icons/large/'\s*\+\s*([A-Za-z_$][\w$]*(?:\[\d+\])?)\s*\+\s*'\.jpg")
ROOTVAR = re.compile(rb"AZ_ICON_ROOT\s*\+\s*([A-Za-z_$][\w$]*)\s*\+\s*'\.jpg")
ROOTDEF = b"const AZ_ICON_ROOT = 'https://wow.zamimg.com/images/wow/icons/large/';"


def uri(name, cache={}):
    if name not in cache:
        path = DIR / (name + '.jpg')
        if not path.is_file():
            raise SystemExit('Icon not vendored: %s (run python3 scripts/icon_assets.py --fetch %s)' % (name, name))
        cache[name] = 'data:image/jpeg;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
    return cache[name]


def vendor(data: bytes) -> bytes:
    data, dynamic = DYNAMIC.subn(lambda m: b"'+azIconData(" + m[1] + b")+'", data)
    data, rootvar = ROOTVAR.subn(lambda m: b"azIconData(" + m[1] + b") + '", data)
    if rootvar:
        if data.count(ROOTDEF) != 1 or b'AZ_ICON_ROOT' in data.replace(ROOTDEF, b''):
            raise SystemExit('AZ_ICON_ROOT used in an unknown way; extend scripts/icon_assets.py')
        data = data.replace(ROOTDEF, b"const AZ_ICON_ROOT = '';")
        dynamic += rootvar
    data = LITERAL.sub(lambda m: uri(m[1].decode()).encode('ascii'), data)
    if b'wow.zamimg.com' in data:
        raise SystemExit('A Wowhead icon URL is left in the build; vendor it in src/assets/icons')
    if dynamic:
        table = json.dumps({p.stem: uri(p.stem) for p in sorted(DIR.glob('*.jpg'))}, separators=(',', ':'))
        script = ('<script>window.AZ_ICON_DATA=' + table + ';window.azIconData=function(n){return window.AZ_ICON_DATA[n]||"";};</script>').encode('ascii')
        at = data.lower().find(b'<script')
        if at < 0:
            raise SystemExit('No script tag for the icon table')
        data = data[:at] + script + data[at:]
    return data


def fetch(names):
    import urllib.request
    manifest = json.loads((DIR / 'manifest.json').read_text()) if (DIR / 'manifest.json').exists() else {}
    for n in names:
        body = urllib.request.urlopen(PREFIX + n + '.jpg', timeout=30).read()
        if body[:3] != b'\xff\xd8\xff':
            raise SystemExit('Not a JPEG: ' + n)
        (DIR / (n + '.jpg')).write_bytes(body)
    write_manifest()


def write_manifest():
    files = sorted(DIR.glob('*.jpg'))
    out = {'source': PREFIX + '<name>.jpg', 'note': 'Unchanged Wowhead icon files; see NOTICE.md.',
           'icons': {p.stem: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files}}
    (DIR / 'manifest.json').write_text(json.dumps(out, indent=1) + '\n')


def check():
    m = json.loads((DIR / 'manifest.json').read_text())['icons']
    files = {p.stem: p for p in DIR.glob('*.jpg')}
    if set(m) != set(files):
        raise SystemExit('icons manifest out of date: %s' % sorted(set(m) ^ set(files)))
    for n, p in files.items():
        if hashlib.sha256(p.read_bytes()).hexdigest() != m[n]['sha256']:
            raise SystemExit('icon changed: ' + n)
    print('icons: %d vendored files match the manifest' % len(files))


if __name__ == '__main__':
    if sys.argv[1:2] == ['--fetch']:
        fetch(sys.argv[2:])
    elif sys.argv[1:2] == ['--manifest']:
        write_manifest()
    check()
