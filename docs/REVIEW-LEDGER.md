# Review ledger

Purpose: persistent coverage ledger for the full project revision required by CLAUDE.md (phase 1, read-only). Reuse it between sessions; revalidate only against identified changes. It records what was read, what was checked and what remains open. It is not a requirements register (see OPEN-WORK.md) and it does not approve, merge or delete anything.

## Session 1 — 2026-11-26 (day 1: documentation and repository inventory)

### Revision and state

- Working branch `claude/nifty-fermat-oci73c`, created from main at `50bd6ab0c4ee13482f07380cca02f38c9169673b` ("fix: align Westfall lighthouse with map artwork (#30)"). Clean tree at start.
- main baseline checks executed in an isolated export of `50bd6ab` (not in the working tree):
  - `python3 scripts/check_source_edits.py`: pass, 6 sources, 82 manifests, 329 unique replacements.
  - all 40 `scripts/test_*.cjs` under Node 22: pass.
  - `python3 scripts/build_game.py`: pass, 51907545 bytes, SHA256 `b3309ff8…6266848`.
  - Not run: 16 Python browser tests (`scripts/test_*.py`; Python Playwright not installed here), combined build, Pages packaging, any live-site check.
- Earlier in this session PR #26 was fixed on its own branch (`work/elwynn-collection-dialogues` → `da81744`) with the owner's approval; see "Open pull requests".

### Method and limits

- Core documents read in full by the lead: README.md, DEVELOPMENT.md, CLAUDE.md, docs/INDEX.md, docs/AI-HANDOFF.md, docs/REVIEW-MAP.md, docs/OPEN-WORK.md, docs/reading-source.md.
- Thematic groups were read in full by delegated read-only reviewers whose reports are summarised below. Summaries restate documents; they are not code verification unless marked "checked".
- Partially read (by design): docs/validation/feedback-ui-source.json and rarity-source.json (metadata, markers and excerpt boundaries only; the files themselves store fixed-length truncated source windows). Root game-1.txt, game-2.txt, preview/index.html, patch/bundle bodies and dev-readback chunks: headers only.
- Not checked anywhere in session 1: GitHub Actions history, branch protection, Pages settings, live site, PNG contents.

### Remote branches (fetched 2026-11-26)

28 branches. Unmerged work exists only on:

| Branch | Ahead/behind main | Content | Assessment |
|---|---|---|---|
| work/elwynn-collection-dialogues | 7 / 36 | PR #26, Eagan dialogue pilot + quest wood | Active. Merges cleanly with main; edits check, node tests and build pass on the merge (local check). |
| fix/initial-loading-screen | 6 / 30 | PR #28, root loader with artwork, real download progress, entry buttons | Owner wants this feature. Merges cleanly; build passes on the merge. Audit list in the PR body still open. |
| docs/documentation-refresh | 5 / 40 | Reconciliation of 12 docs (design, entry, OPEN-WORK, arms, BM, training, spec15, new docs/README.md) | Unmerged documentation work. Only DEVELOPMENT.md overlaps with later main changes. Must be reconciled, not redone. |
| work/docs-index-combat | 2 / 4 | INDEX.md combat section, new PROGRESSION-BALANCE-NOTES.md | Unmerged documentation work based on recent main. |
| work/c1c4-harness | 1 / 59 | tools/c1c4-harness (warrior L1→L2 probe, report, CSV) | Unmerged tooling/evidence. |
| diagnostics/arms-de045d3, diagnostics/arms-hero-f8d0bd7 | 1 / 216, 1 / 207 | Preserved failure logs and source snapshots | Evidence only; written by write-back workflows. |
| work/ui-redesign-review | 3 / 206 | "Add files via upload" ×3, 171 files | Old upload package; not reviewed. |

All other branches are fully merged (ahead 0).

### Open pull requests

- PR #26 (draft): build failure was caused by a quest-items edit anchored to a pre-dock `renderV56Gear` signature, plus three node tests missing `worldQuestItems` in their extracted-function list. Fixed in `da81744`; local checks pass; browser tests and CI result not yet confirmed by this session.
- PR #28 (draft, "DO NOT MERGE"): root `index.html` loader. Latest version (`a7fdef7`) removed the iframe and separate boot audio; music starts only after the game is ready. Touches the release loader, so merging deploys. Its workflow has `contents: write` and pushes results back to its branch.

### Document inventory (all docs/, root reports, DOCX)

