import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
from unittest.mock import patch
import html_assets

TEMPLATE = Path('src/template.html')
SOURCES = Path('src/scripts')
MARKER = re.compile(rb'__AZEROT_SCRIPT_SOURCE_([0-9]{2,})__')

def extract():
    text = TEMPLATE.read_bytes().decode('utf-8')
    if MARKER.search(text.encode('utf-8')):
        raise SystemExit('Script sources already extracted')
    offsets = [0] + [m.end() for m in re.finditer('\n', text)]
    class Parser(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.body_start = None
            self.spans = []
        def absolute_pos(self):
            line, col = self.getpos()
            return offsets[line - 1] + col
        def handle_starttag(self, tag, attrs):
            if tag == 'script':
                if self.body_start is not None:
                    raise ValueError('Nested script')
                self.body_start = self.absolute_pos() + len(self.get_starttag_text())
        def handle_endtag(self, tag):
            if tag == 'script':
                if self.body_start is None:
                    raise ValueError('Unexpected script closing tag')
                self.spans.append((self.body_start, self.absolute_pos()))
                self.body_start = None
    parser = Parser()
    parser.feed(text)
    parser.close()
    if parser.body_start is not None or not parser.spans:
        raise SystemExit('Incomplete or missing script tags')
    SOURCES.mkdir()
    parts = []
    cursor = 0
    for i, (start, end) in enumerate(parser.spans, 1):
        (SOURCES / f'script-{i:02d}.txt').write_bytes(text[start:end].encode('utf-8'))
        parts.extend([text[cursor:start], f'__AZEROT_SCRIPT_SOURCE_{i:02d}__'])
        cursor = end
    parts.append(text[cursor:])
    TEMPLATE.write_bytes(''.join(parts).encode('utf-8'))
    print(f'Extracted {len(parser.spans)} script tag bodies; template {TEMPLATE.stat().st_size} bytes')

def verify():
    def restore(match):
        return (SOURCES / f'script-{int(match[1]):02d}.txt').read_bytes()
    restored, count = MARKER.subn(restore, TEMPLATE.read_bytes())
    if not count:
        raise SystemExit('No script markers found')
    original_read = Path.read_bytes
    def read(path):
        return restored if path == TEMPLATE else original_read(path)
    with patch.object(Path, 'read_bytes', read):
        html_assets.verify()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--extract', action='store_true')
    if parser.parse_args().extract:
        extract()
    verify()
