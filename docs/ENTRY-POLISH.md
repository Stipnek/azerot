# Entry preview: first visual-polish patch

This patch addresses the Computer review of implementation 4ad1a05 without changing the accepted game-entry or audio-save mechanisms.

- Remove automatic focus on the Enter button at startup, preserving the existing visible keyboard-focus outline.
- Fade out loading and fade in actions after the minimum loading interval; skip transition delays for reduced-motion preference.
- Keep the settings header and close button sticky while its content scrolls.
- Use light percentage values and hide diagnostic audio paragraphs only inside the entry settings modal. The same DOM nodes and listeners remain intact.
- Extend browser checks for these changes, short landscape settings at 750x342, and a 342x750 reduced-motion viewport.

Local syntax/parser checks and calculated color contrast do not establish browser acceptance. Check CI for the new head commit.

Still outstanding: high-resolution artwork, safe-zone composition, visible background seams/borders, and a locally bundled font. Existing low-resolution artwork and its fitting mode are deliberately unchanged. This patch is not the final visual release and does not publish or merge anything.
