# Pocket Azeroth entry-screen preview

This package adds a separate, unpublished source-build preview. Run `python3 scripts/build_entry_preview.py`, serve the `preview` directory, and open `entry.html`. The ordinary `preview/index.html`, production loader, Pages workflow and main game sources are not changed by this package.

The preview embeds the two low-resolution test backgrounds from `src/assets/entry/`. Their painted buttons and progress bars were cropped away; the painted Pocket Azeroth logo stays in the artwork. Portrait and landscape assets switch with orientation. These are composition-test assets, not final release-resolution artwork.

Loading remains visible for at least 1000 ms after initialization and waits for the native game screen and audio controller. The animated bar is indeterminate: it does not claim a measured loading percentage. Startup timeout offers a working reload button; artwork failure falls back to a text logo.

Enter reveals the existing character creation/selection UI without navigating to another origin or migrating saves. Background game controls are hidden and inert while the entry screen is active. Settings temporarily moves the actual `#az-settings` panel into a modal dialog and restores the same DOM element on close or Escape. Existing volume listeners and the existing audio preference key remain in use. No new gameplay-save writes or identifiers are introduced.

Only working controls are shown. EN/RU controls are intentionally absent until the separately agreed localization work. No account, login/password fields or new authentication is introduced. The original lion artwork and game mechanics remain unchanged.

The CI job checks minimum loading time, artwork decoding/orientation, 44px controls in landscape, settings open/close/Escape, real volume persistence, return of the original settings panel, entry to the native UI, and absence of startup JavaScript errors in Chromium desktop/mobile emulation. It records screenshots and traces and uploads the self-contained entry HTML only after success. Proposed tests are not evidence of a passed browser run; inspect the current commit's CI result.

This preview does not establish full game, combat, Safari or real-device acceptance. It is not published by the current Pages workflow. Promoting it to the normal game startup requires a separately reviewed integration and release approval.
