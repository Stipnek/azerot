from pathlib import Path

MARKER = b'__AZEROT_CORE_ABILITY_PROGRESSION__'
PREFIX = b'__AZEROT_CORE_'

def inline_core(data, root):
    if MARKER in data:
        if data.count(MARKER) != 1:
            raise ValueError('Duplicate core module marker')
        payload = (Path(root) / 'src' / 'core' / 'ability-progression.js').read_bytes()
        if not payload.strip() or b'</script' in payload.lower() or PREFIX in payload:
            raise ValueError('Unsafe or recursive core module source')
        data = data.replace(MARKER, payload, 1)
    if PREFIX in data:
        raise ValueError('Unresolved core module marker')
    return data
