# BAL-04 evidence: simulator vs real early-game path (2026-11-26)

Revision: branch `claude/nifty-fermat-oci73c` at `362e06f` (game source identical to main `50bd6ab`; the branch changes only docs/CI/root files). Build: `python3 scripts/build_combined_preview.py` → `preview/combined.html` (local, not published).

## How it was produced

1. `dump-quests.cjs`: loads a **scratch copy** of `preview/combined.html` in Chromium (isolated context, no saves) where one line exposes the closure `QUESTS`/`PLACES` as `window.__dbg` right after the V57 quest rewrite. Writes the effective quest list (need chains, minLevel, goals) and the runtime `Battle.ENCOUNTERS`. The patch is applied only to the scratch copy, never to source:
   `h.replace(A, A + 'window.__dbg={QUESTS:QUESTS,PLACES:PLACES};')`, where `A` is the `for(const q of QUESTS){const old=V57_OLD_QUESTS.get(q.k);…}` statement (unique).
2. `campaign-probe.cjs <dump.json> [N]`: engine via `scripts/lib_engine_load.cjs`, runtime encounters copied in. Fresh hero, every win assumed, picks the available Elwynn/Westfall quest with the lowest encounter level first, XP via the engine's `xpShares` (goal quests: 0.12 XP multiplier per required kill, as `recordQuestVictory`). Battles use the hero's **own** level on arrival, the enemies the game actually spawns (`prepareQuestEnemies`: up to 3 remaining goal enemies), main + free companion (prot warrior; holy priest for a warrior main), main in neutral training below 15. N = 100 seeds per class.

Not modelled: ambush XP (5% per move, small), daily quests (removed in the build), repeating fights for goal quests counted as one encounter, item stat bonuses and tavern rarity bonus (both only make the party stronger), parties larger than 2 (see the 3-hero check below).

## Result

See [campaign-2026-11-26.md](campaign-2026-11-26.md). "sim-assumed" = hero at the encounter's level with the static enemy list (what `sim_enemy_curve.cjs` tests; for groups the official simulator uses 3 heroes from level 10). "real own lvl" = level reached on the path.

3-hero party (main + prot warrior + holy priest) at the real own level:

| encounter | own level | worst classes |
|---|---|---|
| wf_militia2 (13) | 11 | warrior 41%, others 86–97% |
| wf_militia2 (13) | 13 | all 100% |
| wf_coast2 (14) | 12 | warrior 0%, druid 6%, rogue 27%, priest 35%, hunter 43%, warlock 46%, paladin 54%, mage 56% |
| wf_coast2 (14) | 14 | all 100% |
| princess (6) | 4 | all 100% (2 heroes: druid 26%) |

## Day 3 (2026-11-26): owner rule and first balance candidate

Owner direction (chat, 2026-11-26): the game is now too easy and fights drag. Classic feel: a level-1 enemy dies in 3–5 auto-attacks, abilities come gradually; two enemies cost about half HP without gear; three need gear or a level advantage. Group quests to be made harder later, when there is data.

Measured before the change (engine, hero alone, no gear, own level = enemy level): a level-1 hero has 681 HP (warrior) against wolf hits of 7–16, so cannot lose; from level 2 the training kit's skill plus an auto kills an enemy in one turn (1.9 hits). Two same-level enemies cost 3–28% HP, three 7–60%, with 100% wins. Cause: the general enemy curve (`ENEMY_CURVE`, 23 Nov) halves enemy HP and attack below level 10, on top of the neutral training kit from level 2. Reference point: at level 15–16 against Redridge orc grunts (curve 1.0) the numbers already match the owner's rule (−15% / −47% / 55% wins).

Candidate (branch `claude/loving-cannon-ykm747`, not merged):

1. `script-05.zzzzzzz-solo-enemy-curve.edits.json`
   - `SOLO_ENEMY_CURVE`: per-level HP/attack multipliers for size-1 non-dungeon fights (solo quests, quest goal fights, road ambushes), levels 1–14. Group fights, dungeons, dummies and level 15+ keep `ENEMY_CURVE`. `enabled: false` restores the old behaviour.
   - `SOLO_MAX_ENEMIES = 2`: early solo encounters spawn at most two enemies (first two of the list; the original list stays in `uncappedEnemies`).
   - `EARLY_XP`: rewards of levels 1–14 ×1.25. Without it the hero reaches Westfall quests 1–3 levels low; with it the arrival level is the quest level ±1 and the hero is level 14 after all quests up to 14 (was 12).
2. `script-05.zzzzz-first-quests-level-shift.edits.json`: five misspelled keys fixed (BAL-02), so kobold_camp is level 1, echo_scout/echo_raid 2, gold_dust 4, lost_guards 6 as PR 18 intended. Without this the first level-2 quest is taken at level 1 with no abilities (3% wins).
3. `script-06.…-bal04-solo-fights.edits.json`: ambushes and goal fights use the same two-enemy cap; the enemy summary shows solo-curve numbers.

Tool: `scripts/sim_campaign.cjs` (fight feel table + campaign path from `scripts/fixtures/early-quest-graph.json`, own level from XP). Results N=60: [before](sim-before-2026-11-26.md), [after](sim-after-2026-11-26.md).

After, in short: enemies die in 3.4–5 hits; one enemy costs 8–25% HP; two cost 40–65% for most enemy types; three at the same level win 25–55%, at +2 levels ~80%. Campaign path: every solo quest ≥87% average wins except wf_heirloom (two gnoll runts, 65%) and wf_bandanas (looter + trapper, 58%).

Known gaps, not addressed here: class spread (priest and mage weakest in the training kit; druid weak vs gnoll runts at 4–5); strong enemy types (gnollRunt, trapper, pillager, thief at 4) sit above target; group quests are unchanged and still trivial early (3–8% HP lost) but wf_coast2 with only main + free companion is 0% and wf_militia2 54%; level 15+ normal enemies are also easier than the rule (not measured in depth); battle pacing on screen not measured.
