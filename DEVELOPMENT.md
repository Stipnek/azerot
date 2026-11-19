# Azerot development guide

## Status and source of truth

PR #1 was merged into main as e29e66b6fe3f372e5e1e6e0bba089741979d08e7. The user confirmed successful post-merge CSS round-trip check #20 and Build and browser smoke test #8 from a GitHub Actions screenshot. These results are user-confirmed, not independently inspected Actions logs in this session. The preparation branch does not need to be merged again.

The working branch is work/roster-xp-and-updates, created from that main commit. Creating the branch and recording requirements do not implement gameplay changes. Read current repository files before editing; do not reconstruct the game from old files or chat summaries.

Technical documentation stays in English. Conversation and current game UI stay in Russian. Keep the approved lion artwork unchanged. Preserve save keys and stable internal identifiers. External writes require confirmation of their exact content; merging and publishing require separate confirmation.

## Source layout

- src/template.html defines markup and source-block order.
- src/styles.css and src/styles-N.css correspond to CSS_BLOCK_N markers.
- src/scripts/script-NN.txt contains SCRIPT_SOURCE_NN blocks. Some blocks are JSON: inspect the template script type before editing.
- src/html-assets/ and src/css-assets/ hold base64 resources. Names are SHA256 hashes of exact b64 file bytes; replacement requires a matching new name and marker.
- scripts/build_game.py assembles sources but does not publish them.

## Build and preview

Run from the repository root:

```sh
python3 scripts/build_game.py
python3 -m http.server 8765 --directory preview
```

Open http://localhost:8765/ . Output is preview/index.html, not the production loader. Localhost has a different origin from production, so production saves do not automatically appear there. Back up existing saves before migration tests.

Before integration, assembled sources matched the unchanged root game-1.txt plus game-2.txt byte for byte. That comparison was BEFORE optional patches; it does not establish equality with the final published page.

## Existing independent CI checks

1. Frozen baseline round-trip checks out 03d3f537e326718b1fdd769c8679a1fe66d03e55 and runs the current assembler against that baseline with --check-original. It protects extraction and assembler compatibility, not equality of future gameplay with the old game.
2. Current sources browser test builds current sources, opens isolated Chromium at 844x390, waits for character creation or selection, and checks uncaught startup JavaScript errors.

These checks do not establish correct combat, rewards, equipment, save migration, progression, or localization. Add targeted tests for changed systems. Do not report proposed tests as executed.

Artifacts: browser-smoke-results contains a startup screenshot and JavaScript error report when those steps are reached; game-preview contains built HTML after browser success. Retention is 14 days. An empty error list alone is not proof of a successful browser run.

## Production boundary

The inspected Pages workflow publishes main changes to .github/workflows/pages.yml, patches.json, index.html, game-1.txt, or game-2.txt, and supports manual dispatch. Recheck filters before integration. Source-only or documentation-only changes do not themselves release gameplay.

Production assembles the root parts, applies optional patches, hashes the final bytes, versions loader requests with that hash, and writes version.json. It does not build from src/. Preview must not be assumed equal to patched production. Do not replace production files or change deployment incidentally. Review the complete release diff and obtain separate publication approval.

## Agreed experience rules: pending implementation and tests

- Each already acquired roster character receives 100% of the base quest or dungeon experience reward; rewards are not divided by roster size. Replace the old 25% reserve rate with 100%.
- A companion who participated in combat and is below the main character's level receives 125% instead of 100%, not an additional 125%. A companion who has caught up receives 100%.
- The main character's level cap or a quest being low-level for the main must not suppress roster rewards. Each recipient uses their own experience and level.
- Support multiple level gains from one reward and a level cap of 60. A newly acquired character starts at level 1 with no retroactive rewards.
- Repeatable dungeons provide post-campaign progression: builds, main-character gear, an accessory for each party character, and roster experience. No additional endless mode is required for this purpose. Inspect room, completion, and skip rewards to prevent accidental duplicate awards.

Targeted tests must cover a level-60 main with a level-1 companion, reserve rewards, catch-up eligibility, multiple level gains, cap behavior, save/load compatibility, and duplicate processing. Exact handling of a reward that catches a companion up mid-award must be made explicit before implementation; do not silently choose a new rule.

## Ability progression and talents: design gate

Target approximately six main abilities per class/specialization, excluding passives, unlocked gradually over 60 levels. A complete set by level 50 is allowed but no exact schedule is approved. The first location must not require playing throughout with only one ability. Companions unlock abilities by their own level.

Before changing progression, audit actual character sets, effects, resources, AI priorities, auto-attacks/basic healing, dependencies, specialization changes, and save paths. Present proposed sets and unlock order for approval. Ability definitions alone do not prove runtime availability or correctness.

The eight current named legendary characters are the starting roster for personal seventh abilities. Their personal ability unlocks at their own level 60 and belongs to the named character, not merely orange card quality. Lore-based effects suggested in conversation are proposals, not approved final mechanics.

The hero journal/overview must show ability icon slots, including greyed-out locked abilities with their unlock level and readable descriptions. Locked abilities cannot be used.

Talents become available from level 10. Free allocation across trees is the preferred direction; do not confuse the current specialization selector with an implemented talent tree. How talents alter ability sets, hybrid builds, roles, and druid directions still requires separate design agreement. Do not implement automatic full-kit replacement based on majority talent points without agreement.

## Agreed interface fixes: pending implementation

- Restore the tavern notification dot when summoning stones cover a summon.
- Follow drawn roads and avoid obstacles; inspect the central Duskwood mountain crossing.
- Smooth card flips, with Hearthstone as a motion reference.
- Show equipment acquisition in a separate 2-3 second notification with a timer; clicking opens inventory.
- Group tavern, merchant, and catalog under one button left of Hero, expanding upward to free quest-panel space.
- Remove the unapproved Show first companion map button.
- Restore hold interaction for party statistics and remove the added separate button.

No unrelated interface changes are authorized.

## Agreed soft update behavior: pending implementation

Check version.json on startup, on return to the tab, and periodically. Notify the player when a newer build is available. Do not force a reload or interrupt combat, summoning, reward delivery, or other unfinished actions.

The player chooses to update at a safe point. Persist progress successfully before reloading; on save failure, do not reload and show an error. Offline/version-check failures must not block current play. Verify existing-save compatibility before release. The existence of version.json does not prove an in-game updater is implemented.

## Confirmed future English localization

Preserve Russian and plan RU/EN selection. At kickoff, select the exact WoW Classic product branch, verify its latest patch, and record branch and patch number/date. Do not silently substitute Retail, Era, progression Classic, or seasonal versions.

Use official English names from that pinned reference for existing WoW entities. Translate original game content separately without presenting it as Blizzard text. Keep localization separate from save keys and mechanics.

## Execution order and reporting

1. Read the complete current reward implementation and its callers; resolve connector truncation without asking the user to supply large game files.
2. Prepare the roster experience fix and targeted tests, then report actual results and limitations.
3. Implement soft updates and agreed interface fixes in reviewable packages.
4. Complete ability and legendary-skill proposals; obtain design approval before progression changes.
5. Review integration and eventual gameplay publication separately.

The assistant does not work or monitor Actions in the background between turns. Report file changes, executed tests, confirmed CI results, and pending work distinctly.
