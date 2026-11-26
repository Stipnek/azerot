# Pocket Azeroth entry screen

> **Status 2026-11-26:** the release workflow publishes the combined build, which includes this entry screen. Statements below that this is preview-only, test-only or unpublished describe their own date. Open items are tracked in [OPEN-WORK](OPEN-WORK.md) (ENTRY-01).

Updated: 2026-11-24. Source checkpoint: `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`. Related: issue #22 and the audit recorded in closed PR #11.

## Build modes

The entry package began as an isolated preview. That historical restriction is not the current release architecture. `scripts/build_entry_preview.py` produces the separate `preview/entry.html`; `scripts/build_game.py` produces the ordinary preview. The inspected Pages workflow builds and verifies `preview/combined.html` through `scripts/build_combined_preview.py`, then packages those exact bytes for publication. See [DEVELOPMENT.md](../DEVELOPMENT.md) and `.github/workflows/pages.yml`.

A local preview, merged source, successful deployment and player acceptance are distinct states. This document does not confirm that the checkpoint has deployed.

## Entry behavior

Loading remains visible for at least 1000 ms and waits for the native game screen and audio controller. The animated bar is indeterminate, not a measured percentage. Startup timeout offers reload; artwork failure falls back to a text logo.

Enter reveals the existing game UI without authentication or navigation to another origin. Background game controls are hidden and inert while entry is active. Settings temporarily moves the actual `#az-settings` panel into a modal and restores the same element on close or Escape, retaining existing audio listeners and preference key. See the combined builder for the hero-mode boundary; entry-overlay behavior alone does not establish normal-save migration compatibility.

Only working controls are shown. EN/RU selection remains separate localization work; no account or password system is introduced.

## Artwork and polish

Current selected assets are the original portrait and landscape PNGs described in [ENTRY-ARTWORK.md](ENTRY-ARTWORK.md), not the old test SVGs. [ENTRY-POLISH.md](ENTRY-POLISH.md) records the first polish patch and its superseded assumptions.

## Validation limits

Entry tests cover readiness timing, decoding/orientation, control geometry, keyboard focus, settings close/Escape, volume persistence, return of the original settings panel and entry into the native UI. Combined tests exercise additional integration paths. Test definitions are not execution results; inspect checks for the exact revision. Chromium emulation does not establish Safari, physical-device, complete combat or production-save acceptance. Verify cropping and readability on the current candidate before declaring visual acceptance.
