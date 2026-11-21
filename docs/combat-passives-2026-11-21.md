# Specialization passive unlocks — 2026-11-21

## Status

User-approved unlock schedule. Addendum to [Combat decisions](combat-decisions-2026-11-21.md) and the consolidated kit review. Documentation only: no gameplay implementation, executed tests, balance verification, or publication is claimed.

This supersedes the earlier open status of the 15/30 passive unlock schedule, not other unresolved design or numerical questions.

## Accepted schedule

Primary specialization mechanics unlock at the character's own level 15. Existing secondary passives unlock at own level 30 where listed. Do not invent a second passive for every specialization merely for symmetry. A dash means no additional passive selected for that milestone, not no later progression.

| Class | Specialization | Level 15 | Level 30 |
| --- | --- | --- | --- |
| Warrior | Protection | Passive shield block | Deflection / parry |
| Warrior | Arms | Deep Wounds | — |
| Warrior | Fury | Enrage | Flurry |
| Paladin | Holy | Illumination | — |
| Paladin | Protection | Reckoning | — |
| Paladin | Retribution | Vengeance | — |
| Druid | Bear | Thick Hide | — |
| Druid | Restoration | Gift of Nature | — |
| Druid | Cat | Primal Fury | — |
| Druid | Balance | Nature's Grace | — |
| Priest | Holy | Inspiration | — |
| Priest | Discipline | Improved Power Word: Shield | — |
| Priest | Shadow | Shadowform as a state | — |
| Mage | Fire | Ignite | — |
| Mage | Arcane | Arcane Concentration | Arcane Instability |
| Mage | Frost | Shatter | — |
| Hunter | Marksmanship | Mortal Shots | — |
| Hunter | Beast Mastery | Pet Frenzy | — |
| Hunter | Survival | Increased dodge; final display name pending | — |
| Rogue | Combat | Dual-wield specialization | — |
| Rogue | Assassination | Ruthlessness | — |
| Rogue | Subtlety | Opportunity | Initiative |
| Warlock | Affliction | Nightfall | — |
| Warlock | Demonology | Unholy Power | Master Demonologist |
| Warlock | Destruction | Ruin | — |

## Definitions and dependencies

The table schedules the previously discussed project mechanics; it does not assert that all are literal passive abilities or original Vanilla unlock levels. Shadowform is explicitly a state. Protection's passive block is an autobattle adaptation, not an unannounced additional active Shield Block button.

Forms, required resources, combo points, Fury's dual-auto identity, and basic role healing must accompany a usable role kit. Do not postpone those prerequisites to level 30 because they are not active buttons. Teaching-profile details before 15 remain a separate open item.

Use the approved event rules from the main decision record. In particular: Enrage is the proposed incoming-critical trigger, not the old lost-health speed ladder; Arcane Concentration is the proposed next-spell mana benefit, not the old random cooldown reset; Shatter needs frozen status; pet Frenzy uses the pet's critical, not its owner's. These require implementation and verification, not merely description changes.

Survival's defensive passive is dodge for the agreed candidate, not parry under a misleading label. Keep its stable internal identifier or migrate it deliberately; the final UI name remains open.

Nightfall's and Nature's Grace's exact turn-based adaptations remain unresolved. This schedule does not silently select their detailed effects.

## Boundaries

No numerical ranks, percentages, proc chances, durations, or resource costs are approved by this schedule. Do not automatically amplify these passives again at arbitrary later levels. Future talent modifications require separate design.

These features are separate from the six base active slots and the main's future seventh talent ability. Auras, composition resonances, pet selection, and racial features remain separate systems.

## Required tests

Test each milestone at 14/15 and, where applicable, 29/30 for main and companions independently. Before unlock there must be no hidden passive bonus or proc; after unlock it must use only eligible events. Verify save/load, specialization changes, UI locked states, no duplicate grants, and interactions with auras and pets. Source definitions alone do not prove these tests pass.
