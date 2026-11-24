# Azerot development guide

Updated: 2026-11-24. Reconciled against `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`; deployment of that revision is not confirmed here.

## Source of truth

Start with [the documentation index](docs/README.md), [design](docs/design.md) and [open requirements](docs/OPEN-WORK.md). Read current sources before editing; do not rebuild the project from old chat summaries. Technical documentation is maintained in English; existing Russian design records and game UI are preserved.

Historical requirements from the previous guide remain available in [its checkpoint version](https://github.com/Stipnek/azerot/blob/2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156/DEVELOPMENT.md). They are not cancelled by this rewrite. The old working-branch assignment, production architecture and blanket pending-implementation labels are not current status reports. Reconcile requirements individually in OPEN-WORK rather than copying a second backlog here.

## Source layout and builds

- `src/template.html` defines markup and source-block order.
- Styles and `src/scripts/script-NN.txt` contain extracted source blocks; ordered `.edits.json` manifests apply source edits. Inspect script types and the assembler before changing blocks.
- Preserve hashed resources, approved artwork, stable internal identifiers and save keys.
- `scripts/build_game.py` builds `preview/index.html` without publishing.
- `scripts/build_entry_preview.py` builds the separate entry preview.
- `scripts/build_combined_preview.py` builds the combined entry/hero candidate used by the inspected release workflow.

Run from repository root:

```sh
python3 scripts/build_game.py
python3 -m http.server 8765 --directory preview
```

For the combined candidate, run `python3 scripts/build_combined_preview.py` and open `/combined.html`. Inspect builder flags and save-mode boundaries before testing. Localhost has a different origin from production; do not assume production saves are present. Back up saves before compatibility or migration tests.

## Production boundary

`.github/workflows/pages.yml` is authoritative. At this checkpoint it builds from source, runs module and browser checks, builds and verifies `preview/combined.html`, and packages those exact bytes into `_site/game-1.txt` and `_site/game-2.txt`. It verifies the combined manifest, hashes the output, versions loader requests and writes `_site/version.json` with `sourceCommit`.

Automatic publication runs after a successful build for matching pushes to main. Current path filters are `src/**`, `scripts/**`, `index.html` and `.github/workflows/pages.yml`. Pull requests run the build but do not deploy. Manual dispatch has a `publish` boolean; deployment also requires main. Documentation-only changes do not match those push filters. Recheck the workflow before every release; merging source changes can publish automatically.

The old assertion that production does not build from `src/` is obsolete. Root historical game parts and a local ordinary preview must not be assumed equal to the current combined release.

## Validation and reporting

Distinguish frozen-baseline round-trip, ordinary startup smoke, subsystem regressions, combined-candidate checks, deployment and live acceptance. Run targeted tests for the affected system; inspect actual results, failures and skips. Do not report proposed tests as executed. Chromium emulation is not physical-phone or Safari acceptance. Seeded isolated-save tests are not a full production-save migration audit.

For each change report source revision, files changed, tests actually run, CI result, deployment evidence and remaining acceptance. No background execution or monitoring between chat turns is implied.

## Safety and workflow

Use a focused branch from current main and a bounded issue. Preserve approved game design and original assets. Documentation cleanup does not authorize combat, XP, talent, quest, save-schema, localization or balance changes. Read the linked subsystem records before proposing changes; old pending labels alone do not prove a missing implementation.

External writes require exact-action confirmation. PR creation, merging and publication are separate actions. Do not close an issue merely because a documentation branch exists. Do not treat an archived PR as new release content when its head is already in main history.
