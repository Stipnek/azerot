"""Prepare embedded WoW coins without GitHub REST API requests.

Prefer source PNGs in src/coin-assets, then a verified build cache.
Until source PNGs are vendored, clean builds fetch pinned raw files.
The generated game contains data URIs and does not fetch these images.
Artwork originates from World of Warcraft; the mirror is not a license grant.
"""
import base64
import hashlib
from urllib.error import URLError
from urllib.request import Request, urlopen

SOURCE_COMMIT = 'd23deaf8f44a7d280dc974a5c9d5321c013db59b'
ASSETS = {
    'gold': ('34b85a994749594731a492db9ae3d2822d2fc12d', 555, 'UI-GoldIcon.PNG'),
    'silver': ('1d5614d6251fd5e957d178601f31823e9672c7b6', 523, 'UI-SilverIcon.PNG'),
    'copper': ('31e7940983496aea3a181b16bd4d9da9838360b8', 553, 'UI-CopperIcon.PNG'),
}

def restore_coin(root, key):
    sha, size, filename = ASSETS[key]
    local = root / 'src' / 'coin-assets' / filename
    cache = root / 'preview' / '.coin-cache' / (sha + '.png')
    if local.exists():
        raw = local.read_bytes()
    elif cache.exists():
        raw = cache.read_bytes()
    else:
        url = 'https://raw.githubusercontent.com/Gethe/wow-ui-textures/' + SOURCE_COMMIT + '/MONEYFRAME/' + filename
        request = Request(url, headers={'User-Agent': 'Azerot-asset-builder'})
        try:
            with urlopen(request, timeout=20) as response:
                raw = response.read(8193)
        except URLError as error:
            raise SystemExit('Could not prepare coin ' + key + ': ' + str(error) + '. Provide the verified PNG at ' + str(local)) from error
    header = b'blob ' + str(len(raw)).encode('ascii') + b'\0'
    if len(raw) != size or not raw.startswith(b'\x89PNG\r\n\x1a\n') or hashlib.sha1(header + raw).hexdigest() != sha:
        raise SystemExit('Coin asset checksum or format mismatch: ' + key)
    if not local.exists() and not cache.exists():
        cache.parent.mkdir(parents=True, exist_ok=True)
        temporary = cache.with_suffix('.tmp')
        temporary.write_bytes(raw)
        temporary.replace(cache)
    return base64.b64encode(raw)
