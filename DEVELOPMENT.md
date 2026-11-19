# Azerot development guide

## Status and source of truth

Development preparation currently lives on `test/css-roundtrip`. The production game has not been replaced by this work. Read current repository files before editing; do not reconstruct implementation details from chat summaries.

The user confirmed that an earlier browser smoke run passed. The two-job workflow introduced in commit `8976235b40b6adcdd91c60da9408404b4c143afc` still needs its own confirmed result. Do not treat an earlier green run as proof that a later commit passed.

Technical documentation should be maintained in English. User-facing conversation remains Russian. The game UI remains Russian until localization is implemented.

## Source layout

- `src/template.html`: markup and source-block order.
- `src/styles.css`, `src/styles-N.css`: CSS blocks corresponding to CSS_BLOCK_N markers.
- `src/scripts/script-NN.txt`: script-block contents corresponding to SCRIPT_SOURCE_NN markers. Some blocks contain JSON, not executable JavaScript; inspect the template script type before editing.
- `src/html-assets/`, `src/css-assets/`: base64 resources. File names are SHA256 hashes of the exact b64 file bytes. Replacing a resource requires a matching new file name and marker.
- `scripts/build_game.py`: source assembler; it does not publish the game.

Keep the approved lion artwork unchanged unless the user approves a replacement. Do not rename save keys or internal identifiers as part of UI translation.

## Local build and preview

Run from the repository root:

```sh
python3 scripts/build_game.py
python3 -m http.server 8765 --directory preview
```

Open http://localhost:8765/ . The generated file is `preview/index.html`; the root production loader is not overwritten. A localhost preview has a different origin from the published site, so production saves do not automatically appear there. Keep a separate backup of existing saves.

## Independent CI checks

1. `Frozen baseline round-trip` checks out baseline commit `03d3f537e326718b1fdd769c8679a1fe66d03e55` and uses the current assembler to verify byte-for-byte equality with that commit's `game-1.txt` plus `game-2.txt`. It protects the original source extraction and assembler compatibility; it does not require new gameplay changes to match the old game.
2. `Current sources browser test` assembles current sources without original-byte comparison, opens them in isolated Chromium at 844x390, waits for character creation or selection, and checks for uncaught startup JavaScript errors.

These checks do not yet verify combat, equipment, rewards, save migration, or English localization. Add targeted tests when changing those systems.

CI artifacts are `browser-smoke-results` (startup screenshot and JavaScript error report when the browser step is reached) and `game-preview` (built HTML after the browser test succeeds). Retention is 14 days. An empty JavaScript error list alone is not proof of success: browser installation, launch, or navigation may fail before game errors can be captured.

## Production boundary

The inspected `main` workflow `.github/workflows/pages.yml` publishes on pushes changing `.github/workflows/pages.yml`, `patches.json`, `index.html`, `game-1.txt`, or `game-2.txt`. It also supports manual dispatch. Documentation and src-only changes are not in its push path filter at the time of inspection; recheck this before any integration.

The production builder currently assembles root game parts and optional patches, not `src/`. Copying sources into main would therefore not, by itself, deploy source changes. The production builder also generates `version.json`; an in-game update notification/button has not been confirmed implemented.

Do not merge the preparation branch or replace production files without reviewing the complete diff and obtaining approval. First confirm both current CI jobs, inspect any branch differences, and prepare a technical-only integration. Do not change deployment logic as an incidental documentation edit. No automatic deployment from the source assembler has been implemented.

## Confirmed English localization plan

An English game version is confirmed for future implementation. Preserve Russian and plan for RU/EN selection rather than deleting the Russian UI.

At localization kickoff, select the exact WoW Classic product branch, verify its latest patch, and record both the branch and patch number/date. The phrase 'latest Classic patch' is not yet a pinned reference: do not silently substitute Retail, Era, progression Classic, or a seasonal branch.

Use official English names from that pinned reference for existing WoW entities. Translate original game content separately and do not present it as official Blizzard text. Keep localization text separate from stable game identifiers and save keys. Localization must not silently change mechanics to match another WoW branch.

## Next work

1. Confirm both CI jobs for the latest preparation commit.
2. Review a technical-only integration into main without changing the published game or deployment behavior.
3. Inspect the existing equipment, inventory, and save code before implementing the agreed hero-screen improvements.
4. Add targeted equipment and save tests, then review any eventual gameplay release separately.

The assistant does not monitor Actions or player progress in the background. If available connectors cannot read an Actions log, pasted error text is sufficient; large HTML attachments are not required for routine changes. External writes require confirmation.
