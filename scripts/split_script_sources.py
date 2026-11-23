"""Split script-06 losslessly and switch build_game to manifest-based reads."""
from pathlib import Path
import hashlib
import json

LIMIT = 12000

def sha(data):
    return hashlib.sha256(data).hexdigest()

def read_source(path):
    folder = path.with_suffix('.parts')
    if not folder.exists():
        return path.read_bytes()
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    if manifest.get('version') != 1 or manifest.get('source') != path.name:
        raise ValueError('Invalid parts manifest: ' + str(path))
    entries = manifest['parts']
    if not entries:
        raise ValueError('Empty parts manifest')
    expected = [f'part-{i:03d}.txt' for i in range(1, len(entries) + 1)]
    if [entry['name'] for entry in entries] != expected:
        raise ValueError('Invalid part order')
    if sorted(p.name for p in folder.glob('part-*.txt')) != expected:
        raise ValueError('Missing or extra source parts')
    chunks = []
    for entry in entries:
        data = (folder / entry['name']).read_bytes()
        data.decode('utf-8')
        if not data or len(data) > LIMIT or len(data) != entry['bytes'] or sha(data) != entry['sha256']:
            raise ValueError('Corrupt source part: ' + entry['name'])
        chunks.append(data)
    data = b''.join(chunks)
    if len(data) != manifest['bytes'] or sha(data) != manifest['sha256']:
        raise ValueError('Reassembled source checksum mismatch')
    if path.exists() and data != path.read_bytes():
        raise ValueError('Split source differs from retained original: ' + str(path))
    return data

def split_source(path):
    raw = path.read_bytes()
    folder = path.with_suffix('.parts')
    if folder.exists():
        if read_source(path) != raw:
            raise ValueError('Existing parts differ; refusing overwrite')
        return folder
    chunks = []
    pos = 0
    while pos < len(raw):
        end = min(pos + LIMIT, len(raw))
        if end < len(raw):
            newline = raw.rfind(b'\n', pos, end)
            if newline > pos + LIMIT // 2:
                end = newline + 1
            else:
                while end > pos and raw[end] & 0xC0 == 0x80:
                    end -= 1
        chunk = raw[pos:end]
        chunk.decode('utf-8')
        chunks.append(chunk)
        pos = end
    if not chunks or b''.join(chunks) != raw:
        raise ValueError('Lossless split failed')
    folder.mkdir()
    entries = []
    for i, chunk in enumerate(chunks, 1):
        name = f'part-{i:03d}.txt'
        (folder / name).write_bytes(chunk)
        entries.append({'name': name, 'bytes': len(chunk), 'sha256': sha(chunk)})
    manifest = {'version': 1, 'source': path.name, 'bytes': len(raw), 'sha256': sha(raw), 'parts': entries}
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    if read_source(path) != raw:
        raise ValueError('Read-back verification failed')
    return folder

def migrate(root):
    source = root / 'src/scripts/script-06.txt'
    raw = source.read_bytes()
    blob = hashlib.sha1(b'blob ' + str(len(raw)).encode('ascii') + b'\0' + raw).hexdigest()
    if blob != '15ac7775709ba09178a0a6da6978f66f8d8543b0':
        raise ValueError('script-06 changed; review migration first')
    folder = split_source(source)
    builder = root / 'scripts/build_game.py'
    text = builder.read_text(encoding='utf-8')
    old = '    data = path.read_bytes()'
    new = '    data = read_source(path)'
    if 'from split_script_sources import read_source' not in text:
        if text.count('from coin_assets import restore_coin') != 1 or text.count(old) != 1:
            raise ValueError('Builder changed; review migration first')
        text = text.replace('from coin_assets import restore_coin', 'from coin_assets import restore_coin\nfrom split_script_sources import read_source', 1)
        text = text.replace(old, new, 1)
        builder.write_text(text, encoding='utf-8')
    elif text.count(new) != 1:
        raise ValueError('Incomplete builder migration')
    print(json.dumps({'parts': len(list(folder.glob('part-*.txt'))), 'sha256': sha(raw), 'originalRetainedForLegacyTests': True}))

if __name__ == '__main__':
    migrate(Path(__file__).resolve().parents[1])
