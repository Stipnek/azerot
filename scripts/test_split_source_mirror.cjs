'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const code = `
from pathlib import Path
from tempfile import TemporaryDirectory
import sys
sys.path.insert(0, 'scripts')
from split_script_sources import read_source, split_source

def rejects(path, message):
    try:
        read_source(path)
    except ValueError as error:
        assert message in str(error), str(error)
    else:
        raise AssertionError('Invalid source was accepted: ' + message)

mirrors = 0
for folder in Path('src/scripts').glob('script-*.parts'):
    source = folder.with_suffix('.txt')
    assert source.is_file(), 'Retained test source is missing: ' + str(source)
    assert read_source(source) == source.read_bytes()
    mirrors += 1
assert mirrors > 0, 'Expected at least one split source in this repository'
with TemporaryDirectory() as directory:
    source = Path(directory) / 'script-06.txt'
    raw = (('строка' + chr(10)) * 4000 + 'Ж' * 8000).encode('utf-8')
    source.write_bytes(raw)
    assert read_source(source) == raw
    folder = split_source(source)
    assert read_source(source) == raw
    assert split_source(source) == folder
    source.write_bytes(raw + b'// changed retained source')
    rejects(source, 'Split source differs from retained original')
    source.write_bytes(raw)
    extra = folder / 'part-999.txt'
    extra.write_bytes(b'extra')
    rejects(source, 'Missing or extra source parts')
    extra.unlink()
    first = folder / 'part-001.txt'
    saved = first.read_bytes()
    first.write_bytes(saved + b'x')
    rejects(source, 'Corrupt source part')
    first.write_bytes(saved)
    assert read_source(source) == raw
print('PASS: repository mirrors=' + str(mirrors) + '; fallback, UTF-8 round-trip, idempotence, drift, extra part, corrupt part, recovery')
`;
const result = spawnSync('python3', ['-c', code], {cwd: path.resolve(__dirname, '..'), encoding: 'utf8'});
assert.equal(result.status, 0, result.stderr || result.stdout || String(result.error));
process.stdout.write(result.stdout);
