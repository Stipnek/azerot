# Original PNG backgrounds in the entry preview

Selected after the user's instruction to use the assistant's two latest clean backgrounds:

- Portrait: src/assets/entry/image-2.png, 852x1846, Git blob 36a9ba0f1cf5402514e9145e3374457daf3d386c.
- Landscape: src/assets/entry/image-3.png, 1672x941, Git blob 444f76cf0ca1aa369ad848ecd989648ca6efaf44.

The inventory CI established unique matches for the known generated dimensions. This is metadata-based identification, not an independent visual comparison of the uploaded PNGs. Other uploaded PNG files remain references and are not selected by the builder.

The builder embeds these original PNG bytes directly in the separate entry HTML, without downsampling or image re-encoding. PNG headers, dimensions and Git blob identities are checked. A modified selected file requires review rather than silent replacement. The old test SVGs remain archived but are no longer used by the builder.

The blurred duplicate backdrop is removed. The selected picture uses cover with top-center alignment. On low landscape and short portrait viewports the controls form one row to reduce their vertical footprint. Visual cropping and safe-zone composition still require inspection of the resulting screenshots; these changes do not prove that every logo/statue detail remains visible at every aspect ratio.

Browser checks now verify original PNG dimensions and displayed image bytes, orientation switching, cover fitting, lack of entry-container overflow, and the existing functional controls. The short landscape screenshot is 750x342. CI results for this new commit remain pending until observed.

This supersedes the low-resolution artwork description in the earlier preview notes. The landscape source is 1672 pixels wide, not a promised 1920-pixel or 4K source. A locally bundled font is still outstanding. The ordinary build and Pages publishing workflow are unchanged; nothing is merged or published by this patch.
