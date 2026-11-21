# Open work and design index

Updated: 2026-11-20 (user-local date).

## Start here

This is the current handoff index and additive requirements register, not proof that every listed feature is absent. Read DEVELOPMENT.md, docs/design.md, docs/design-layout-correction.md, docs/design-world-travel.md, docs/loot/deadmines.md, docs/CHAT-AUDIT.md and docs/ui-review-register.md as supporting records. These documents already exist; the project did not lack design documentation. Several historical status and production statements are stale. Explicit later user decisions take precedence; preserve older requirements until individually reconciled.

Repository and chat evidence were reviewed, not the complete effective game or live UI. Statuses below deliberately distinguish source implementation from acceptance. Do not close a requirement based solely on a filename, passing aggregate CI or this document.

## Release checkpoint

PR #7 merged to main as 8bc983a07c114120ee28bb0f301105d31b71c5a0. Pre-merge CI passed all eight recorded stages for 0891a4918679aa84836a7452f9e3dd1321a604ad: https://github.com/Stipnek/azerot/actions/runs/44852529229 . Successful post-merge deployment and live sourceCommit remain unverified in this handoff. Confirm them separately. Physical-phone acceptance and a complete dungeon run were not established by that CI.

## Latest user requirements

All items remain open for implementation reconciliation or acceptance; open does not mean absent.

| ID | Requirement / acceptance | Current evidence and next work |
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
- TALENT-01: talents from level 10, free allocation preferred; spec selection is not a talent tree. Hybrids, roles, druid directions and kit interactions need design agreement.
- LOC-01: future RU/EN preserving Russian and stable save keys. Pin the exact Classic branch and patch/date at kickoff; use official names for existing entities and translate original content separately.
- Stockade remains deferred. Mirrored entrance art is not authorization to implement it.

## Pending Opus material

The user has an earlier Opus chat archive and ability audit. They have not been supplied or reviewed in this session. On receipt: distinguish proposals from actual commits, compare with current main, classify confirmed bugs / balance questions / description-mechanics mismatches / unsupported assumptions. Do not import proposed mechanics as approved decisions.

## Working and acceptance rules

1. For each item record: agreed; source reconciled/written; targeted tests; CI; deployed revision; browser/user acceptance. Include revision/evidence and failures or skips.
2. First confirm the release checkpoint, then review the Opus materials, then prioritize implementation with the user. This is a proposed work order, not authorization to change gameplay.
3. Keep approved art, stable save keys and reusable components. Back up saves before migration tests.
4. Update this index and the relevant design document when decisions or status change. Do not scatter a new independent task list into every chat.
5. External writes, merges and publication require exact-action confirmation. Documentation-only changes do not trigger the currently inspected Pages source-path filters.
6. No background execution or CI monitoring is implied between chat turns. In a new chat, read this file and the linked documents first.
