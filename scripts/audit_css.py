from pathlib import Path
from html import escape
import re

root = Path('src')
files = sorted(root.glob('styles*.css'), key=lambda p: int(p.stem.split('-')[-1]) if '-' in p.stem else 1)
if not files:
    raise SystemExit('No CSS sources found')
print('# CSS inventory')
print(f'HTML template: {root.joinpath("template.html").stat().st_size:,} bytes.')
print('Selector names below are samples, not a full CSS parse.')
print()
print('| File | Bytes | Base64 payload bytes | Sample classes and IDs |')
print('| --- | ---: | ---: | --- |')
for path in files:
    data = path.read_bytes()
    payloads = list(re.finditer(rb'data:[^,\s"\']{1,120};base64,([A-Za-z0-9+/=]+)', data, re.I))
    payload_size = sum(len(match[1]) for match in payloads)
    text = data.decode('utf-8')
    sample = []
    for prefix in re.findall(r'([^{};]{1,240})\{', text):
        for name in re.findall(r'[.#][A-Za-z_][\w-]*', prefix):
            if name not in sample:
                sample.append(name)
            if len(sample) == 8:
                break
        if len(sample) == 8:
            break
    print(f'| {path.name} | {len(data):,} | {payload_size:,} | {escape(", ".join(sample)) or "—"} |')
