# Combat design decisions — 2026-11-21

## Status and scope

Accepted design decisions from the user's November 21 discussion. This document records agreements, NOT implementation, passing tests, numerical balance, or a published release. No gameplay implementation, merge, deployment, or paid Computer task is authorized by this documentation commit.

This is a decision record, not the complete ability catalogue or implementation specification. Earlier six-ability and aura spreadsheets remain review drafts wherever not explicitly settled below. Do not reconstruct missing coefficients, unlock levels, or talent effects from assumptions. Existing technical documentation remains in English; preserve Russian UI names and stable save identifiers.

## Progression and ability budget

- Specialization selection: level 15 in the proposed new progression.
- Small teaching kits unlock progressively before specialization. At specialization selection, some teaching abilities remain and others are replaced or removed. They are not an extra permanent layer above the specialization kit.
- Target six guaranteed base active abilities per specialization, unlocked throughout progression, not a complete kit at level 15–20.
- Base abilities and specialization passives develop by each character's own level, for both main and companions.
- Passives, auto-attacks, basic role healing, forms, pet selection, and pets' own actions are listed separately from the six base actives. Their power still counts in balance.
- Future main-character talents modify and strengthen builds and provide a separate seventh active ability. The seventh ability's effect and exact unlock requirement are not selected yet.
- Named legendary companions have their separate personal seventh ability. Ordinary companions do not automatically receive that additional ability.
- Do not later remove guaranteed base abilities merely to grant them again through talents.
- Detailed passive unlock schedules, coefficients, costs, durations, and most proposed ability levels are not final. Do not silently grant all passives at level 15.

## Settled kit changes

- Protection paladin: Seal of Righteousness / Печать праведности replaces the proposed Cleanse slot.
- Retribution paladin: Seal of the Crusader / Печать воина Света replaces the proposed Cleanse slot. Exorcism is not selected for this guaranteed six-ability slot.
- Holy paladin retains Cleanse, spell 4987: Magic, Poison, Disease. Do not confuse it with Purify, spell 1152: Poison and Disease.
- Assassination rogue retains Eviscerate at specialization selection (15); Deadly Poison moves to the proposed level 24 opening. Final kit membership does not change.
- Destruction warlock: retain Searing Pain in the candidate kit; replacing it with Shadow Bolt was not accepted.
- Demonology: Soul Link replaces Banish in the six base abilities. Proposed unlock: 40. Soul Link is an applied sustained link, not a silently substituted passive or short burst buff.
- Beast Mastery: Bestial Wrath belongs to the six base abilities. Proposed unlock: 40, superseding the earlier 54 proposal.
- Soul Link and Bestial Wrath do not occupy the main character's extra seventh slot.
- No Felguard or exotic hunter families/devilsaur. Use Vanilla/Classic class references, with explicitly documented autobattle adaptations.

## Pets and interfaces

- Voidwalker unlock: level 9. Other detailed pet unlock schedules and hunter families still need a final catalogue; Imp at 1 and the first hunter pet at 10 remain working proposals.
- Warlock choices: Imp, Voidwalker, Succubus, Felhunter; no fifth Felguard.
- Pet choice is separate from the six active slots and stored per owner, not globally by class.
- Main selection belongs in Hero; companion selection belongs in the shared character-details interface, alongside but separate from the accessory area.
- Remove the optional no-pet hunter mode after pet access. This does not make a defeated pet automatically alive.
- No pet switching during combat. Exact between-room switching and resource persistence rules still need implementation-level agreement; do not introduce free healing, resurrection, or cooldown resets.

## Combat event model

- Damage events carry explicit physical/magical type. Aura damage bonuses follow the actual event, not merely the owner's class type.
- Also distinguish school (Holy, Fire, Shadow, etc.), ability category, origin, and delivery: weapon auto, extra weapon attack, direct skill, periodic tick, reflection, redirected damage, pet attack.
- School and talent category are not equivalent. Ruin applies to the defined Destruction spell category, not every Fire/Shadow event.
- Vengeance is not melee-crit-only: eligible weapon, spell, or ability critical strikes must be considered. Nature's Grace is not restricted to Nature-school criticals.
- Each passive has explicit eligible events. Ignite requires eligible Fire criticals; Primal Fury requires an eligible generator critical; healer critical passives require eligible direct healing; pet Frenzy requires the pet's own critical.
- Ordinary DoT and HoT ticks cannot crit. Any later exception must be explicit. Periodic events do not inherit direct-hit proc permissions.
- Holy vulnerability affects Holy damage events and remains separate from Scorch's vulnerability. Do not use one generic magic-vulnerability effect for both.
- Seal procs require an explicit eligible weapon-attack list. Seal of Righteousness may trigger from eligible auto/extra weapon attacks, including Reckoning attacks; not Holy Shield reflection.
- Seal of Command proc frequency is defined per eligible attack, not per turn plus an extra speed multiplier. Exact probability/normalization remains to be balanced.
- Judgement releases the selected seal's own effect; it does not itself roll another random seal proc. Seal damage cannot recursively proc seals.
- Frozen is distinct from slowed and stunned. Shatter requires the agreed frozen condition. Bosses are freeze-immune by default; encounter exceptions must be explicit.
- Vampiric Embrace uses actual eligible Shadow damage, including Shadow Word: Pain. Its resulting healing cannot crit or start healer-passive/healing recursion.
- Do not remove resource-limited cooldown-zero abilities solely because their cooldown is zero. Audit action limits, resource costs, and AI priorities.

