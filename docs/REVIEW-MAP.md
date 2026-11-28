# Review map: targeted discovery, not a completed architecture audit

Inspected checkpoint: main at 9938f081b7d6ac15705b27dd0893f9218653cb0a, 2026-11-25. Directory inventories and scripts/lib_engine_load.cjs were retrieved. Unless stated otherwise, entries below are navigation candidates, not verified ownership or test coverage. This working branch may not contain the checkpoint's source changes; compare before using paths or conclusions.

## Read economically

Start with CLAUDE.md and docs/AI-HANDOFF.md. Use docs/INDEX.md for document roles and docs/OPEN-WORK.md for requirements. This map supplements them; it is not another feature backlog.

For a focused bug, locate symbols and relevant filenames first, then read complete relevant functions, applied edits and callers. Do not dump all source, generated HTML, assets or archives into context. For the eventual full revision, track coverage by subsystem and deliberately expand it; targeted search is not proof that unvisited code is safe.

Keep a concise review ledger: inspected commit, system, files/edits read, verified relationships, tests actually run, findings and unresolved questions. Reuse the ledger between sessions and revalidate only against identified changes, without assuming untouched dependencies are irrelevant. Do not store secrets or real saves in it.

## Source and assembly entry points

| Concern | Starting points | Evidence limit |
|---|---|---|
| HTML shell | src/template.html | Located; semantics not audited here. |
| Styles | src/styles.css and numbered src/styles-*.css | Located. Inspect template and builder ordering before selecting the owning style; do not assume numeric filenames alone establish precedence. |
| Game scripts and edits | src/scripts/; scripts/build_game.py; scripts/script_sources.py; scripts/split_script_sources.py | Follow docs/reading-source.md, then verify current implementation. No complete script-to-system map yet. |
| Core modules | src/core/ability-progression.js; src/core/world-maps.js; scripts/core_sources.py | Both module paths located; contents not read in this pass. Older guidance mentioning only ability progression is incomplete for this checkpoint. |
| Entry screen | src/entry/; scripts/build_entry_preview.py; docs/ENTRY-SCREEN.md, ENTRY-POLISH.md, ENTRY-ARTWORK.md | Documents read at earlier checkpoint; current runtime not accepted. |
| Build variants | scripts/build_game.py, build_arms_hero.py, build_entry_preview.py, build_combined_preview.py | Consult docs/reading-source.md and current builders. Identify the actual candidate under test. |
| Assets | src/assets/, src/css-assets/, src/html-assets/; scripts/coin_assets.py, css_assets.py, html_assets.py | Located; do not assume all entries are active or removable. Trace builder references and runtime consumers. |
| Release | .github/workflows/pages.yml; DEVELOPMENT.md | Recheck actual workflow before any merge/publication. Configuration is not deployment evidence. |

## Important loader drift: directly read at this checkpoint

scripts/lib_engine_load.cjs still reads the whole .txt source, validates and applies sorted matching edits, then inlines core. It does not itself use the Python split-source reader.

When __AZEROT_CORE_WORLD_MAPS__ is present, inlineCore now invokes python3 and scripts/core_sources.py through a child process. Otherwise it handles the ability-progression marker locally and rejects unresolved core markers. Thus the earlier whole-file-versus-parts observation still needs investigation, but an ability-only description of core loading is stale. Node tests can now require Python and the production inliner's dependencies for world-map input. No loader execution or behavioral equivalence check was performed for this map.

## Test discovery shortcuts

All paths below are under scripts/. These are candidates located by filename, not claims of assertions, sufficient coverage or successful execution. Read each selected test and its fixtures before use. Distinguish simulations from regressions and browser checks.

| Review area | Candidate files / filename families |
|---|---|
| Source integrity and assembly | check_source_edits.py; test_split_source_mirror.cjs; test_core_inlining.cjs; test_world_map_inlining.cjs |
| Ability progression and UI | test_ability_progression.cjs; test_ability_progression_combat.cjs; test_ability_ui.cjs |
| Arms hero, companions, saves | test_arms_hero.cjs; test_arms_companion_policy.cjs; test_arms_integrated_rules.cjs; test_arms_save_missing.cjs; other test_arms_* |
| Training and specialization | test_neutral_training*; test_auto_spec15.cjs; test_spec15_transition.cjs |
| Inventory and gear | test_inventory*; test_equipment_browser.py; test_equipment_full_bag.cjs |
| Dungeon and loot | test_dungeon_lobby.py; test_deadmines_loot.cjs; test_free_dungeon.cjs |
| Quests, rewards, economy | test_party_quest_ui.py; test_quest_receipts.cjs; test_quest_compact_receipt.cjs; test_world_drop.cjs; test_stone_drop.cjs; test_vendor.cjs; test_coin_*; test_battle_coins.cjs |
| Travel and maps | test_free_travel.cjs; test_world_travel_hint.cjs; test_world_map_inlining.cjs |
| Entry and combined candidate | test_entry_preview.py; test_combined_preview.py; test_neutral_training_combined.py |
| Layout and services | browser_ui_review.cjs; test_service_panel.cjs; test_settings_layout.cjs; test_hero_*.py; test_mobile_art.py |
| Class rules (all classes, specs, main and companion) | test_class_rules.cjs with fixtures/class-rules-known.json; shared lib_class_probe.cjs; report_class_cards.cjs (owner-readable cards, not a gate). See docs/bug-hunt-2026-11-28.md section 7. |
| Balance simulations | sim_enemy_curve.cjs; sim_arms_proto.cjs | 

Inspect scripts/CI_POLICY.md, the relevant workflow and prerequisites before choosing commands. Do not equate the presence of a test with its execution in CI. No tests were run for this document.

## Remaining work before calling the map complete

Read remaining thematic documents. Inspect script and edit inventories, trace real symbols and callers, identify save/load paths and fill in actual system ownership. Verify test assertions and fixtures, build prerequisites and generated outputs. Record explicit decision provenance and superseded requirements. Independently validate current release state if needed. Do not call files unused or delete them on the basis of this map.
