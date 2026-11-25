from pathlib import Path
import base64
import struct

MARKER = b'__AZEROT_CORE_ABILITY_PROGRESSION__'
PREFIX = b'__AZEROT_CORE_'
MAP_ASSETS = {
    'WESTFALL': 'file_000000004df081f5a1a4a8110095645f.png',
    'WETLANDS': 'file_00000000301481f588f0385ce354c857.png',
    'DUSKWOOD': 'file_000000006a9081f58eda6c57319bffc7.png',
    'TIRISFAL': 'file_00000000ebf881f5a401dd8c3ad2c6a5.png',
}

def inline_core(data, root):
    modules = {MARKER: 'ability-progression.js', b'__AZEROT_CORE_WORLD_MAPS__': 'world-maps.js'}
    for marker, filename in modules.items():
        if marker not in data:
            continue
        if data.count(marker) != 1:
            raise ValueError('Duplicate core module marker')
        payload = (Path(root) / 'src' / 'core' / filename).read_bytes()
        if not payload.strip() or b'</script' in payload.lower() or PREFIX in payload:
            raise ValueError('Unsafe or recursive core module source')
        if filename == 'world-maps.js':
            for key, image in MAP_ASSETS.items():
                raw = (Path(root) / 'src' / 'assets' / image).read_bytes()
                if raw[:8] != b'\x89PNG\r\n\x1a\n' or len(raw) < 24 or raw[12:16] != b'IHDR':
                    raise ValueError('Zone map must be a real PNG: ' + image)
                width, height = struct.unpack('>II', raw[16:24])
                if not width or not height:
                    raise ValueError('Invalid PNG dimensions: ' + image)
                replacements = {
                    ('__AZEROT_WORLD_MAP_' + key + '__').encode(): b'data:image/png;base64,' + base64.b64encode(raw),
                    ('__AZEROT_WORLD_RATIO_' + key + '__').encode(): str(width).encode() + b' / ' + str(height).encode(),
                }
                for token, value in replacements.items():
                    if payload.count(token) != 1:
                        raise ValueError('Missing or duplicate map marker: ' + key)
                    payload = payload.replace(token, value)
            if b'__AZEROT_WORLD_' in payload:
                raise ValueError('Unresolved world-map marker')
        data = data.replace(marker, payload, 1)
    if PREFIX in data:
        raise ValueError('Unresolved core module marker')
    return data
