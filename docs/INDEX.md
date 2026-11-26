# Documentation index

The single catalogue of project documentation. Updated 2026-11-26 against main `50bd6ab` plus the documentation branch `claude/nifty-fermat-oci73c`. Every file listed was read in full on that date (see [review ledger](REVIEW-LEDGER.md)); "read" does not mean its claims were verified against code.

## Start here

| Need | Read |
|---|---|
| What the project is, legal status | [README](../README.md) |
| How we work: branches, PRs, checks, release, AI helpers | [Workflow](WORKFLOW.md) |
| Build, source layout, release pipeline | [Development guide](../DEVELOPMENT.md), [reading the effective source](reading-source.md) |
| What is decided and what is still open | [Open work](OPEN-WORK.md), the single requirements register |
| Where code and tests live | [Review map](REVIEW-MAP.md) |
| Review coverage and findings | [Review ledger](REVIEW-LEDGER.md) |
| AI assistant rules | [CLAUDE.md](../CLAUDE.md), [AI handoff](AI-HANDOFF.md) |

## Status vocabulary

Keep these separate in every document: **proposed** → **approved design** → **implemented** at a revision → **tested** (with scope) → **merged** → **released** (deployed revision) → **accepted** by the owner in play. A passing check or a merged PR proves only its own step.

Release fact (2026-11-26): the Pages workflow publishes `preview/combined.html`, which always includes the entry screen and the integrated hero mode (`__AZEROT_ARMS_HERO__=true`). Older documents that call these "preview only", "test only" or "not published" describe their own date; the owner is currently the only player.

## Current design and decision documents

| Area | Document | Role | Notes |
|---|---|---|---|
| Interface, dungeon | [design.md](design.md) | Approved baseline (2026-11-19) | Service-menu placement superseded by the layout correction. |
| Interface | [design-layout-correction.md](design-layout-correction.md) | Approved correction | Takes precedence over design.md for the service menu and dungeon layout. Button label in code is «Город»; final label open (OPEN-WORK UI-09). |
| Interface | [design-world-travel.md](design-world-travel.md) | Approved supplement | World-map hint rules; browser acceptance open. |
| Entry screen | [ENTRY-SCREEN.md](ENTRY-SCREEN.md), [ENTRY-ARTWORK.md](ENTRY-ARTWORK.md), [ENTRY-POLISH.md](ENTRY-POLISH.md) | Implemented, released | ARTWORK supersedes the art description in SCREEN. Open items in OPEN-WORK ENTRY-01. |
| Branding | [BRANDING.md](BRANDING.md) | Approved decision | Pocket Azeroth; keep repo name, save keys, identifiers. |
| Loot | [loot/deadmines.md](loot/deadmines.md) | Approved spec, implemented | On main since PR #2. |
| Combat (base) | [combat-decisions-2026-11-21.md](combat-decisions-2026-11-21.md) | Approved design | Voidwalker level superseded by pets addendum. |
| Combat addenda | [training](combat-training-2026-11-21.md), [passives](combat-passives-2026-11-21.md), [interrupts](combat-interrupts-2026-11-21.md), [Beast Mastery](combat-bm-2026-11-21.md), [pets](combat-pets-2026-11-21.md) | Approved addenda | Each states what it supplements or supersedes. Pet schedule appears unimplemented (to verify). |
| Warrior Arms | [arms-stage1-temporary-rules.md](arms-stage1-temporary-rules.md) | Owner-accepted temporary rules (cap 30) | Supersedes the archived prototype for integrated Arms. |
| Warrior Arms | [arms-integration-gates-2026-11-21.md](arms-integration-gates-2026-11-21.md), [spec15-transition-scope.md](spec15-transition-scope.md) | Acceptance gates, scope | Integrated mode is now released; their open checks are in OPEN-WORK. |
| Talent tree UI | [computer-talent-tree-task.md](computer-talent-tree-task.md) | Task brief with owner feedback | "No scrolling" requirement vs merged internal-scroll dialog is open (TALENT-02). |
| Balance | [enemy-curve-2026-11-23.md](enemy-curve-2026-11-23.md) | Implemented report | Owner decisions open (BAL-01…03). |
| Progression summary | [PROGRESSION-BALANCE-NOTES.md](PROGRESSION-BALANCE-NOTES.md) | Reading notes | Precedence chains between combat documents. |
| Architecture | [core-module-contract.md](core-module-contract.md), [modularization-notes.md](modularization-notes.md) | Plan, advice | Two core modules already exist in `src/core/`. |
| Quests | [quests/README.md](quests/README.md) first, then [ZONE-TEMPLATE](quests/ZONE-TEMPLATE.md), [audit](quests/quest-audit-2026-11-24.md), zones: [Wetlands](quests/wetlands.md) + [cards](quests/wetlands-cards.md), [Hillsbrad](quests/hillsbrad.md), [Tirisfal](quests/tirisfal.md), [Alterac](quests/alterac.md), [Silverpine](quests/silverpine.md); art prompts: [Hillsbrad](quests/hillsbrad-map-prompt.md), [Tirisfal](quests/tirisfal-map-prompt.md) | Research and templates | Nothing from these zones is implemented except the pre-existing Wetlands Lightforge chain. The audit corrects tirisfal.md (quests 367, 358). |

## Archive

[docs/archive/](archive/) keeps historical evidence. It is not a source of current requirements; anything still open from it is listed in OPEN-WORK.

| Document | What it is |
|---|---|
| [CHAT-AUDIT.md](archive/CHAT-AUDIT.md) | Requirements audit at 2026-11-19; carried into OPEN-WORK. |
| [ui-review-register.md](archive/ui-review-register.md) | UI review gate register (2026-11-20) with scoped browser evidence. |
| [prototype-arms-2026-11-21.md](archive/prototype-arms-2026-11-21.md) | Isolated Arms talent prototype; superseded by stage-1 rules. |
| [enemy-curve-sim-2026-11-23.md](archive/enemy-curve-sim-2026-11-23.md) | Simulation table for the enemy-curve report (historical numbers). |
| [opus-audit.txt](archive/opus-audit.txt) and the DOCX with the same text | Opus chat and ability audit (2026-11-20); table C is a proposal. Unverified findings are in OPEN-WORK AUDIT-01. |
| [validation/](archive/validation/) | Saved CI and source-inspection records for specific old commits. |

Git history keeps everything that was deleted in the 2026-11-26 cleanup (root QA packages, prototype patch/bundle, dev-readback, retired workflows); see the review ledger for the list.
