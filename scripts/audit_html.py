from collections import Counter
from pathlib import Path
import re

html = Path('src/template.html').read_bytes()
script = re.compile(rb'<script\b[^>]*>(.*?)</script\s*>', re.I | re.S)
asset = re.compile(rb'''data:([a-z0-9.+-]+/[a-z0-9.+-]+)[^,\s"']{0,120};base64,([A-Za-z0-9+/=]+)''', re.I)

scripts = list(script.finditer(html))
assets = Counter()
for match in asset.finditer(html):
    assets[match[1].lower().decode('ascii')] += len(match[2])
script_size = sum(len(m[1]) for m in scripts)
script_assets = sum(len(a[2]) for m in scripts for a in asset.finditer(html, m.start(1), m.end(1)))
all_assets = sum(assets.values())

print('# HTML inventory')
print(f'- Template: {len(html):,} bytes')
print(f'- Script tag bodies: {script_size:,} bytes across {len(scripts)} tags')
print(f'- Base64 inside script bodies: {script_assets:,} bytes')
print(f'- Script bodies excluding detected Base64: {script_size - script_assets:,} bytes')
print(f'- Base64 elsewhere in template: {all_assets - script_assets:,} bytes')
print(f'- Total detected Base64: {all_assets:,} bytes')
print('\nBase64 totals by media type:')
for kind, size in assets.most_common():
    print(f'- {kind}: {size:,} bytes')
print('\nEstimates from markup and data URI patterns. Script tags may contain data as well as JavaScript; indirect or split Base64 strings may not be counted.')
