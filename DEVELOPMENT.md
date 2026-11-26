# Azerot development guide

Updated: 2026-11-24. Reconciled against `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`; deployment of that revision is not confirmed here.

## Source of truth

Start with [the documentation index](docs/INDEX.md), [design](docs/design.md) and [open requirements](docs/OPEN-WORK.md). Read current sources before editing; do not rebuild the project from old chat summaries. Technical documentation is maintained in English; existing Russian design records and game UI are preserved.

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

The release workflow is `.github/workflows/pages.yml`. Recheck its
triggers and build steps before integration; do not infer the current
release process from historical notes.

### Release triggers

Pushes to `main` and pull requests targeting `main` trigger this workflow
when changes match `src/**`, `scripts/**`, `index.html`, or the release
workflow itself.

Pull requests run checks and packaging without deployment. A matching
push to `main` can deploy after the build job succeeds.

Manual runs on `main` can deploy when the `publish` input is enabled.
Its default is false.

Changes only to this guide or `docs/**` do not match the current automatic
path filters. This does not prevent a separately requested manual run.

### Source build and packaging

The workflow runs source-edit checks, Node regression tests, the coin
asset test, the base game build, and selected browser checks. It creates
the combined entry-and-hero candidate with
`scripts/build_combined_preview.py`.

The release payload is `preview/combined.html`, not the repository-root
`game-1.txt` and `game-2.txt` concatenated directly by the packaging step.

Before packaging, the workflow verifies the candidate's source commit
and SHA256 against `preview/combined-build.json`, and checks required
integration markers.

Packaging (`scripts/package_site.py`, also used by `scripts/test_root_loader_browser.py`) writes:
- `_site/index.html`: the root loader with a build-specific version query, the entry-screen markup from `src/entry/screen.html` and the exact part sizes for the progress bar;
- `_site/entry/`: `screen.css` and the two approved entry images (portrait `image-2.png`, landscape `image-3.png`) shown while the game downloads;
- `_site/game-1.txt` and `_site/game-2.txt`: two parts generated from the
  combined candidate;
- `_site/version.json`: the build hash and source commit.

It verifies that joining the generated parts reproduces the candidate
bytes. The `_site` directory is uploaded for Pages deployment.

Do not assume `preview/index.html` is the published candidate: the
workflow packages `preview/combined.html`.

### Safety and evidence

A successful workflow establishes only what its executed checks cover.
It does not by itself prove complete gameplay correctness or save
migration compatibility.

Older preview-only descriptions in builders or manifests must be
reconciled with their current release use. Do not treat publication as
proof that those descriptions or save-related assumptions are correct.

Review the full diff before integration. Changes under `src/**` or
`scripts/**` can trigger a release when pushed to `main`. Obtain separate
approval for merging and publishing.

This section describes the workflow configuration, not confirmation
that a particular deployment completed successfully.

The old assertion that production does not build from `src/` is obsolete. Root historical game parts and a local ordinary preview must not be assumed equal to the current combined release.

## Validation and reporting

Distinguish frozen-baseline round-trip, ordinary startup smoke, subsystem regressions, combined-candidate checks, deployment and live acceptance. Run targeted tests for the affected system; inspect actual results, failures and skips. Do not report proposed tests as executed. Chromium emulation is not physical-phone or Safari acceptance. Seeded isolated-save tests are not a full production-save migration audit.

For each change report source revision, files changed, tests actually run, CI result, deployment evidence and remaining acceptance. No background execution or monitoring between chat turns is implied.

## Safety and workflow

Use a focused branch from current main and a bounded issue. Preserve approved game design and original assets. Documentation cleanup does not authorize combat, XP, talent, quest, save-schema, localization or balance changes. Read the linked subsystem records before proposing changes; old pending labels alone do not prove a missing implementation.

External writes require exact-action confirmation. PR creation, merging and publication are separate actions. Do not close an issue merely because a documentation branch exists. Do not treat an archived PR as new release content when its head is already in main history.
