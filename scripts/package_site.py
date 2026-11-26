"""Package the tested combined build into the Pages site (used by .github/workflows/pages.yml and by the loader test).

Run from the repository root after scripts/build_combined_preview.py:
    SOURCE_COMMIT=$(git rev-parse HEAD) python3 scripts/package_site.py [--out _site]
Checks are the same as the former inline packaging step; additionally the root loader gets the entry-screen markup,
its stylesheet and the two approved entry images as separate files, plus the exact part sizes for real progress.
"""
from pathlib import Path
import argparse, hashlib, json, os, shutil

ROOT = Path(__file__).resolve().parents[1]
ENTRY_ART = {'portrait': 'image-2.png', 'landscape': 'image-3.png'}  # same files and checks as build_entry_preview.py


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default='_site')
    a = ap.parse_args()
    source_commit = os.environ['SOURCE_COMMIT']
    raw = (ROOT / 'preview/combined.html').read_bytes()
    game = raw.decode('utf-8')
    manifest = json.loads((ROOT / 'preview/combined-build.json').read_text(encoding='utf-8'))
    digest = hashlib.sha256(raw).hexdigest()
    if manifest.get('sourceCommit') != source_commit or manifest.get('sha256', {}).get('combined.html') != digest:
        raise SystemExit('Combined build identity changed or source commit mismatch')
    if game.count('id="pa-entry"') != 1 or game.count('window.__AZEROT_ARMS_HERO__=true;') != 1:
        raise SystemExit('Release must include entry and hero integration exactly once')
    if 'id="az-clean-crest"' not in game or '</html>' not in game.lower() or 'function dmOpenLobby()' not in game:
        raise SystemExit('Incomplete source build or missing lobby hotfix')
    loader = (ROOT / 'index.html').read_text(encoding='utf-8')
    for anchor in ('?v=573crest', '__PA_PART_BYTES__', '<!--PA_ENTRY_MARKUP-->', '<!--PA_ENTRY_STYLE-->'):
        if loader.count(anchor) != 1:
            raise SystemExit('Loader anchor mismatch: ' + anchor)
    out = ROOT / a.out
    if out.exists():
        raise SystemExit(str(out) + ' already exists')
    out.mkdir()
    (out / 'entry').mkdir()
    mid = len(raw) // 2
    parts = [raw[:mid], raw[mid:]]
    markup = (ROOT / 'src/entry/screen.html').read_text(encoding='utf-8')
    if markup.count('__PA_PORTRAIT__') != 1 or markup.count('__PA_LANDSCAPE__') != 1 or markup.count('id="pa-entry"') != 1:
        raise SystemExit('Entry markup anchors changed')
    markup = markup.replace('__PA_PORTRAIT__', 'entry/portrait.png').replace('__PA_LANDSCAPE__', 'entry/landscape.png')
    for name, file in ENTRY_ART.items():
        src = ROOT / 'src/assets/entry' / file
        if src.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n':
            raise SystemExit('Entry art is not PNG: ' + file)
        shutil.copyfile(src, out / 'entry' / (name + '.png'))
    shutil.copyfile(ROOT / 'src/entry/screen.css', out / 'entry/screen.css')
    page = (loader.replace('?v=573crest', '?v=' + digest)
            .replace('__PA_PART_BYTES__', json.dumps([len(p) for p in parts]))
            .replace('<!--PA_ENTRY_STYLE-->', '<link rel="stylesheet" href="entry/screen.css?v=' + digest[:12] + '">')
            .replace('<!--PA_ENTRY_MARKUP-->', markup))
    (out / 'index.html').write_text(page, encoding='utf-8')
    (out / 'game-1.txt').write_bytes(parts[0])
    (out / 'game-2.txt').write_bytes(parts[1])
    (out / 'version.json').write_text(json.dumps({'build': digest, 'sourceCommit': source_commit}), encoding='utf-8')
    if (out / 'game-1.txt').read_bytes() + (out / 'game-2.txt').read_bytes() != raw:
        raise SystemExit('Release split mismatch')
    print('Release source:', source_commit, 'build:', digest, 'bytes:', len(raw), 'entry and hero integration enabled; loader with entry art')


if __name__ == '__main__':
    main()
