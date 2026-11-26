# Documentation navigation

Status: incomplete catalog. This is navigation, not a completed source audit or a registry of implemented features.

Review recorded: 2026-11-24 and 2026-11-25. Initial catalog scope: `work/docs-release-guide` at `f78812b450b8d2f72f8cbf6cfc7411d95e1bfa6e`. Follow-up reading of OPEN-WORK.md, the layout and travel supplements and the UI review register: `main` at `204f22da1114e75f1723ab04ea9d562ace2f4f63`. Entry-screen documents: `main` at `2f4296dcf3fc3c3caf652d192f6aaeecfe873669`. Combat, progression and balance documents: `main` at `b8164d35f48ca2becdd02c73ec8e154cc38ba13d` and the branch `work/docs-index-combat` created from main. Recheck later changes; earlier coverage is not automatically revalidated.

## For AI reviewers

Start with [CLAUDE.md](../CLAUDE.md) (workflow and hard limits), then [AI handoff](AI-HANDOFF.md) (checkpoints, established relationships, unverified areas) and the [review map](REVIEW-MAP.md) (targeted source and test index). For combat, progression and balance also read the [progression and balance notes](PROGRESSION-BALANCE-NOTES.md). They supplement this catalog and do not replace the documents they cite.

## Reading order and document relationships

1. Start with [README](../README.md), then the [development guide](../DEVELOPMENT.md) for working and release boundaries.
2. Use [Reading the effective game source](reading-source.md) before tracing implementation. It covers source parts, ordered edits, core inlining, loader differences and build variants; it is not a complete subsystem map.
3. Use [Open work](OPEN-WORK.md) as the existing handoff and requirements register, not a new independent task list. Open means implementation reconciliation or acceptance remains, not necessarily that code is absent.
4. Read the relevant design document and its explicit corrections or supplements before interpreting an implementation.
5. Read review records for their exact revision and scope; then verify current source, tests and acceptance separately.

| Document role | Documents | Relationship and authority |
|---|---|---|
| General design | [Design](design.md) | Baseline decisions and historical status; read with explicit later corrections. |
| Layout correction | [Layout correction](design-layout-correction.md) | Explicitly takes precedence over the earlier placement of the service menu in design.md. Do not generalize this precedence to unrelated requirements. |
| Travel supplement | [World travel hint](design-world-travel.md) | Supplements design.md with hint conditions, accessibility and motion rules; not a replacement for the whole design. |
| Entry screen | [Entry screen](ENTRY-SCREEN.md), [polish](ENTRY-POLISH.md), [artwork](ENTRY-ARTWORK.md) | Artwork explicitly supersedes the earlier low-resolution artwork description; polish adds a later step. Preview-only wording in the entry screen document is historical: the release workflow packages the combined candidate. |
| Combat and progression | See the combat section below and the [notes](PROGRESSION-BALANCE-NOTES.md) | Dated decision records and addenda; the main decision record is the base, addenda state what they supplement or supersede. |
| Open-work register | [Open work](OPEN-WORK.md) | Consolidates requirements and remaining reconciliation; links supporting records rather than replacing them. Preserve older requirements until individually reconciled. |
| UI review evidence | [UI review register](ui-review-register.md), [saved CI record](validation/ui-redesign-ci.json) | Scoped historical evidence, not a new requirements authority or proof of current live behavior. |
| Build and source guidance | [Development](../DEVELOPMENT.md), [source reading](reading-source.md), [review map](REVIEW-MAP.md) | Explain where to inspect and how assembly and release work. Recheck current code and workflow before acting. |

Explicit corrections apply to the subjects they identify. Do not resolve other conflicts solely by filename, timestamp or the order of links here. Record the conflicting statements and reconcile them with explicit decisions and current implementation evidence.

## How to use this page

- Fully read means the document was retrieved and read in full during this review; it does not mean its claims were verified against current code.
- Located means the file or directory was listed, but its contents were not reviewed in full.
- Document status, implementation status, test results, and deployment status are separate.
- This index does not replace the linked documents or override their requirements.

