"""Embed original MONEYFRAME PNGs from Gethe/wow-ui-textures.

The first build downloads three pinned Git blobs; later builds reuse a
verified local cache. The resulting game uses data URIs, not remote images.
Artwork originates from World of Warcraft; the mirror is not a license grant.
"""
import base64
import hashlib
import json
from urllib.request import Request, urlopen

ASSETS = {
    'gold': ('34b85a994749594731a492db9ae3d2822d2fc12d', 555),
    'silver': ('1d5614d6251fd5e957d178601f31823e9672c7b6', 523),
    'copper': ('31e7940983496aea3a181b16bd4d9da9838360b8', 553),
}

def restore_coin(root, key):
    sha, size = ASSETS[key]
    cache = root / 'preview' / '.coin-cache' / (sha + '.png')
    if cache.exists():
        raw = cache.read_bytes()
    else:
        url = 'https://api.github.com/repos/Gethe/wow-ui-textures/git/blobs/' + sha
        request = Request(url, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'Azerot-asset-builder'})
        with urlopen(request, timeout=20) as response:
            payload = response.read(16385)
        if len(payload) > 16384:
            raise SystemExit('Unexpected coin asset response size')
        result = json.loads(payload)
        if result.get('encoding') != 'base64':
            raise SystemExit('Unexpected coin asset encoding')
        raw = base64.b64decode(''.join(result['content'].split()), validate=True)
    header = b'blob ' + str(len(raw)).encode('ascii') + b'\0'
    if len(raw) != size or not raw.startswith(b'\x89PNG\r\n\x1a\n') or hashlib.sha1(header + raw).hexdigest() != sha:
        raise SystemExit('Coin asset checksum or format mismatch: ' + key)
    if not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_bytes(raw)
    return base64.b64encode(raw)
