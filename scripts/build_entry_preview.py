from pathlib import Path
import base64
import subprocess
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def artwork(root, name):
    tree = ET.fromstring((root / 'src/assets/entry' / (name + '-test.svg')).read_text(encoding='utf-8'))
    images = tree.findall('{http://www.w3.org/2000/svg}image')
    if len(images) != 1:
        raise ValueError('Expected one embedded artwork image')
    uri = images[0].get('href', '')
    prefix = 'data:image/avif;base64,'
    if not uri.startswith(prefix):
        raise ValueError('Expected self-contained AVIF artwork')
    raw = base64.b64decode(uri[len(prefix):], validate=True)
    if len(raw) > 200000 or raw[4:12] != b'ftypavif':
        raise ValueError('Invalid artwork payload')
    return uri


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
