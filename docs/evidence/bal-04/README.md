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
