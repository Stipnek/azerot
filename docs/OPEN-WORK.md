# Open work and design index

Updated: 2026-11-24. Source checkpoint: `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`; documentation work is on `docs/documentation-refresh`.

## Start here

Read [the documentation index](README.md), [development guide](../DEVELOPMENT.md), [design](design.md), [layout](design-layout-correction.md), [world travel](design-world-travel.md), [Deadmines loot](loot/deadmines.md), [chat audit](CHAT-AUDIT.md) and [UI review register](ui-review-register.md). This is a requirements and acceptance register, not a list of features proven absent. Explicit later user decisions take precedence; preserve older requirements until individually reconciled.

Repository and chat evidence were reviewed, not the complete effective game or live UI. Do not close a requirement based solely on a filename, passing aggregate CI or this document.

## Current integration checkpoint

- PR #21 merged as `2c2fc62`, including PR #20. The tested candidate head was `f8bc129`. Confirmed before merge: build, source-and-modules, combined-preview, safe-area, browser and the successful portrait rerun. This is scoped CI evidence, not complete gameplay or physical-phone acceptance.
- PR #11 was closed after its exact head `e2ae13a` was found in main history. No branch-only commits need extraction. This is not a claim that every historical file is unchanged.
- The inspected Pages workflow builds the combined source candidate and can publish automatically after a successful matching main push. Deployment of `2c2fc62` and current live sourceCommit are not confirmed in this record.
- Issue #22 covers entry-documentation reconciliation. Documentation commits do not themselves complete its acceptance or close it.
- This package does not individually re-audit the implementation of the requirement rows below. Their historical evidence is retained and must not be read as a new finding.

## Historical release evidence

PR #7 merged to main as 8bc983a07c114120ee28bb0f301105d31b71c5a0. Pre-merge CI passed all eight recorded stages for 0891a4918679aa84836a7452f9e3dd1321a604ad: https://github.com/Stipnek/azerot/actions/runs/44852529229 . This is a historical checkpoint, not the current main or live revision. Physical-phone acceptance and a complete dungeon run were not established by that CI.

## User requirements: preserve and reconcile

Items remain open for implementation reconciliation or acceptance; open does not mean absent. The evidence column below preserves the earlier review, not a fresh audit of every subsystem.

| ID | Requirement / acceptance | Historical evidence and next work |
| --- | --- | --- |
| PARTY-01 | Ordinary-party and dungeon preparation use one reusable companion picker, not divergent implementations. | User requirement. Trace both callers and shared details before changing either. |
| PARTY-02 | Remove the visible rarity/bonus line such as «Редкий · +…% к характеристикам» from picker cards; keep rarity color and accessible information. | The inspected party-quest-ui manifest adds az-picker-rarity and this line. Check all later edits before removing it. |
| PARTY-03 | Holding a hero opens the same details dialog as the collection; releasing after a hold must not also select the hero. | Implementation not confirmed. Verify touch/mouse, cancellation, scrolling and click suppression. Distinct from holding the party header for analytics. |
| PARTY-04 | Shared hero details show the accessory slot, including when composing a party. | Requirement, not confirmation that accessory mechanics or the slot exist. Reconcile with PROG-01. |
| GEAR-01 | Equip/unequip buttons follow the common game style; selecting armor must not make the screen jump. | Fullscreen slot-based equipment is in PR #7; this does not establish visual stability. Check repeated selections, long names, empty slots and phone layouts. |
| GEAR-02 | Item stats are vertical labelled rows everywhere: receipts, dungeon catalogue, bag and equipment. «При замене» is separate from the item's own stats. | Inventory comparison/layout patches exist. Coverage across all four surfaces and browser acceptance remain unverified. Do not redo already-correct comparison logic. |
| QUEST-01 | Within one location: ready-to-turn-in quests first; normal quests by level next; group quests in a separate bottom block by level. Stable order for equal levels. | Exact effective ordering not reconciled. Test state transitions and equal-level ties. |
| ART-02 | Slightly reduce the dungeon entrance icon and try a thin neutral border; preserve the approved artwork and orientation. | New adjustment, separate from the original entrance implementation. Border appearance needs visual approval. |
| DM-05 | Between-boss buttons have consistent height and spacing; long labels wrap without compressing controls. | A layout patch groups equipment and optional-boss actions, but grouping does not prove equal heights. User observed a compressed Cookie button before VanCleef. |
| DM-06 | Suggested short action: «Зайти к Куки», with separate explanation «Необязательный бой перед Ван Клифом». | Proposed wording, not verified implemented text. Preserve optional encounter rules and access timing. |
| AUDIO-01 | Separate Deadmines music; smooth transition on entry/exit; respect shared sound/volume settings; do not restart between bosses. | Implementation and audio-asset choice/rights not confirmed. Verify mute, volume, exit, defeat and browser audio behavior. |
| QUEST-02 | Preserve truthful «Источник и адаптация» information. | Earlier code inspection found a v56 section with adapted Classic, authored tutorial and service-stage variants, and a source link when provided. Exact quest coverage was not audited; never claim every quest has it. |

