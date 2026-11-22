"""Build the opt-in hero integration preview without publishing or changing normal saves."""
from pathlib import Path
import re
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(root / 'scripts' / 'build_game.py')], cwd=root, check=True)
data = (root / 'preview' / 'index.html').read_bytes()
match = re.search(rb'<script\b', data, re.I)
if match is None:
    raise SystemExit('No script insertion point in built game')
flag = b'<script>window.__AZEROT_ARMS_HERO__=true;</script>'
data = data[:match.start()] + flag + data[match.start():]
out = root / 'preview' / 'arms-hero.html'
out.write_bytes(data)
print(f'Built isolated hero integration: {out.name}; {len(data)} bytes')
