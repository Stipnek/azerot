from pathlib import Path
import base64
import hashlib
import struct
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
ARTWORK = {
    'portrait': {'file':'image-2.png', 'size':(852,1846), 'blob':'36a9ba0f1cf5402514e9145e3374457daf3d386c'},
    'landscape': {'file':'image-3.png', 'size':(1672,941), 'blob':'444f76cf0ca1aa369ad848ecd989648ca6efaf44'},
}


def artwork(root, name):
    spec = ARTWORK[name]
    path = root / 'src/assets/entry' / spec['file']
    raw = path.read_bytes()
    if len(raw) < 24 or len(raw) > 8_000_000:
        raise ValueError('Unexpected artwork size: ' + spec['file'])
    if raw[:16] != b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR':
        raise ValueError('Expected original PNG: ' + spec['file'])
    if struct.unpack('>II', raw[16:24]) != spec['size']:
        raise ValueError('Artwork dimensions changed: ' + spec['file'])
    blob = hashlib.sha1(b'blob ' + str(len(raw)).encode('ascii') + b'\0' + raw).hexdigest()
    if blob != spec['blob']:
        raise ValueError('Artwork changed; review selection: ' + spec['file'])
    return 'data:image/png;base64,' + base64.b64encode(raw).decode('ascii')


def assemble(root, game):
    source = root / 'src/entry'
    css = (source / 'screen.css').read_text(encoding='utf-8')
    markup = (source / 'screen.html').read_text(encoding='utf-8')
    js = (source / 'screen.js').read_text(encoding='utf-8')
    if '</script' in js.lower() or '</style' in css.lower():
        raise ValueError('Unsafe inline terminator')
    for name in ['portrait', 'landscape']:
        marker = '__PA_' + name.upper() + '__'
        uri = artwork(root, name)
        css = css.replace(marker, uri)
        markup = markup.replace(marker, uri)
    if '__PA_' in css or '__PA_' in markup:
        raise ValueError('Unresolved entry artwork')
    if '<head>' not in game or '<body>' not in game or '</body>' not in game:
        raise ValueError('Expected current source-build HTML')
    head = '<style id="pa-entry-style">' + css + '</style><script>document.documentElement.dataset.paEntry="loading";</script>'
    game = game.replace('<head>', '<head>' + head, 1)
    game = game.replace('<body>', '<body>' + markup, 1)
    before, close, after = game.rpartition('</body>')
    return before + '<script id="pa-entry-runtime">' + js + '</script>' + close + after


if __name__ == '__main__':
    subprocess.run([sys.executable, str(ROOT / 'scripts/build_game.py')], cwd=ROOT, check=True)
    original = (ROOT / 'preview/index.html').read_bytes()
    result = assemble(ROOT, original.decode('utf-8'))
    target = ROOT / 'preview/entry.html'
    target.write_text(result, encoding='utf-8')
    assert (ROOT / 'preview/index.html').read_bytes() == original
    print('Built separate entry preview:', target.name, len(result.encode('utf-8')), 'bytes; ordinary preview unchanged')
