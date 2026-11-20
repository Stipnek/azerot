import base64
import hashlib
import io
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
from urllib.error import URLError
import coin_assets

class CoinAssetsTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z1S0AAAAASUVORK5CYII=')
        header = b'blob ' + str(len(self.png)).encode() + b'\0'
        self.sha = hashlib.sha1(header + self.png).hexdigest()
        self.asset = patch.dict(coin_assets.ASSETS, {'gold': (self.sha, len(self.png), 'UI-GoldIcon.PNG')})
        self.asset.start()
        self.addCleanup(self.asset.stop)

    def local(self, content):
        path = self.root / 'src' / 'coin-assets' / 'UI-GoldIcon.PNG'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return path

    def test_pinned_raw_download_and_verified_cache(self):
        with patch.object(coin_assets, 'urlopen', return_value=io.BytesIO(self.png)) as fetch:
            self.assertEqual(base64.b64decode(coin_assets.restore_coin(self.root, 'gold')), self.png)
            url = fetch.call_args.args[0].full_url
            self.assertEqual(url, 'https://raw.githubusercontent.com/Gethe/wow-ui-textures/' + coin_assets.SOURCE_COMMIT + '/MONEYFRAME/UI-GoldIcon.PNG')
            self.assertNotIn('api.github.com', url)
        with patch.object(coin_assets, 'urlopen', side_effect=AssertionError('Unexpected network')):
            self.assertEqual(base64.b64decode(coin_assets.restore_coin(self.root, 'gold')), self.png)

    def test_local_png_needs_no_network(self):
        self.local(self.png)
        with patch.object(coin_assets, 'urlopen', side_effect=AssertionError('Unexpected network')):
            self.assertEqual(base64.b64decode(coin_assets.restore_coin(self.root, 'gold')), self.png)

    def test_corrupt_local_png_fails_without_network(self):
        self.local(b'corrupt')
        with patch.object(coin_assets, 'urlopen', side_effect=AssertionError('Unexpected network')):
            with self.assertRaisesRegex(SystemExit, 'checksum or format'):
                coin_assets.restore_coin(self.root, 'gold')

    def test_invalid_download_is_not_cached(self):
        with patch.object(coin_assets, 'urlopen', return_value=io.BytesIO(b'not a PNG')):
            with self.assertRaisesRegex(SystemExit, 'checksum or format'):
                coin_assets.restore_coin(self.root, 'gold')
        self.assertFalse((self.root / 'preview' / '.coin-cache').exists())

    def test_network_failure_is_explicit(self):
        with patch.object(coin_assets, 'urlopen', side_effect=URLError('offline')):
            with self.assertRaisesRegex(SystemExit, 'Could not prepare coin gold'):
                coin_assets.restore_coin(self.root, 'gold')

if __name__ == '__main__':
    unittest.main()
