from pathlib import Path
import hashlib
import json
import subprocess

folder = Path(__file__).resolve().parents[1] / 'src' / 'scripts'
groups = {}
for manifest in sorted(folder.glob('*.edits.json')):
    source = folder / (manifest.name.split('.', 1)[0] + '.txt')
    groups.setdefault(source, []).append(manifest)
count = 0
for source, manifests in sorted(groups.items()):
    data = source.read_bytes()
    sha256 = hashlib.sha256(data).hexdigest()
    blob = hashlib.sha1(b'blob ' + str(len(data)).encode('ascii') + b'\0' + data).hexdigest()
    for manifest in manifests:
        try:
            spec = json.loads(manifest.read_text(encoding='utf-8'))
        except json.JSONDecodeError as error:
            raise SystemExit(f'{manifest}:{error.lineno}:{error.colno}: {error.msg}') from error
        if not isinstance(spec, dict):
            raise SystemExit(f'{manifest}: expected an object')
        if spec.get('sourceSha256') != sha256 and spec.get('sourceBlobSha1') != blob:
            raise SystemExit(f'{manifest}: original source checksum mismatch')
        if not isinstance(spec.get('edits'), list):
            raise SystemExit(f'{manifest}: expected an edits array')
        for edit in spec['edits']:
            if not isinstance(edit, dict) or not isinstance(edit.get('old'), str) or not edit['old'] or not isinstance(edit.get('new'), str):
                raise SystemExit(f'{manifest}: invalid old/new replacement strings')
            old, new = edit['old'].encode('utf-8'), edit['new'].encode('utf-8')
            if data.count(old) != 1:
                raise SystemExit(f'{manifest}: non-unique anchor: {edit.get("name", "unnamed")}')
            data = data.replace(old, new, 1)
            count += 1
    checked = subprocess.run(['node', '--check'], input=data, capture_output=True)
    if checked.returncode:
        raise SystemExit(str(source) + ': patched JavaScript syntax error\n' + checked.stderr.decode('utf-8', errors='replace'))
print(f'Validated {len(groups)} edited JavaScript sources, {sum(map(len, groups.values()))} strict JSON manifests and {count} unique replacements; no source files modified.')
