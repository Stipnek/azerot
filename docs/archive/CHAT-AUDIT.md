# Chat commitments: audit and open work

Audit date: 2026-11-19, user-local date. Repository checkpoint: main at 74bbe070c61c75313b219f6235d1662edd463630. Documentation-only audit; no gameplay fix, merge, test execution or publication is performed by this change.

## Scope and evidence limits
This register reconciles the accessible conversation, its earlier-conversation summary, DEVELOPMENT.md, all four current design/loot documents, recent main history and the current Pages workflow. Omitted earlier messages cannot be reconstructed verbatim. Earlier agreements below are attributed to DEVELOPMENT.md, not invented as new user instructions. This is not an exhaustive runtime/code audit.

A repository commit proves a write, not passing tests, correct UX or live publication. Unverified is not synonymous with absent. No open item below is closed solely because this register exists.

## Confirmed repository work, acceptance still open
| ID | Agreement and source | Repository evidence | Remaining acceptance |
|---|---|---|---|
| UI-01 | One service button immediately LEFT of Hero in bottom navigation; drawer expands upward; recover quest-panel space. Chat, DEVELOPMENT.md, design-layout-correction.md. | Initial grouping 2dd75ad; placement correction 74bbe07. | Verify exact ordering, upward motion, mobile/wide layouts, no service row above quests, all original actions, Escape, focus restoration and repeated rendering without duplicates. Earlier grouping alone did not satisfy placement. |
| UI-02 | Existing World Map button pulses when an active quest step is elsewhere, or no actionable local quests remain but another implemented zone has them. Chat, design-world-travel.md. | 7a86dad; isolated nine-case logic run reported in this conversation. | Browser checks using actual quest visibility, pickup/completion/turn-in, cooldowns, character/zone changes and viewed versus physical zone. Verify pulse removal and reduced motion. Isolated tests do not prove integration. |
| ART-01 | Use the approved stone-and-wood, slightly collapsed entrance with cobweb and torch; transparent background; usable on dark forests and city/light maps; Deadmines faces left, future Stockade right by mirroring. Chat, design.md. | Asset 1eefd8e; source hookup 553ef96. | Confirm actual decoding, alpha/edge quality, size, readability and left orientation in browser; check dark/light backgrounds and mirrored preview without implementing Stockade. Asset is a 96-pixel raster inside SVG, not resolution-independent vector art. Rejected earlier concepts must not replace the approved image. |
| DM-01 | Map entrance opens preparation, not immediate battle; no separate service dungeon-start button. Chat, design.md. | Existing lobby hotfix 1b1d55a and later UI patches. | Verify removal of old entry, map click, party selection, closing without a fight and explicit start. |
| DM-02 | Friendly dungeon UI: understandable preparation and between-boss choices, not an unstructured text wall. Chat, design-layout-correction.md. | 74bbe07 adds four preparation sections and clearer intermission actions. | Full visual/user-flow review still required. Four tabs and new labels are only a first implementation, not proof that the broader request for a polished UI is satisfied. Verify result/defeat/completion screens, small-screen overflow, bag access, optional boss and recovery feedback. These are review checkpoints, not approval for new mechanics. |
| LOOT-01 | Small separate boss pools; actual item goes to bag with stats; equip before next boss; same victory cannot award twice. Earlier summary, chat, loot/deadmines.md. | a131e91 and related source edits; authored test stats, not an exact Classic database. | End-to-end boss reward, visible stats/comparison, equip eligibility, save/load, repeated settlement, fresh-run duplicates, optional Cookie and failed-save feedback. Recheck truthful UI messaging when an item grant fails; intermission wording must not claim success unconditionally. |
| RELEASE-01 | Enable automatic tested publication before the icon replacement. Chat. | 78f7240; current pages.yml builds src, packages the tested build and gates deploy on build success. | Actual Actions results and live sourceCommit remain unknown. Verify source/build/live identity and browser behavior before reporting a release. |

## Earlier documented agreements not reconciled to current runtime
These items were already recorded in DEVELOPMENT.md. They were missing from the later short design documents, not from the repository as a whole. Their older pending labels are not reliable proof that implementation is still absent. Keep them open until source/tests are reconciled.

