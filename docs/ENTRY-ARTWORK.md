# Entry artwork

> **Status 2026-11-26:** the release workflow publishes the combined build, which includes this entry screen and artwork. Statements below that this is preview-only, test-only or unpublished describe their own date. Open items are tracked in [OPEN-WORK](OPEN-WORK.md) (ENTRY-01).

Updated: 2026-11-24. Selected original PNGs:

- Portrait: `src/assets/entry/image-2.png`, 852x1846, Git blob `36a9ba0f1cf5402514e9145e3374457daf3d386c`.
- Landscape: `src/assets/entry/image-3.png`, 1672x941, Git blob `444f76cf0ca1aa369ad848ecd989648ca6efaf44`.

The inventory established unique matches for known dimensions, not an independent visual comparison. The builder embeds original PNG bytes without downsampling or re-encoding and validates dimensions and blob identity. Replacing a selected asset requires review. Other uploaded PNGs remain references; old test SVGs are archived and are not the selected builder artwork. Do not delete them as part of documentation reconciliation.

The selected picture uses cover with top-center alignment; the blurred duplicate backdrop was removed. Controls form one row on short portrait and low landscape viewports. These rules do not prove every painted logo/statue detail remains visible at every aspect ratio.

Browser checks include PNG dimensions and displayed bytes, orientation switching, cover fitting, entry-container overflow and controls, including short landscape. Inspect actual results for the exact revision. Test coverage is not visual acceptance.

This supersedes the early low-resolution-artwork notes. The landscape source is 1672 pixels wide, not a promised 1920-pixel or 4K source. The historical locally bundled font concern must be checked against current sources before opening implementation work.

The initial artwork patch did not itself publish anything. The current Pages workflow separately packages the combined entry/hero build; see [ENTRY-SCREEN.md](ENTRY-SCREEN.md). This document does not confirm deployment or real-device acceptance.