## Combat and progression: read in full

All are dated 2026-11-21 design records or addenda unless stated. They record agreements, not implementation, passing tests, balance or publication.

| Document | Role | Key limits |
|---|---|---|
| [Combat decisions](combat-decisions-2026-11-21.md) | Base record: specialization at own level 15, six guaranteed base actives, separate seventh ability, kit changes, pets, damage event model, Soul Link adaptation, auras, interrupts, tests. | Not a full ability catalogue. Earlier six-ability and aura spreadsheets stay drafts unless settled here. Its Voidwalker level 9 is superseded by the pets record. |
| [Training roles and transition](combat-training-2026-11-21.md) | Addendum: basic training kits before 15, specialization opens at own level 15, no hidden future bonuses. | Does not choose per-class training abilities, role interface, values or migration. |
| [Passive unlock schedule](combat-passives-2026-11-21.md) | Addendum: passive schedule at levels 15 and 30. | No ranks, chances, durations or costs approved. Several adaptations remain unresolved. |
| [Interrupt timing and feedback](combat-interrupts-2026-11-21.md) | Addendum: warnings follow normal speed order; no guaranteed reaction window. | Exact timing, tie-breaking, channel rules and immunities remain open. |
| [Beast Mastery kit](combat-bm-2026-11-21.md) | Addendum: Multi-Shot as sixth base ability at 54; consolidated target kit. | Registry entry alone is not runtime use; AI integration and balance remain to verify. |
| [Pet progression and selection](combat-pets-2026-11-21.md) | Addendum: pet unlock schedule, per-owner selection and persistence. Supersedes Voidwalker level 9. | Detailed pet kits, recovery rules and numbers remain open. |
| [Arms hero integration gates](arms-integration-gates-2026-11-21.md) | Required corrections and verification before accepting the integrated hero preview. | Refers to an earlier implementation commit and a failed run whose log was not read there. Opus proposal is not an executable specification. |
| [Own-level specialization transition](spec15-transition-scope.md) | Records an opt-in preview patch at threshold 15. | Test-branch scope only; other seven classes' training kits are not finished. Browser and dungeon acceptance not established. |
| [Temporary Arms rules, cap 30](arms-stage1-temporary-rules.md) | Temporary integrated rules for the warrior in the test build. Governs integratedArms descriptors over the prototype. | Not level 60 progression, not accepted balance. Browser acceptance of the integrated hero page not established. |
| [Arms talent prototype](prototype-arms-2026-11-21.md) | Isolated flag-gated prototype and comparison baseline. | Several effects are explicit proposals; talent UI only in an isolated page. |

How they relate: combat-decisions is the base. Training roles, passive schedule, interrupts, Beast Mastery and pets are addenda to it. The integration gates, the transition scope and the stage 1 rules apply these decisions to the hero preview; the prototype is the earlier comparison baseline. Verify each statement against current code before treating it as implemented.

## Balance: read

| Document | Role | Key limits |
|---|---|---|
| [Enemy curve report](enemy-curve-2026-11-23.md) (Russian) | Describes a shared enemy-strength curve, parameters, simulation method and remaining failures. | Branch and PR statuses it cites are historical. Browser and manual checks were not done. Level-shift key issue left as an open decision. |
| [Enemy curve simulation table](enemy-curve-sim-2026-11-23.md) (Russian) | Full per-fight table of simulated win rates before and after. | Retrieved only partially: output was truncated within the ambush rows. Results are simulations on fixed seeds, not browser tests. |

## Other documents: read in full