## Earlier agreements: preserve and reconcile

The detailed historical requirements and evidence are in docs/CHAT-AUDIT.md; do not treat old pending labels as evidence of current absence.

- UI-01 / DM-01 / DM-02 / LOOT-01: bottom service drawer, explicit dungeon preparation/start, readable dungeon flow, real boss loot, between-room equipment, truthful grant/save failures and duplicate-reward guards. Some source and browser coverage exist; check remaining acceptance individually.
- UI-02: World Map hint conditions, removal when no longer applicable and reduced motion.
- UI-03: Tavern summon-available indicator follows the real stone threshold and updates across balance/character/navigation changes.
- UI-04: movement follows drawn roads and avoids obstacles; inspect the central Duskwood mountain visually.
- UI-05: smooth summon/card-flip motion, cancellation/skip and reduced motion.
- UI-06: separate 2–3 second equipment-acquisition notice, visible timer, click opens bag; reconcile with existing receipts before adding another notification.
- UI-07: no unapproved first-companion replay/map button across all onboarding paths.
- UI-08: party analytics via hold, without a separate visible duplicate button; test touch/mouse cancellation.
- XP-01 / XP-02: every acquired roster member gets 100% base reward; eligible participating companions below main get 125% instead, not an additional 125%; own-level calculation, reserve, cap 60, multiple levels, new characters at level 1 without retroactive XP. Audit current code/tests; settle mid-award catch-up rule explicitly if still unresolved.
- PROG-01: repeatable dungeons support builds, main gear, companion accessories and roster XP; no additional endless mode required. Main-character loot alone does not deliver companion accessories.
- UPDATE-01: safe optional updates at startup/tab return/intervals, successful save before reload, no interruption of combat/summoning/rewards, offline failure does not block play. Reconcile existing code before rewriting.
- ABIL-01: approximately six active abilities per class/spec, gradual own-level unlocks; avoid one-ability play throughout the first location. Audit actual effects, AI, resources, basics, spec changes and saves before proposing sets/unlock order.
- ABIL-02: personal seventh ability at own level 60 for the eight named current legendaries; identity-based, not orange rarity alone. Effects require approval.
- ABIL-03: hero overview ability icons, grey locked slots, unlock levels, readable descriptions and execution guards.
- TALENT-01: historical direction: talents from level 10, free allocation preferred; spec selection is not a talent tree. Reconcile this earlier direction with later own-level-15 integration records before changing thresholds. Hybrids, roles, druid directions and kit interactions still require scoped design agreement; do not apply Arms decisions to every class automatically.
- LOC-01: future RU/EN preserving Russian and stable save keys. Pin the exact Classic branch and patch/date at kickoff; use official names for existing entities and translate original content separately.
- Stockade remains deferred. Mirrored entrance art is not authorization to implement it.

## Progression reconciliation notes

The earlier statement that seven other classes lack training describes an old transition patch, not the current source inventory. The branch contains the eight-class neutral-training registry and tests for 2/5/9 unlocks, plus autoSpec15 code that persists a roll for newly created integrated-mode heroes and assigns a class DD once at own level 15. See [transition scope](spec15-transition-scope.md). This does not settle the six-slot specialization catalogue, old-save compatibility, companion policy, balance or live acceptance. No new tests were executed for this documentation update.

## Opus material and proposal status

The old statement that Opus material had not been supplied was session-specific. The later [Arms integration gates](arms-integration-gates-2026-11-21.md) record an audit review. Do not infer that every archive or CSV has been fully reconciled. For each artifact record its revision and whether it is a proposal, source change or execution result. Classify confirmed bugs, balance questions, description/mechanics mismatches and unsupported assumptions separately; do not import proposed mechanics as approved decisions.

## Working and acceptance rules

1. For each item record: agreed; source reconciled/written; targeted tests; CI; deployed revision; browser/user acceptance. Include revision/evidence and failures or skips.
2. Confirm the release checkpoint and relevant audit evidence before prioritizing implementation with the user. This register does not authorize gameplay changes.
3. Keep approved art, stable save keys and reusable components. Back up saves before migration tests.
4. Update this register and the relevant design document when decisions or status change. Do not scatter a new independent task list into every chat.
5. External writes, merges and publication require exact-action confirmation. Documentation-only changes do not match the inspected Pages source-path filters.
6. No background execution or CI monitoring is implied between chat turns. In a new chat, read the documentation index and this register first.
