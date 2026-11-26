# Open work register

The single list of requirements, open decisions and pending acceptance. Updated 2026-11-26 (main `50bd6ab`). Design detail lives in the linked documents; this register records what is wanted and where each item stands. It replaces the 2026-11-20 and 2026-11-24 versions and the requirement sections formerly in DEVELOPMENT.md; all earlier IDs are preserved.

## How to read and update

Status values: **Decision** (owner must decide) · **Approved** (agreed, implementation not confirmed) · **Partial** (some code exists, acceptance missing) · **Verify** (code reportedly exists; check effective source and play) · **Done** (implemented, tested and accepted by the owner, with revision).

Rules:
1. Open does not mean absent. Before implementing, trace the effective source (base + ordered edits + core) and existing tests.
2. Close an item only with evidence: revision, tests run, release revision and owner acceptance in play.
3. Change this file when a decision or status changes. Do not start a separate task list elsewhere.
4. One item → one branch → one PR (see [WORKFLOW.md](WORKFLOW.md)).

## Now (agreed priorities)

| ID | Item | Status |
|---|---|---|
| BAL-04 | Early quests are hard in real play without the temporary easing, while the simulator (`scripts/sim_enemy_curve.cjs`) reports ≥95% wins for every class up to level 14. Find where the simulator diverges from the real game path (party, carried HP, ambushes, gear, abilities granted before 15, release build vs engine loader), then tune balance from correct numbers. Day-2 finding ([evidence](evidence/bal-04/README.md)): the simulator puts the hero at the quest's level, but quests have no level gate and full-clear XP leaves the hero 1–3 levels below (own level 12 after all quests up to 14); at real levels Westfall 12–14 fights drop to 0–60%. Goal quests also spawn up to 3 enemies vs 1 in the simulator. Next: owner picks the lever (XP, level gates, encounter levels); simulator to follow the campaign path. | Cause found, decision |
| LOAD-01 | Loading screen: artwork immediately, real download progress, entry buttons when ready (PR #28). Audit list in the PR: audio handoff, autoplay denial, saved settings, fullscreen/safe-area, focus, retry/timeout, saves. Decide whether music can start before the first tap (browser autoplay rules). | Partial (PR #28) |
| QUEST-03 | Elwynn: Eagan dialogue pilot and Raelen quest wood in inventory (PR #26). Wood collection timer, attacks while collecting, hand-in not yet implemented. Bag rendering not browser-tested. | Partial (PR #26) |

## Balance and progression

| ID | Requirement | Status / next step |
|---|---|---|
| BAL-01 | Enemy curve (ENEMY_CURVE full 15, hp 0.45, atk 0.40, pow 2) — decide whether to raise the middle of the curve. [Report](enemy-curve-2026-11-23.md) | Decision |
| BAL-02 | Early Elwynn level shift: five keys are misspelled (`koboldcamp`, `echoscout`, `echoraid`, `golddust`, `lostguards` vs `kobold_camp`, `echo_scout`, `echo_raid`, `gold_dust`, `lost_guards`) so the shift does not apply to them. Decide keep-and-fix or replace with a proper solution under BAL-04. | Decision (simulated impact: none) |
| BAL-03 | Weak solo cases in the report: fire/arcane mage solo at 15–17, one level-24 fight, three-murloc ambush at level 1 (mage 43% simulated on 2026-11-26). | Verify |
| XP-01 | Every acquired roster member gets 100% of the base quest/dungeon XP; rewards are not divided by roster size; main's cap or low-level quest must not suppress roster rewards; each recipient uses own level. | Verify (code has rosterPct 1) |
| XP-02 | A participating companion below the main's level gets 125% instead of 100% (not additional); caught-up companions get 100%. Support multiple level gains per reward, cap 60; new characters start at 1 with no retroactive XP. Settle the mid-award catch-up rule explicitly. Tests: level-60 main with level-1 companion, reserve, catch-up, multi-level, cap, save/load, duplicate processing. | Verify / Decision (catch-up rule) |
| PROG-01 | Repeatable dungeons give post-campaign progression: builds, main gear, an accessory for each party character, roster XP; no endless mode. Main-character loot alone does not satisfy companion accessories. Guard room/completion/skip rewards against duplicates. | Partial |
| ABIL-01 | About six active abilities per class/spec, unlocked by own level over 60 levels (full set by 50 allowed); the first location must not be played with one ability. Companions unlock by own level. Audit effects, AI, resources, basics, spec changes, saves before proposing sets. Approved base rules: [combat decisions](combat-decisions-2026-11-21.md) and addenda. | Partial |
| ABIL-02 | Personal seventh ability at own level 60 for the eight named legendaries; identity-based, not rarity-based. Effects need approval. | Approved (effects: Decision) |
| ABIL-03 | Hero overview: ability icon slots incl. greyed locked abilities with unlock level and readable description; locked abilities unusable. | Verify |
| SPEC-01 | Specialization at own level 15 with neutral training before 15; replaced training abilities leave the rotation; same rules for main and companions ([training](combat-training-2026-11-21.md), [scope](spec15-transition-scope.md)). Training kits for the seven non-warrior classes still need approval. | Partial |
| SPEC-02 | Passive schedule: primary at own level 15, secondary at 30 for listed specs ([passives](combat-passives-2026-11-21.md)). No numbers approved. | Approved |
| PET-01 | Warlock: Imp 1, Voidwalker 10, Succubus 20, Felhunter 30. Hunter: Turtle 10, Cat 20, Wolf 30, Owl 40. Per-pet state, no switching in combat, no taming/feeding ([pets](combat-pets-2026-11-21.md)). Code shows a single PET_SELECTION_LEVEL = 10. | Approved, likely not implemented |
| COMBAT-01 | Beast Mastery kit (Multi-Shot sixth at 54), Soul Link at 40, paladin seals, event model (types, schools, DoT/HoT no crit), interrupt policy ([decisions](combat-decisions-2026-11-21.md), [BM](combat-bm-2026-11-21.md), [interrupts](combat-interrupts-2026-11-21.md)). | Approved, implementation to verify |
| ARMS-01 | Integrated Arms (stage-1 temporary rules, cap 30): verify 14/15 and 29/30 transitions, no seventh active for ordinary companions, consistent views ([gates](arms-integration-gates-2026-11-21.md), [rules](arms-stage1-temporary-rules.md)). Released to the live game. | Verify |
| ARMS-02 | Arms hero UX blockers from the 2026-11-21 QA: dialog closes after each rank change, talent names not visible, stale «Ветка талантов появится позже», debug wording visible to players. Strings still in sources. | Verify |
| TALENT-01 | Talents: earlier direction "from level 10, free allocation" vs integrated own-level-15 records. Hybrids, roles, druid directions, kit interactions need scoped agreement; do not generalize Arms decisions to all classes. | Decision |
| TALENT-02 | Talent tree must fit without page or tree scrolling, controls visible ([task](computer-talent-tree-task.md)); merged PR #17 uses an internally scrolling dialog. | Decision / Verify |
| AUDIT-01 | Unverified Opus audit risks on current main: Subtlety stealth without Ambush makes no moves; Whirlwind/Cleave AI branches end the turn; createBattle falls back to quest level; Protection/Holy paladin solo strength; mid-dungeon unlocks; racial abilities on companions. ([archive](archive/opus-audit.txt)) | Verify |

## Party, gear and quests

| ID | Requirement | Status / next step |
|---|---|---|
| PARTY-01 | Ordinary party and dungeon preparation use one reusable companion picker. | Verify |
| PARTY-02 | Remove the visible rarity/bonus line («Редкий · +…% к характеристикам») from picker cards; keep rarity colour and accessible info. The party-quest-ui manifest adds `az-picker-rarity`. | Approved |
| PARTY-03 | Holding a hero opens the same details dialog as the collection; releasing after a hold must not also select. | Verify |
| PARTY-04 | Shared hero details show the accessory slot, including during party composition (with PROG-01). | Approved |
| GEAR-01 | Equip/unequip buttons in the common style; selecting armour must not make the screen jump. | Verify |
| GEAR-02 | Item stats as vertical labelled rows everywhere (receipts, dungeon catalogue, bag, equipment); «При замене» separate from own stats. | Partial |
| QUEST-01 | Per location: ready-to-turn-in first, then normal quests by level, group quests in a separate bottom block by level; stable order for ties. | Verify |
| QUEST-02 | Keep truthful «Источник и адаптация» information; never claim every quest has it. | Partial |
| QUEST-04 | Zone content pipeline: Wetlands, Hillsbrad, Alterac, Tirisfal, Silverpine research → [ZONE-TEMPLATE](quests/ZONE-TEMPLATE.md) cards → owner approval → implementation. Faction scope (Alliance only vs both) needs a decision. | Decision |

## Interface and dungeon

| ID | Requirement | Status / next step |
|---|---|---|
| UI-01 | Bottom service drawer next to «Герой», opening upward; one menu for tavern, merchant, catalogue. Lifecycle: toggle opens the current dialog after re-render or zone change with correct focus. Physical Android check pending. | Partial |
| UI-02 | World-map hint conditions, removal when no longer applicable, reduced motion ([travel](design-world-travel.md)). | Partial |
| UI-03 | Tavern summon-available dot follows the real stone threshold and updates on balance/character/navigation changes. | Verify |
| UI-04 | Movement follows drawn roads and avoids obstacles; inspect the central Duskwood mountain crossing. | Approved |
| UI-05 | Smooth summon/card-flip motion (Hearthstone as reference), skip and reduced motion. | Approved |
| UI-06 | Separate 2–3 s equipment-acquisition notice with visible timer; click opens bag; reconcile with existing receipts. | Approved |
| UI-07 | No unapproved first-companion replay/map button on any onboarding path. | Verify |
| UI-08 | Party analytics via hold on the party header, no separate visible button; touch/mouse cancellation. | Verify |
| UI-09 | Final service-button label: «Город» (current code), «Меню», «Услуги» or «Сервисы». | Decision |
| SYS-01 | Coherent UI system: spacing, action priority, distinction beyond colour, typography, dialog rules. | Approved |
| ART-01 | Dungeon entrance art acceptance on dark and light map backgrounds, alpha/edges, mirrored preview. | Verify |
| ART-02 | Slightly smaller dungeon entrance icon, try a thin neutral border; keep approved art and orientation. | Approved |
| DM-01…03 / LOOT-01 | Explicit dungeon preparation and start, readable flow, real boss loot to the bag, between-room equipment, truthful grant/save failures, duplicate-reward guards; owned/equipped item-card branches not browser-tested. | Partial |
| DM-04 | Separate result, defeat and completion screens; distinguish actual reward from inventory/save errors. | Partial |
| DM-05 | Between-boss buttons of equal height and spacing; long labels wrap (compressed Cookie button seen before VanCleef). | Approved |
| DM-06 | Short action «Зайти к Куки» with explanation «Необязательный бой перед Ван Клифом». | Decision (wording) |
| AUDIO-01 | Separate Deadmines music, smooth entry/exit transitions, shared sound settings, no restart between bosses. Asset choice/rights open. | Approved |
| ENTRY-01 | Entry screen: locally bundled font, safe-zone composition, background seams/borders, Safari and real-device check. | Partial |
| STOCK-01 | Stockade stays deferred; mirrored entrance art does not authorize it. | Deferred |

## Platform and release

| ID | Requirement | Status / next step |
|---|---|---|
| UPDATE-01 | Check `version.json` on start, on tab return and periodically; notify about a newer build; never force reload or interrupt combat, summoning or reward delivery; save successfully before reload, otherwise show an error and stay; offline failures never block play; verify save compatibility. | Verify |
| RELEASE-01 | Record source commit, build hash and live `sourceCommit` for every release (version.json exists in the package). | Partial |
| LOC-01 | Future RU/EN: keep Russian and save keys; at kickoff pin the exact WoW Classic branch and patch/date; official names for existing entities; original content translated separately, never presented as Blizzard text. | Approved (not started) |
| LEGAL-01 | Fan-project notice in README; no licence for third-party material; replace or remove on a rights holder's request. Coin PNGs are fetched at build time without a vendored copy. | Done (notice) / Verify (coins) |
| ARCH-01 | Core extraction: two modules exist (`src/core/ability-progression.js`, `src/core/world-maps.js`); acceptance gates (browser checks, old saves) and a source map are still to do ([contract](core-module-contract.md), [notes](modularization-notes.md)). | Partial |
| REPO-01 | Repository hygiene: dormant workflows retired, root junk removed, build outputs untracked (2026-11-26). Remaining decisions: root `game-1.txt`/`game-2.txt` (CSS round-trip baseline), `classic-original-art-*` (Blizzard textures, kept for now), old branches. | Partial |
