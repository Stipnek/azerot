from html.parser import HTMLParser
from pathlib import Path
import re
import tempfile

original = Path('game-1.txt').read_bytes() + Path('game-2.txt').read_bytes()
html = original.decode('utf-8')
line_offsets = [0] + [m.end() for m in re.finditer('\n', html)]

class Styles(HTMLParser):
    start = None

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.spans = []

    def _absolute_pos(self):
        line, col = self.getpos()
        return line_offsets[line - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag == 'style':
            self.start = self._absolute_pos() + len(self.get_starttag_text())

    def handle_endtag(self, tag):
        if tag == 'style':
            if self.start is None:
                raise ValueError('Unexpected closing style tag')
            self.spans.append((self.start, self._absolute_pos()))
            self.start = None

parser = Styles()
parser.feed(html)
parser.close()
if parser.start is not None or not parser.spans:
    raise SystemExit('No complete style blocks found or unclosed style tag')

with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    template, markers, paths = [], [], []
    cursor = 0
    for i, (start, end) in enumerate(parser.spans, 1):
        marker = f'__AZEROT_CSS_BLOCK_{i}__'.encode()
        if marker.decode() in html:
            raise SystemExit('Marker collision')
        css = root / ('styles.css' if i == 1 else f'styles-{i}.css')
        css.write_bytes(html[start:end].encode('utf-8'))
        template.extend([html[cursor:start].encode('utf-8'), marker])
        markers.append(marker)
        paths.append(css)
        cursor = end
    template.append(html[cursor:].encode('utf-8'))
    (root / 'template.html').write_bytes(b''.join(template))
    rebuilt = (root / 'template.html').read_bytes()
    for marker, css in zip(markers, paths):
        rebuilt = rebuilt.replace(marker, css.read_bytes(), 1)
    if rebuilt != original:
        raise SystemExit('Rebuilt HTML differs from original')
    print(f'OK: {len(paths)} CSS blocks; all {len(original)} HTML bytes match')