| Topic | Document | Interpretation and limitations |
|---|---|---|
| Development and release | [Development guide](../DEVELOPMENT.md) | The release correction was merged through PR #27. Other sections contain earlier agreements and historical status that still require verification. |
| Open requirements | [Open work](OPEN-WORK.md) | Handoff and additive requirements register dated 2026-11-20. Its PR #7 release checkpoint is historical, not the current repository head. Open items require reconciliation, not automatic reimplementation. |
| Interface and dungeon design | [Design and implementation status](design.md) | Records decisions and status dated 2026-11-19; not confirmation of current live behavior. |
| Layout correction | [Layout correction](design-layout-correction.md) | Explicit correction to service-menu placement; also describes dungeon preparation and intermission layout. Its pending-acceptance label is historical and must be reconciled with later scoped evidence. |
| World travel | [Travel hint supplement](design-world-travel.md) | Defines when the existing world-map button is highlighted. Reports nine isolated Node cases, not complete browser or deployment acceptance. |
| UI review | [UI review register](ui-review-register.md) | Records scoped local browser checks and unresolved acceptance. Does not establish physical Android acceptance, a full dungeon run, or current deployment. |
| Entry screen | [Entry screen](ENTRY-SCREEN.md), [polish](ENTRY-POLISH.md), [artwork](ENTRY-ARTWORK.md) | Preview-era descriptions with later artwork supersession. Cropping, real devices and the local font were not accepted by these documents. |
| Quest catalog rules | [Quest catalog introduction](quests/README.md) | Read before individual locations. Contains corrections that withdraw some earlier adaptation proposals. Research is not implemented content. |
| Deadmines loot | [Loot document](loot/deadmines.md) | Describes working-branch integration and provisional item values. Current implementation, acceptance, and publication require separate verification. |
| Core extraction | [Core module contract](core-module-contract.md) | Implementation plan tied to an earlier inspected revision; not proof of a completed module system. |
| Modularization | [Modularization notes](modularization-notes.md) | Advice and risks, not approved or completed restructuring. Verify technical details against current sources. |
| Saved UI checks | [UI redesign CI record](validation/ui-redesign-ci.json) | Records checks for commit `82036a382323eaf08b2852d5ab69341891460eb3`. Its stated scope excludes physical Android and full dungeon-run acceptance. The referenced Actions run was not independently inspected in this review. |

## Historical status and reconciliation

- The layout correction's pending-acceptance statement and the UI register's later scoped checks must be read together. Neither establishes complete acceptance of the current game.
- OPEN-WORK.md says Opus materials had not been supplied or reviewed in that session. `opus-audit.txt` and a DOCX chat/ability archive are present in this directory. Presence does not establish reading, approval or reconciliation; their contents remain unreviewed in this catalog.
- The arms integration gates and the enemy curve report cite historical commits, branches and runs. Do not use them as current test results.
- Keep requirements, implementation evidence, executed checks and publication evidence distinct. Do not silently overwrite historical records with present-tense completion claims.

## Located, not yet reviewed

Do not infer approval, completeness or implementation from a file's presence. Absence from this list is not a recommendation to ignore or delete a file.

Documents in this directory:
- [Branding](BRANDING.md) and [chat audit](CHAT-AUDIT.md)
- [Computer talent tree task](computer-talent-tree-task.md)
- Archive materials: `opus-audit.txt` and the DOCX chat and ability archive

Quest locations (read the [quest catalog introduction](quests/README.md) first):
- [Wetlands](quests/wetlands.md), [Hillsbrad](quests/hillsbrad.md), [Tirisfal](quests/tirisfal.md)
- [Alterac](quests/alterac.md) — present in the directory but absent from the introductory location table at the reviewed revision.
- [Hillsbrad map prompt](quests/hillsbrad-map-prompt.md), [Tirisfal map prompt](quests/tirisfal-map-prompt.md)

Validation records (saved records, not evidence that the current revision passed checks):
- [Feedback UI source record](validation/feedback-ui-source.json)
- [Rarity source record](validation/rarity-source.json)
- [UI test preview record](validation/ui-test-preview.json)

## Remaining coverage

There is no completed system-to-source map. Next steps: read the remaining documents in thematic groups; record conflicts and superseding decisions; then build a source map backed by inspected implementation and callers. Do not move or delete source documents merely to tidy this index.
