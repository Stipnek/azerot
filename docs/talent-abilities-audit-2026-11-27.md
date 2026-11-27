# Abilities that are talents in WoW Classic — audit of the current kits (2026-11-27)

Owner rule (2026-11-27): as in WoW Classic, an ability that Classic gave through a talent must not open by itself; it comes from that talent. If a kit gives such an ability for free, the kit is wrong: rework the ability and put the talent back. Earlier owner rule: core 1-point talents that grant an ability are taken automatically by companions (the main cannot skip them when levelling that tree).

Source: current kits `B.CLASSES[cls].specs[spec].skills` at `fae086c`; Classic 1.12 talent trees from memory (no owner analysis found in the repository, issues or PRs). Earliest Classic level = first talent point at 10, five points per tier: tier 3 → 20, tier 5 → 30, tier 7 → 40. Tiers marked ≈ are not verified against a database yet.

| Spec | Kit abilities that are Classic talents (tree, tier ≈ earliest level) | Not in Classic at all |
|---|---|---|
| Warrior Arms | Mortal Strike (Arms 7, 40) — given at 15 now; Sweeping Strikes already a talent | «Улучшенный смертельный удар» (rename of Improved Heroic Strike) |
| Warrior Fury | Bloodthirst (Fury 7, 40), Death Wish (Fury ≈5, 30) | — |
| Warrior Protection | Shield Slam (Prot 7, 40) | — |
| Paladin Holy | Holy Shock (Holy 7, 40), Divine Favor (Holy ≈3–5, 20–30) | — |
| Paladin Protection | Holy Shield (Prot 7, 40), Consecration (Holy ≈3, 20) | — |
| Paladin Retribution | Seal of Command (Ret ≈3, 20) | Crusader Strike (added in later expansions) |
| Druid (all four) | — (Maul, Swipe, Roar, Frenzied Regeneration, Shred, Rake, Rip, Bite, Wrath, Moonfire, Starfire, Hurricane, Rejuvenation, Regrowth, Entangling Roots, Innervate are trainer spells) | — |
| Priest Holy | Holy Nova (Holy ≈3–5, 20–30) | — |
| Priest Discipline | Power Infusion (Disc 7, 40) | — |
| Priest Shadow | Mind Flay (Shadow ≈3, 20), Vampiric Embrace (Shadow ≈4–5, 25–30); Shadowform state (Shadow 7, 40) | — |
| Mage Fire | Combustion (Fire 7, 40) | — |
| Mage Arcane | Arcane Power (Arcane 7, 40), Presence of Mind (Arcane ≈5, 30) | — |
| Mage Frost | Ice Barrier (Frost 7, 40) | — |
| Hunter Marksmanship | Aimed Shot (MM ≈3, 20) | Steady Shot (later expansions) |
| Hunter Beast Mastery | Intimidation (BM ≈5, 30), Bestial Wrath (BM 7, 40) | Steady Shot |
| Hunter Survival | — | Steady Shot |
| Rogue Combat | Blade Flurry (Combat ≈5, 30) | — |
| Rogue Assassination | Cold Blood (Assn ≈5, 30) | — |
| Rogue Subtlety | Preparation (Subtlety ≈5, 30) | — |
| Warlock Affliction | — | — |
| Warlock Demonology | Fel Domination (Demo ≈3, 20) | — |
| Warlock Destruction | Shadowburn (Destro ≈3, 20), Conflagrate (Destro 7, 40) | — |

In total 22 kit abilities are Classic talents (11 of them 31-point tier-7 talents, earliest level 40) and two abilities are not in Classic (Crusader Strike, Steady Shot).

## The conflict to decide

The test level cap is 30. With Classic talent rules (one point per level from 10, five points per tier) no tier-7 talent is reachable before 40, so Mortal Strike, Bloodthirst, Shield Slam, Holy Shock, Holy Shield, Power Infusion, Combustion, Arcane Power, Ice Barrier, Bestial Wrath, Conflagrate and Shadowform would not exist under the cap. The owner also asked that everything open by 30 in the test.

Options:
- **A. Classic tiers as they are.** Tier-7 talents wait for the cap to rise to 40+. Kits up to 30 use Classic trainer abilities instead (for example Arms: Heroic Strike, Rend, Thunder Clap, Overpower, Cleave, Execute, Slam, Sweeping Strikes). Most faithful, but specs lose their signature until 40.
- **B. Compressed tiers while the cap is 30.** Same trees and prerequisites, fewer points per tier (for example 3 instead of 5, so tier 7 needs 18 points = own level 27). Everything is reachable by 30; at the 60 cap tiers go back to 5 points. Matches «everything open by 30 for the test».

Recommendation: B for the test, A's kit rule in both (talent abilities only through talents, the kits filled with Classic trainer abilities where a slot becomes empty). Companions take ability-granting talents automatically at the level a main could first reach them.

## Work that follows the decision

1. Talent trees for all 25 specs (data for the Classic talent window: layout, icons, prerequisites; effects for ability talents first).
2. Kits: remove talent abilities from the free kits, add Classic trainer abilities where needed, drop or replace Crusader Strike and Steady Shot.
3. Main: abilities from talents only when the talent is taken; companions: automatic ability talents.
4. Rebalance with `scripts/sim_campaign.cjs` and `scripts/sim_class_audit.cjs`.
