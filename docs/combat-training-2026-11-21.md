# Training roles and specialization transition — 2026-11-21

## Status

User-approved design rules. Addendum to [Combat decisions](combat-decisions-2026-11-21.md) and [Passive unlock schedule](combat-passives-2026-11-21.md). Documentation only; no gameplay implementation, testing, or publication is claimed or authorized by this commit.

## Accepted rules

1. Before level 15, each character uses a basic class training kit without a preassigned future specialization.
2. A training role must have its required healing, defense, and resource tools when that role becomes available. Do not require a character to perform a role without its necessary tools.
3. At own level 15, specialization selection opens the selected specialization's aura, primary passive or state, and starting active abilities. There is no hidden bonus from a future specialization before selection.
4. Training abilities replaced by the specialization kit leave the combat rotation. They must not become extra buttons beyond the agreed six base active slots.
5. Apply the same rules to the main character and companions, checking each character's own level independently.

## Scope and open details

These rules close the general pre-15 training policy and specialization aura timing. They do not select exact per-class training abilities, a role-assignment interface, numerical values, or migration mechanics. Those details require separate review. Existing later passive unlocks at 30 remain unchanged.

## Verification required before implementation is considered complete

Check levels 14 and 15 and specialization selection for main and companions independently. Verify no future-specialization aura or passive leaks before selection, required training tools are available, replaced training abilities do not remain in the rotation, and save/load does not duplicate grants. These tests have not been run by this documentation change.