Every file under docs/ plus CHANGELOG.md, report.md and sim-report-N300.md was read in full in session 1, except the two validation JSON excerpts noted above. The DOCX archive's text is the same as docs/opus-audit.txt apart from list formatting (checked by extraction); its three claude.ai links were not fetched.

| Group | Documents | Role as stated | Key status |
|---|---|---|---|
| Entry/release guidance | README, DEVELOPMENT, CLAUDE, INDEX, AI-HANDOFF, REVIEW-MAP, reading-source | Guidance | Current. INDEX and DEVELOPMENT omit many 11-21+ documents; DEVELOPMENT names an old working branch. |
| Requirements | OPEN-WORK (11-20), CHAT-AUDIT (11-19) | Requirement registers | OPEN-WORK predates all combat, arms, enemy-curve, entry, branding and quest documents; many later requirements are missing from it (see below). |
| UI and dungeon design | design.md, design-layout-correction.md, design-world-travel.md, ui-review-register.md, CHANGELOG.md, loot/deadmines.md | Decisions + scoped evidence | Layout correction supersedes design.md placement. Service label: docs say «Меню», source uses «Город» (provisional per register); final label undecided. Deadmines loot and PR #2 are on main although docs say "working branch". CHANGELOG covers one package only. |
| Entry screen and branding | ENTRY-SCREEN, ENTRY-POLISH, ENTRY-ARTWORK, BRANDING | Decisions + historical | ENTRY-ARTWORK supersedes ENTRY-SCREEN art. "Not published by Pages" is stale: pages.yml requires the entry overlay in the release (checked). Open: bundled font, safe-zone, device acceptance, trademark availability. |
| Combat decisions | combat-decisions, -bm, -interrupts, -passives, -pets, -training (11-21) | Owner-approved design, not implementation | combat-pets supersedes Voidwalker 9→10; combat-passives closes the 15/30 schedule. Pet schedule appears unimplemented (single PET_SELECTION_LEVEL=10, grep only). |
| Arms / talents | prototype-arms, arms-stage1-temporary-rules, arms-integration-gates, spec15-transition-scope, computer-talent-tree-task | Prototype, accepted temporary rules, gates, scope, task | stage1 supersedes prototype Mortal Strike/Deep Wounds. "Test only / not published" statements are stale: the release build asserts `__AZEROT_ARMS_HERO__=true` (checked). Talent tree "no scrolling" requirement vs merged internal-scroll dialog (PR #17) unresolved. |
| Architecture | core-module-contract, modularization-notes | Plan / advice | First core module exists (src/core/ability-progression.js) and a second (world-maps.js); docs not updated. Proposed docs/source-map.md does not exist. |
| Balance | enemy-curve, enemy-curve-sim (11-23), sim-report-N300.md | Report + simulation evidence | Implemented and merged; owner decisions still open (curve middle, keep level shift?, weak solo mage 15+). Simulation numbers are historical. |
| Audits | opus-audit.txt + DOCX (11-20), report.md (11-21) | Historical audit / executed QA | Opus table C is a proposal; several findings superseded, several unverified on current main (Subtlety stealth zero-action, Whirlwind/Cleave AI exits, createBattle level fallback, Holy paladin solo). report.md's four Arms UX blockers: strings still present in sources (effective build unchecked). |
| Quests | docs/quests/* (11 files, 11-23/24) | Research, template, audit, card draft, art prompts | Research only. No quests from these zones found in source except the pre-existing Wetlands Lightforge chain (cl_sven11–13) and the Tirisfal map shell (grep). quests/README omits wetlands-cards.md and ZONE-TEMPLATE.md; INDEX omits four quest files and wrongly says Alterac is missing from the README table. tirisfal.md still carries wording withdrawn by quest-audit (367, 358). |

### Requirements present in documents but missing from OPEN-WORK.md

Combat: spec at 15 and neutral training rules; 15/30 passive schedule; pet unlock schedule and persistence; BM Multi-Shot kit, Soul Link, seals, event model; interrupt policy; Deadmines enemy-ability review; icon/sound provenance. Arms: report.md UX blockers; integration-gate checks (14/15, 29/30, companion seventh active); neutral training for seven non-warrior classes; talent tree without scrolling. Balance: enemy-curve owner decisions. UI: ART-01 acceptance matrix; RELEASE-01 (source/build/live identity); SYS-01 UI system; DM-04 result/defeat/completion screens; service-menu lifecycle; final service label; entry-screen open items; physical Android check; coin PNG licence and network fetch at build. Architecture: core extraction acceptance gates.

### Root files and workflows

| Item | Classification (evidence: git grep over .github, scripts, src, docs, root docs) |
|---|---|
| index.html | ACTIVE: release loader packaged by pages.yml. |
| game-1.txt, game-2.txt (15 MB each) | ACTIVE as CI baseline only (css-roundtrip on main/PRs, --check-original, css_assets verify). Not the release payload. |
| preview/index.html (30 MB, tracked) | Stale generated build; every local build overwrites a tracked file. Owner decision needed. |
| preview/arms-proto.html | Referenced prototype output. |
| arms-proto.html (root) | DUPLICATE of preview/arms-proto.html. |
| common.py, extra.py, full.py, report.md, ci-two-heroes-result.json, shots/ | DUPLICATE of azerot-qa-5e6f893/ (identical). |
| azerot-qa-5e6f893/, azerot-qa-d8c3b96.zip | QA evidence packages; zip duplicates dev-readback/ux-review-d8c3b96. No references. |
| azerot-arms-prototype.patch / .bundle | Superseded prototype commit dede447; the bundle is its only copy. |
| sim-report-N300.md | Historical prototype evidence, unreferenced. |
| dev-readback/ | Output of historical write-back workflows; nothing reads it. |
| classic-original-art-9002a2be…/ | Contains Blizzard WoW Classic client textures; its NOTICE.md says they are not covered by the repository licence. Licensing/distribution question for the owner. |
| abacus | Empty test file. |

Workflows: 44. Only pages.yml can deploy (push to main on src/**, scripts/**, index.html, pages.yml; or manual publish=true). 17 workflows have contents: write and push to hardcoded non-main branches; scripts/CI_POLICY.md calls write-back workflows historical. Many workflows fire only on dormant branches. preparation-integrity appears unable to pass if triggered (expects index.html unchanged since 1c23a2c; inferred, not run).

### Findings so far (phase 1, not yet approved for fixing)

Confirmed bugs:
1. `src/scripts/script-05.zzzzz-first-quests-level-shift.edits.json` lists keys `koboldcamp`, `echoscout`, `echoraid`, `golddust`, `lostguards`; game source uses `kobold_camp`, `echo_scout`, `echo_raid`, `gold_dust`, `lost_guards`. The level shift silently does not apply to these five. Whether the shift should exist at all is an open owner decision (enemy-curve doc).
2. PR #26 failures (fixed on its branch, see above).

Documentation drift: items listed in the inventory table, chiefly stale "not published / test only" claims for the entry screen and integrated hero mode, outdated OPEN-WORK, INDEX gaps, quest README/INDEX gaps, CHANGELOG coverage.

Owner questions:
- Keep, move or remove the duplicate/historical root files? Keep Blizzard textures in a public repo?
- Keep preview/index.html tracked?
- Retire dormant and write-back workflows?
- Final service-button label; talent-tree scrolling; level-shift decision; enemy-curve middle; non-warrior training kits.
- Merge, rebase or retire the unmerged docs branches (docs/documentation-refresh, work/docs-index-combat) before new documentation edits.

Unverified claims needing day-2 code tracing: Opus risks (Subtlety, Whirlwind/Cleave AI, createBattle level fallback), pet schedule implementation, report.md blockers in the effective build, deadmines dmCatalogue single source, XP-01/02 implementation, soft update (UPDATE-01).

### Next session plan (day 2)

1. Source map: systems → base source/parts → ordered edits → core → callers → tests, starting with saves, rewards/XP, combat AI, inventory/equipment, quests, loader.
2. Trace the unverified claims above in the effective (edit-applied) source.
3. Produce the phase-2 findings report for owner approval.

### Session 1 addendum — owner answers and follow-up (2026-11-26)

Owner answers: (1) early quests are not passable in play without weakening after active abilities were removed, so some easing is needed, preferably done properly; (2) the owner is currently the only player, so "published" integrated mode is acceptable and docs should describe it as the release; (3) third-party material stays for now with a fan-project notice (added to README.md); (4) asked what to do with OPEN-WORK.md.

Level-shift key check (executed, `/scratchpad/shift_sim.cjs`, engine via scripts/lib_engine_load.cjs at 50bd6ab, 100 seeds per class, neutral training, enemy curve on): for kobold_camp, echo_scout, echo_raid, gold_dust and lost_guards every class wins 100% both at the current level and one level lower. Fixing the misspelled keys would therefore not change the simulated outcome. `ONLY_SOLO_EARLY=1 node scripts/sim_enemy_curve.cjs 60 14`: every quest encounter up to level 14 ≥95% for every class; only the level-1 ambush of three murlocs is low (mage 43%). The simulator contradicts the owner's in-game experience; the cause is unknown. Candidates to check on day 2: differences between simulator assumptions and the real game path (party composition and companion levels, carried HP between fights, ambush frequency, gear, which abilities the release build actually grants before level 15, the combined/hero build vs the engine loader).

Documentation branches merged into this review branch (not main): docs/documentation-refresh (5 commits; DEVELOPMENT.md conflict resolved by keeping main's newer release section inside the refreshed structure) and work/docs-index-combat (clean). Consequence: there are now two documentation indexes, docs/README.md (from the refresh branch) and docs/INDEX.md; consolidation is part of the OPEN-WORK/index step. The refreshed DEVELOPMENT.md moves detailed earlier requirement text (XP, ability gate, interface fixes, soft update, localization) out to a link to the 2c2fc62 checkpoint; OPEN-WORK keeps short versions. Fold the detailed acceptance criteria back into OPEN-WORK during reconciliation so nothing is lost.

### Session 1 cleanup (owner instruction 2026-11-26: remove obsolete material, follow best practices, merge if verified)

Done on `claude/nifty-fermat-oci73c` (not on main):
- Deleted root items: abacus, arms-proto.html (duplicate), azerot-arms-prototype.bundle/.patch, azerot-qa-5e6f893/, azerot-qa-d8c3b96.zip, ci-two-heroes-result.json, common.py, extra.py, full.py, report.md, shots/, sim-report-N300.md, dev-readback/. Untracked preview/index.html and preview/arms-proto.html; .gitignore now ignores preview/, _site/, test-results/.
- Retired 28 workflows: arms-browser, arms-hero-browser(-readback), arms-integration-diagnostics, arms-prototype-tests, arms-two-heroes, audit-css, audit-html, classic-art-preview, entry-art-inventory, extract-css-assets, extract-html-assets, extract-scripts, feedback-source-inspect, neutral-training-browser, opus-audit-package, preparation-integrity, rarity-source-inspect, recruit-fix, roster-xp-patch, save-css-sources, soft-update, source-readback, split-script-source, talent-visual-readback, talents-integration-ci, ui-redesign-validation, ui-test-preview. Kept 16; removed their push triggers on old branches (browser-smoke and css-roundtrip keep main). pages.yml unchanged.
- Docs: single index (docs/INDEX.md, docs/README.md removed), rewritten OPEN-WORK.md as the single register (all earlier IDs kept, new IDs BAL-01…04, SPEC-01/02, PET-01, COMBAT-01, ARMS-01/02, TALENT-02, AUDIT-01, QUEST-03/04, UI-09, ENTRY-01, LOAD-01, RELEASE-01, LEGAL-01, ARCH-01, REPO-01, STOCK-01), new WORKFLOW.md, historical records moved to docs/archive/, status notes added to stale documents, quest README links fixed.
- Kept deliberately: root game-1.txt/game-2.txt (css-roundtrip baseline), classic-original-art-* (owner: keep for now), scripts used only by retired workflows (changing scripts/** would trigger a release; separate step).
- Verified after cleanup: check_source_edits (329 replacements), 40 node tests, coin asset test, build_combined_preview.py, check_css_roundtrip.py (28 blocks, 30245533 bytes match), relative Markdown link check (0 broken).

## Session 2 — 2026-11-26 (day 2)

### Revision and state

- Branch `claude/nifty-fermat-oci73c` at `362e06f` (clean). Diff to main `50bd6ab` checked: no paths under `src/`, `scripts/`, `index.html` or `.github/workflows/pages.yml`; the only deploying workflow is pages.yml. On push to main only browser-smoke (DEVELOPMENT.md path) and css-roundtrip would run, both checks.
- Remote: 29 branches. Fully merged into main (ahead 0), 19: feature/talent-tree-restyle, fix/world-map-art-alignment, fix/world-map-startup-and-tirisfal, test/arms-talent-prototype, test/css-roundtrip, work/abacus-test-file, work/ability-schedule-test, work/arms-inspector-safe-area, work/arms-touch-preview, work/docs-release-guide, work/enemy-curve, work/first-quests-balance, work/hero-talents-rework, work/player-feedback-fixes, work/pocket-azeroth, work/pocket-entry-screen, work/roster-xp-and-updates, work/talents-integration, work/ui-redesign-clean. docs/documentation-refresh and work/docs-index-combat are ancestors of this branch. Open PRs (search API): only #26 and #28.
- Owner-requested GitHub actions **not performed**: this session has no GitHub MCP tools, and `git push` of the archive tags was refused by the session proxy (HTTP 403). No PR was created, nothing was merged, no tags or branches changed on the remote.

### BAL-04: why the simulator says early quests are passable

Executed: `python3 scripts/build_combined_preview.py` (local), runtime dump of quests and encounters from the built game in Chromium (isolated context, no saves, scratch-only debug hook), engine probe. Evidence and scripts: [evidence/bal-04](evidence/bal-04/README.md).

Checked and **not** the cause: runtime `Battle.ENCOUNTERS` for every early quest (levels, enemies, size, type) and `ENEMY_CURVE` are identical in the release build and in the engine the simulator loads; new heroes do get neutral training (`autoSpec15` v1 on creation, arms-hero mode); companions never get neutral training in either.

Causes (confirmed by code reading and executed probe):
1. **Hero level assumption.** `sim_enemy_curve.cjs` fights every encounter with the hero at the encounter's level (solo ≤9 also one below). In the game enemies are spawned at the encounter level (`spawnEnemy`: `ENCOUNTERS[st.encounter].level`) while heroes use their own level (`createBattle`: `p.level`, from `hLevel`). Quests have no level gate: `qNeedMet` checks only `minLevel` (none in Elwynn/Westfall) and the `need` chain. Hogger (7) needs only echo_raid (3); all Westfall quests (10–14) need only hogger/each other.
2. **XP economy is short of the quest levels.** Doing every Elwynn and Westfall quest up to level 14 lowest-first yields 6350 XP → own level 12. On arrival the hero is 1–3 levels below: princess 6 at 4, wf_heirloom 10 at 8, wf_patrol 12 at 10, wf_bandanas 13 at 10, wf_coast1 13 at 11, wf_sander4 14 at 12, wf_coast2 14 at 12. At those levels win rates collapse (e.g. wf_bandanas 0% for warrior/druid/priest/mage; wf_sander4 0–1% for druid/priest/mage/warrior; wf_coast2 0–56% even with 3 heroes) while the same fights at the encounter level are ≥95%.
3. **Goal quests spawn more enemies.** `prepareQuestEnemies` replaces the encounter's enemies with up to 3 remaining goal targets; ef_candles/kelp/linen/frontier/bounty have one static enemy, which is what the simulator fights. With the hero's level on the path these remained winnable, so this is a simulator gap, not the main cause.
4. **Party size from level 10.** The simulator assumes main + prot warrior + holy priest for groups from 10. A player with only the free companion fights two-hero groups (wf_militia2 and wf_coast2: 0% for every class at own level 11–12).

Conclusion: the simulator answers "can a hero at the quest's level win?", the game asks "can the hero at the level the XP actually gives win?". Fix order proposed for owner approval: (a) make the simulator follow the campaign path (own level from XP, goal enemies, party actually available), (b) then choose the balance lever: quest XP / curve per level, level gates (`minLevel`) on Westfall, or per-encounter levels. No gameplay change made.

Open questions for the owner: how many companions do you have at levels 6–14, and at which quest/level did fights first become unwinnable? Which lever is preferred (more XP, gating quests by level, lower encounter levels)?

## Session 3 — 2026-11-27 (BAL-05, BAL-06, QUEST-07, bounded revision)

### Revision and state

- Start: branch `ccr-56c668ef-hfihwp` = main = `c56bd95`, clean. Work: `9c0f5bf` (BAL-05/06), `3f8abfb` (tutorial dummies), `641dbf8` (QUEST-07), plus this ledger. Nothing merged to main, nothing published.
- Read: CLAUDE.md, AI-HANDOFF (current), WORKFLOW, OPEN-WORK, INDEX, REVIEW-MAP, reading-source, README, DEVELOPMENT; effective script-05 (enemy curves, createBattle, spawnEnemy, groupScale, heroStats, solo cap) and script-06 (partyArg, tavern rarity bonus, quest gear, Deadmines loot, prepareQuestEnemies, ambush, foeLine, renderJournal, Eagan pilot, gather pilot, qNeedMet/qOpen), sim_campaign.cjs, lib_engine_load.cjs, test_arms_proto.cjs, lib_flagoff_fingerprint.cjs, test_elwynn_dialogue_browser.py, pages.yml test steps. Not read this session: the rest of script-04/05/06/08, styles, core modules, most tests.
- Executed: check_source_edits; all 43 `scripts/test_*.cjs` (0 failures at `641dbf8`); build_game, build_combined_preview; browser tests at `9c0f5bf`: dungeon_lobby, elwynn_dialogue, elwynn_gather, neutral_training, combined_preview, root_loader, party_quest_ui — all PASS; at `641dbf8` (final code): the same seven plus world_map_saves and equipment_browser — all PASS; rewritten elwynn_dialogue covers desktop and mobile. Simulator runs: docs/evidence/bal-05-06.

### Findings (not fixed unless stated)

| # | Kind | Finding | Evidence |
|---|---|---|---|
| F1 | Confirmed vs owner rule | Shadowform (+15% shadow damage dealt, −15% taken) is on for every Shadow priest as soon as the spec applies (own level 15; companions from level 1 since PLAY-02). Issue #3 records the owner's floor: not before level 40. | script-05 `CLASSES.priest.specs.shadow.shadowform: true`; createBattle `shadowform: !!s.shadowform`; damage ×1.15 / ×0.85 |
| F2 | Balance | Protection paladin tanks far worse than Protection warrior: fire mage + tank + holy priest vs three Duskwood skeleton mages, 15% vs 60% wins (warrior main: 28% vs 85%). | ad-hoc engine run, 40 seeds |
| F3 | Balance (BAL-03) | Fire mage at 15–18 and cat druid at 15 lose most two-enemy solo fights vs strong types (0–10%), before and after BAL-05. | evidence/bal-05-06 |
| F4 | Content data | Player-facing developer notes in quest texts: db4 «Адаптация: переход и засада…», wf_silk «Адаптация: отдельный бой…», rr_shadow «Боевая модель заклинателя пока переиспользует модель орка.», cl_sven15 «…поездки за слитками и в кузницу исключены.», cl_emb15 «Записка расшифрована без отдельных этапов доставки.» Same class of text the owner already had removed (player-quest-story edit). | runtime quest dump |
| F5 | Content data | wf_pie: quest giver Верна Хмуробров, text says «Салме Сальден нужна печень жутеклыков». | runtime quest dump |
| F6 | Confirmed (issue #23) | Arms talent «Управление гневом» requires `tactical`, which the prototype marks unavailable, so it can never be learned; the UI now says «Описание эффекта ещё не проверено». Background of the tree not checked. | script-05 ARMS_TREE `anger … req: 'tactical'` |
| F7 | Dead code | `foeLine()` (encounter enemy summary, edited by two manifests) has no caller in the assembled script-06. | grep of assembled source |
| F8 | Minor | spawnEnemy's `!st.test` is always true (setupTest runs after spawning); harmless because test dummies are excluded by key/AI. ELWYNN_STORY offer/completion texts are unused after QUEST-07 (kept as provenance). | createBattle order |
| F9 | Fixed | Simulator used the solo two-enemy cap for group goal fights (game: 3). | sim_campaign.cjs |
| F10 | Fixed before release | BAL-06 first version scaled the tutorial «Первая совместная тренировка» dummies ×12 (main + first companion must win). | 3f8abfb |

### GitHub issues (6 open, 0 open PRs) — proposed handling, owner decides

| Issue | State in code | Proposal |
|---|---|---|
| #24 gather pilot (Raelen) | Implemented and released (PR #26); 5% chance approved; rounding up approved (QUEST-05) | Close as done; remaining acceptance stays in OPEN-WORK QUEST-03 |
| #23 Arms «Управление гневом», tree background | F6 confirmed; background not checked | Keep open; decide: hide the talent, or make Tactical Mastery available |
| #22 entry-screen docs | Docs carry 2026-11-26 status notes and supersession (INDEX) | Close as done |
| #13 neutral training before 15, training quests later | Neutral training and auto DD at 15 implemented (SPEC-01); training quests not started | Close the decision part; keep «training quests» as a new OPEN-WORK item |
| #12 compact reward, full bag | reward-compact and equipment-dock edits with tests on main | Close after the owner checks on the phone |
| #3 Shadowform at 40 | F1: not gated | Keep open; approve a level-40 gate (code change) |
