# BAL-05 / BAL-06 evidence (2026-11-27)

Base: main `c56bd95`. Owner decisions 2026-11-27 (OPEN-WORK): BAL-05 the solo rule (one enemy easy, two same-level ≈ half HP without gear, three need gear or levels) at every level; BAL-06 group quests practically impossible with two heroes unless the companion is a strong epic/legendary and the main is levelled and geared, normal with three at the quest level.

Tool: `node scripts/sim_campaign.cjs 30` (engine via `lib_engine_load.cjs`, N = 30 seeds per class, seeds `s*7919+13`). Files:

| File | What |
|---|---|
| [sim-before-2026-11-27.md](sim-before-2026-11-27.md) | main `c56bd95` with its own simulator (feel 1–14, campaign) |
| [feel-before-2026-11-27.md](feel-before-2026-11-27.md) | new simulator, BAL-05 points off: levels 15–60 as on main |
| [group-before-2026-11-27.md](group-before-2026-11-27.md) | new simulator, BAL-06 curve off: group quests as on main |
| [sim-after-2026-11-27.md](sim-after-2026-11-27.md) | this change, all three sections |

## Change

Engine `src/scripts/script-05.zzzzzzzzz-bal05-06-curves.edits.json`, interface `src/scripts/script-06.~~bal05-06.edits.json`.

1. **BAL-05.** `SOLO_ENEMY_CURVE.high` continues the solo multipliers from level 15: HP 1.0, attack 1.3 at 15 → 1.5 at 17 → 1.75 from 20 (linear between points, flat after). The two-enemy cap of solo fights (static solo encounters and goal fights) now applies at every level; before, level-15 quests such as rr_assess, rr_goulash, rr_tools, rr_poach spawned three. Road ambushes were already capped.
2. **BAL-06.** Each group quest (size 3 or 5, not dungeons, not the training ground) gets a **power budget**. Before, the base strength of group-quest enemies differed ~90× (three 430-HP skeletons in Duskwood vs a boss with guards in Elwynn), so one level curve could not fit. Budget = damage the pack deals while it is killed one by one, weakest first (Σ atk_i × HP of enemies 1..i); a lone enemy counts ×0.8 (the whole party hits it). HP and attack are scaled by the same factor so the budget equals `target` (1.3 M base units, same for size 3 and 5), clamped to [0.75, 12]. On top: a level correction (2.7 at 1–6 falling to 1.1 from 16, because the general enemy curve halves early enemies and early kits are thin) and a per-quest correction `tune` (0.84–1.18, Hogger 0.64) found by `sim_campaign.cjs --calibrate`: three heroes of the quest level (main + prot warrior + holy priest, no gear) win the hardest full fight of the quest about 9 times in 10. Goal quests: the fight's average enemy × `packSize` (size of a full goal fight, set by `prepareQuestEnemies`), so the last, smaller goal fight is weaker, not scaled up.
3. `GROUP_ENEMY_CURVE.enabled = false` restores the old group fights; `SOLO_ENEMY_CURVE.high = [[15,1,1]]` the old 15+ solo fights.

## Result (N = 30)

**Solo, two same-level enemies, HP lost (avg of 8 classes):** before 14–47% at 15–60 (most 24–30%), after 25–68%, median ≈ 43%; one enemy still dies in 3.5–5 hits and costs 6–23%. Enemy types differ: Duskwood spiders stay easy (26%), orc grunts are hard (63–68%).

**Group quests at the quest level (47 full fights, 8 main classes):**

| | before | after | target |
|---|---|---|---|
| 2 common heroes (main + better of tank/healer) win | mostly 100%; on target in 5/47 | 0–18%; on target (≤15%) in 42/47 | ≤15% |
| 3 heroes (main + tank + healer) win | 100% everywhere, median main HP lost 3% | 87–100%, on target in 43/47 (misses: worst class below 60%), median main HP lost 16% | ≥80%, worst class ≥60% |
| strong 2: main +2 levels with best gear + legendary (rb 0.20) | 100% | 52–100%, on target 47/47 | ≥50% |
| strong 2 with an epic (rb 0.15) | 100% | 40–100% | (reported) |

Over target for two heroes: fights that are the easiest pack of a goal quest (3 looters, 3 raiders, 3 skeletons: 16–18%), because calibration uses the hardest pack of the quest.

**Campaign path** (section 2; group quests with main + free companion = two heroes): every group quest on the path now fails with two heroes except the last, smaller goal fights. Solo quests 15+ on the real path: 54–100% average wins; db3 (courier + trapper at own level 15) 54% and rr_menace (two orc grunts) 69%, both pulled down by fire mage and druid at 0–5% (see gaps).

## Known gaps and findings (not changed here)

- **Fire mage at 15–18 and cat druid at 15** lose most two-enemy solo fights against strong types (orc grunts, gnoll runts, courier + trapper) — already 0–10% before this change (BAL-03).
- **Protection paladin tanks much worse than Protection warrior**: same party (fire mage + tank + holy priest) vs three Duskwood skeleton mages: 15% wins with a paladin, 60% with a warrior. The simulator uses a warrior tank for every main (AUDIT-01 lists paladin strength as unverified).
- Size-5 group quests (rr_gath, cl_sven15, cl_grave3, cl_stalvan13) use the same three-hero target; whether they should need more heroes is an owner question.
- `foeLine()` (encounter enemy summary in script-06, edited by the enemy-curve-summary and bal04 edits) has no caller in the assembled source; not updated.
- The simulator does not model gear on companions, tavern stars above 1, ambush XP or real play pacing; the arrival levels come from the campaign path.
