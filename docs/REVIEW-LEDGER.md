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
