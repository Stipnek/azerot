# Pet progression and selection — 2026-11-21

## Status

User-approved design addendum to [Combat decisions](combat-decisions-2026-11-21.md). Documentation only: no implementation, tests, balance validation, or publication is claimed or authorized by this commit. This record supersedes the old Voidwalker level 9 and open pet progression entries.

## Unlock schedule

Unlocks use each owner's own level, for main and companions independently.

| Class | Pet | Level | Role |
| --- | --- | --- | --- |
| Warlock | Imp | 1 | Existing demon identity; detailed kit requires review |
| Warlock | Voidwalker | 10 | Defensive demon |
| Warlock | Succubus | 20 | Detailed kit requires review |
| Warlock | Felhunter | 30 | Detailed kit requires review |
| Hunter | Turtle | 10 | Durable defensive option, lower damage |
| Hunter | Cat | 20 | Single-target damage option |
| Hunter | Wolf | 30 | Physical group support through Furious Howl |
| Hunter | Owl | 40 | Enemy melee attack-power reduction through Screech |

Voidwalker at 10 replaces the previously accepted 9. Hunter families unlock automatically by level: no taming now or planned as part of this system. Do not grant all four at 10. No feeding or separate catch-up pet leveling is added. Unlocked families remain alternatives, not successive universal upgrades, and are available to all three hunter specializations.

Turtle starts with its defensive identity and basic attack at 10; Shell Shield opens at 20. Other families receive a working distinctive kit when unlocked. Exact actions and turn-based effects still require specification. These hunter unlock levels and automatic access are project adaptations, not Classic taming levels.

## Selection and persistence

- One active pet per owner. Selection is stored per owner, not globally by class. Pet choice and pet AI actions are separate from the six owner active slots.
- No pet switching in combat. Switching is allowed outside combat, including between rooms after combat fully ends.
- Each unlocked pet option retains its own health, resource, cooldowns, and death state. Switching does not heal, resurrect, or reset cooldowns.
- Inactive pets receive no extra recovery merely for being inactive. Exact normal recovery, resurrection, and cooldown advancement rules remain to be specified; do not invent them.
- No optional hunter no-pet mode after pet access. A defeated pet is still defeated; this rule does not automatically revive it.
- Demon death or replacement ends Soul Link. A new active demon requires reapplication.
- Preserve the main Hero and companion character-details selection locations from the main decision record.

## Mechanical boundaries

Use Classic identities as reference and label deliberate autobattle adaptations. Do not equate all pet resource systems. Turtle protection is its own protection, not a party shield or automatic interception. Wolf support must not silently become an additional permanent leader aura. Owl Screech is not a mass stun. Do not invent a free critical strike or stun for Cat Prowl.

No Felguard or exotic hunter families. Numerical coefficients, resource costs, cooldowns, AI thresholds, threat/targeting rules, complete pet action catalogues, icons, and sounds remain subject to review.

## Verification required

Test own-level unlock boundaries for main and companions; Turtle Shell Shield at 19/20; persistence across selection and save/load; blocked combat switching; no healing, resurrection, or cooldown-reset exploit; Soul Link termination/reapplication; pet event typing and eligible passive triggers. Verify selection cells, locked states, icons, and sound in a test build. None of these tests was executed by this documentation change.