## Soul Link adaptation

This section defines our adaptation, not a claim about exact original server ordering.

1. Resolve the incoming event against the owner's mitigation.
2. Apply the owner's absorb shield.
3. Split the remaining eligible damage between owner and active living demon.
4. Apply the demon's redirected share without a second armour/resistance/aura/mitigation pass.
5. If the demon cannot cover its share, it loses available health and dies; the uncovered remainder returns to the owner. Do not delete damage.
6. Eligible enemy periodic damage is also shared. Transfer only damage; poison, weakening, or other attached effects remain on the original target.
7. Redirection cannot crit, reflect, redirect recursively, generate rage, or trigger Reckoning and similar incoming-hit proc chains.
8. Demon death or replacement ends the link; a new demon requires reapplication.
9. Count attacker damage once, record actual owner/demon health loss separately, and display absorbed/redirected quantities separately. Do not grant a second damage-based healing payout for the same transfer.

## Leader auras and composition resonances

- Preserve the separate authored aura/resonance system; do not remove it merely because it is not a literal Vanilla class mechanic.
- One main-character specialization aura; companions do not stack their own leader auras.
- Preserve existing companion-only resonance thresholds as baseline. Main is excluded; pets are not additional companions.
- Correct misleading labels: physical damage dealer does not necessarily mean melee damage dealer.
- Pet resonance means an eligible companion has a pet, not that the main has one.
- Retain current aura percentages as a comparison baseline. Mechanical fixes are not proof of completed numerical balance.
- Default group HP, speed, crit, and damage-reduction bonuses may affect pets once. Damage-type bonuses follow pet event type. Owner-only passives do not transfer unless explicitly specified.
- Pet low-health damage bonus uses that pet's own health.
- Aura availability before 15, proposed resonance renamings, and exact resource handling on recalculation remain open; do not silently decide them.

## Interrupts and enemy kits

- Interrupt design remains to be finalized: support readable prepared/next interruptible spell events without requiring a real-time cast bar, meaningful cooldowns, and explicit immunity rules.
- Interrupts must not cancel every enemy action indiscriminately. Distinguish silence, stun, fear, freeze, and interruption.
- Review substantial original enemy abilities, beginning with Deadmines bosses AND ordinary enemies. Record each ability as implemented, adapted, or excluded with a reason. Avoid reducing all enemies to interchangeable damage buttons.

## Presentation and assets

- Each implemented ability needs a verified matching icon, readable description, appropriate slot/state display, event feedback, and assigned checked sound.
- Audit existing icons for correctness, not merely successful downloads; offline availability is a separate check.
- Find sources and match assets before using paid Computer work. Computer is for bounded analysis, assembly, processing, and browser/testing tasks, not open-ended searching.
- Actual audio files, decoding/playback verification, volume/mute integration, and overlap control are required. A list of proposed filenames is not a completed sound pack.
- Public availability of assets is not a distribution licence. Record provenance and usage limitations. Preserve existing music unless separately approved.

## Tests and release gate

- Pin the exact implementation source commit before editing. Historical Opus snapshot 30b31a11 is evidence about that snapshot, not current live.
- Confirm current code and ordered edit manifests; ability definitions alone do not prove runtime execution.
- Existing inspected code used cap 30 and specialization level 10. Proposed later unlocks require explicit progression integration, not only registry edits.
- Test unlock boundaries, 14→15 transitions, own-level companions, resources, passive triggers, event schools, seals, shields, dispels, Soul Link overflow/death, pet selection, saves, and aura recomputation.
- Compare fixed encounter/party/gear fixtures over the same seed set, not one favourable battle. Preserve baseline evidence; do not claim new results from historical runs.
- Browser acceptance covers all cells/icons, readable states, phones/wide layouts, sound playback/overlap, and a complete dungeon run.
- Implement in a test branch/build. Design acceptance is not implementation acceptance. Publication requires separate approval of the exact tested version.

## Still open

Full consolidated ability and passive unlock catalogue; final costs/chances/durations; exact pet family catalogue; pre-15 aura behaviour; interrupt/telegraph timing; supported periodic/channel adaptations; preservation of pet resources between encounters; implementation migration details; icon and sound asset delivery; main talent trees and seventh-ability effects; numerical balance and live acceptance.
