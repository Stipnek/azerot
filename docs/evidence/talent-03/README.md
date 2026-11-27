# TALENT-03 warrior — simulator evidence (2026-11-27)

Before = branch commit `855b164` (main `ac90e94` + shield-block fix). After = the warrior talents commit on `claude/charming-shannon-y7g0a1`.
Commands: `node scripts/sim_class_audit.cjs 30` (N=30 per cell) and `node scripts/sim_campaign.cjs 20 --only feel,group` (N=20).
The "after" simulators give the main hero the companion talent line as its build (Fury/Protection), and the warrior Arms main in `sim_campaign` now fights as the game's integrated Arms (before it used the old non-integrated kit with Mortal Strike from level 1).
These are reports, not regression gates; play-test is the owner's acceptance.

## Warrior, class audit (solo: win / main HP lost vs two same-level enemies; party: win)

| spec | | solo 15 | solo 20 | solo 25 | solo 30 | party 15 | party 20 | party 25 | party 30 |
|---|---|---|---|---|---|---|---|---|---|
| Protection | before | 68% / 68% | 100% / 68% | 100% / 62% | 100% / 51% | 17% | 100% | 100% | 80% |
| | after | 71% / 66% | 100% / 65% | 100% / 60% | 100% / 48% | 23% | 100% | 100% | 73% |
| Arms | before | 100% / 44% | 100% / 39% | 100% / 35% | 100% / 30% | 0% | 73% | 100% | 90% |
| | after | 100% / 52% | 100% / 41% | 100% / 33% | 100% / 24% | 0% | 97% | 100% | 100% |
| Fury | before | 100% / 43% | 100% / 34% | 100% / 33% | 100% / 37% | 27% | 100% | 100% | 100% |
| | after | 100% / 41% | 100% / 42% | 100% / 49% | 100% / 38% | 33% | 100% | 100% | 100% |

Every other spec's party columns use a Protection warrior companion as the tank; with the final kit order (Thunder Clap 19, Revenge 23, Shield Block 26) none of them is worse than before by more than the N=30 noise (party 20: Arcane 47% → 63%, Marksmanship 73% → 97%). The first variant (Shield Block at 19 as the refill, Thunder Clap only at 23) dropped party 20 to 3% for Arcane and 23% for Marksmanship: the tank had no threat tool between 19 and 23; it was discarded.

## Campaign (sim_campaign, N=20)

- Solo feel 1–60: hits to kill and HP lost unchanged within noise (two enemies at 15–30: 18–46% HP lost, before 19–48%).
- Group quests (BAL-06 targets): full party on target 46/47 (before 39/47), median main HP lost 14% (before 20%); short party (2 heroes) ≤15% in 38/47 (before 40/47). The short parties that got stronger are main + Protection warrior companion at 24–30 (e.g. cl_watch1 skeleton warriors 17% → 49%, cl_sven8 raiders 15% → 53%). Ablation at cl_sven8 level 28: without Last Stand the duo wins 0–35%, with it 20–95%; the companion takes Last Stand on its line (an ability talent, owner rule), and the game resets cooldowns every fight (Classic: 10 min). Open owner decision.

Files: `class-audit-before/after-2026-11-27.md`, `campaign-before/after-2026-11-27.md` (full tables).