| ID | Preserved agreement | Next evidence required |
|---|---|---|
| UI-03 | Tavern notification dot when stones cover a summon. | Availability threshold, balance changes, initial load and return to map. |
| UI-04 | Follow drawn roads and avoid obstacles; inspect central Duskwood mountain crossing. | Actual route overlay and traversal against artwork, not only pathfinding code. |
| UI-05 | Smooth card flips; Hearthstone is a motion reference. | Summon animation, skip interaction and reduced-motion review. |
| UI-06 | Separate equipment-acquisition notice for 2-3 seconds with a timer; click opens inventory. | Actual notification, timing, click, repeated rewards and interaction with combat. |
| UI-07 | Remove the unapproved Show first companion map/replay button. | Current patched UI and all creation paths; no assumption based only on old source text. |
| UI-08 | Party statistics through hold interaction; remove added separate button. | Mouse/touch hold, cancellation and absence of duplicate button. |
| XP-01 | Every already acquired roster character receives 100% base quest/dungeon XP; eligible fighting companions below main receive 125% instead, not an extra 125%; reserve rewards are not divided by roster size. | Reconcile implementation and targeted tests with own-level calculation and duplicate-reward guards. |
| XP-02 | Main cap/low-level quest must not suppress roster XP; own XP/level per recipient, multiple level gains, cap 60; newly acquired character starts at level 1 without retroactive rewards. | Cap, catch-up, reserve, save/load and new-character cases. Mid-award catch-up handling requires an explicit recorded decision. |
| PROG-01 | Repeatable dungeons support post-campaign builds, main gear, a party-character accessory and roster XP; no extra endless mode is required. | Distinguish the current Deadmines main-character loot patch from the broader progression goal. Companion accessories are explicitly outside that loot patch, not delivered by it. |
| UPDATE-01 | Soft version checks at startup, tab return and periodically; notify without interrupting combat, summons or reward delivery. User chooses a safe update; save successfully first; save failure prevents reload; offline failures do not block play. | Current implementation and runtime/save compatibility tests. version.json alone is insufficient. |
| ABIL-01 | Approximately six main abilities per class/spec, gradual unlock over 60 levels; full set by 50 allowed but no exact schedule approved; first location must not remain one-ability play; companions use own levels. | Audit real kits, effects, AI, resources, basics, spec changes and saves; obtain approval of proposed sets/order before changing progression. |
| ABIL-02 | Eight current named legendaries are the starting roster for personal seventh abilities at their own level 60; identity matters, not orange rarity alone. | Character-specific proposals and approval. Suggested lore effects are not final approved mechanics. |
| ABIL-03 | Hero overview shows ability icon slots, locked greyed-out icons, unlock level and readable descriptions; locked abilities cannot be used. | UI and actual execution guards. |
| TALENT-01 | Talents from level 10; free tree allocation is preferred. Spec selector is not a talent tree. Hybrid roles, ability interactions and druid directions need agreement. | Design gate; do not silently implement full-kit replacement based on majority points. |
| LOC-01 | Future RU/EN selection, preserving Russian. Pin exact WoW Classic product branch and latest patch number/date at localization kickoff; official entity names from that reference, original content translated separately; stable save keys. | Future scoped design/reference task, not a completed translation or an instruction to change mechanics now. |

## Documentation corrections and precedence
1. DEVELOPMENT.md is an existing substantial design/requirements source. The earlier assistant statement that only a loot document existed was incorrect because it considered docs/ but missed this root file.
2. For bottom-menu placement, docs/design-layout-correction.md and the explicit user requirement take precedence over the older vague grouping description in docs/design.md.
3. DEVELOPMENT.md's Production boundary describes an older root-part publication path. Current pages.yml builds src and publishes the tested source artifact. Source/scripts/index/workflow pushes on main trigger this workflow; documentation-only changes do not. Its existence still does not prove deployment success.
4. A historical PR #2 merge exists at 01ed5fb1f32349b18745911c35a605871fc3e637. Do not say no merge ever happened or request the same merge again. The earlier summary's defer-merge instruction is historical context; this audit authorizes no new merge.
5. Keep technical documentation in English as DEVELOPMENT.md requests. Existing Russian design records remain preserved; no translation of those records is claimed here.
6. Earlier dfc5798 test results and a skipped integrity check in the supplied summary are historical, not test results for the current main revision.

## Unclosed acceptance and engineering work
- Obtain actual Actions run/job/log evidence for the relevant source revision and compare with live version.json. This conversation's read attempts failed; never substitute commit existence for a green build.
- Execute and record browser checks for the final combined menu, map hint, icon and dungeon patches on mobile and wide screens. Existing static tests and isolated mocked logic are not equivalent.
- Review service-menu lifecycle after rerender/zone changes: persistent navigation toggle must open the current dialog, not a removed instance. Check enabled/disabled state and focus after original service handlers run.
- Review dungeon error states: grant/save failures, inventory limits, optional boss, defeat and exit. Readable headings must not hide warnings or falsely report received loot.
- Reconcile each earlier documented item above against the current patched source and targeted tests before deciding whether it needs coding or only acceptance. No blanket claim that all earlier work was absent or completed.
- Keep Stockade implementation deferred. Its mirrored entrance requirement is a reusable asset/design constraint, not permission to implement the dungeon today.

## Reporting rule
Track each item separately as: agreed; source written; targeted tests run; CI confirmed; published revision confirmed; browser acceptance confirmed. Record failures/skips and evidence with the revision. No background work or Actions monitoring is implied between messages.
