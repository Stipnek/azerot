# Training roles and specialization transition — 2026-11-21

## Status

User-approved general design policy, reconciled 2026-11-24 against source checkpoint `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`. Addendum to [Combat decisions](combat-decisions-2026-11-21.md) and [Passive unlock schedule](combat-passives-2026-11-21.md). This documentation update neither changes gameplay nor executes tests or confirms publication.

## Accepted general rules

1. Before level 15, each character uses a basic class training kit without a preassigned future specialization.
2. A training role must have its required healing, defense and resource tools when that role becomes available. Do not require a role without its necessary tools.
3. At own level 15, specialization selection opens its aura, primary passive or state and starting active abilities. No hidden future-specialization bonus before selection. Later new-main automatic DD assignment is a scoped implementation described below, not a reinterpretation of every character's selection policy.
4. Training abilities replaced by the specialization kit leave the combat rotation; they must not become extra buttons beyond the agreed six base active slots.
5. The policy covers main and companions, checking each character's own level independently. This policy is not evidence of complete implementation for both populations.

## Later source evidence: keep scope explicit

The original statement that exact per-class training abilities were entirely unspecified is historical. The later neutral registry defines three teaching actives per class at 2/5/9 for eight classes. [Transition history](spec15-transition-scope.md) records the newer evidence and distinguishes it from the early warrior-only patch.

The inspected UI adapter `src/scripts/script-06.zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz-neutral-training.edits.json` enables neutral training only for `k === 'me'` in integration mode with a valid, not-yet-chosen autoSpec15 marker and own level 1..14. Its edits share training skill views, stat identity and contextual descriptions and suppress specialization-derived passive display for neutral actors. It does not automatically convert old heroes or companions.

The autoSpec15 path stores a roll for newly created integrated-mode mains and assigns one class DD once from own level 15. Do not equate that scoped DD path with a complete healer/tank training-role catalogue, manual-selection UI for all actors or a validated migration for existing saves. Engine support for a descriptor does not prove every game caller supplies it.

## Remaining design and verification boundaries

The general policy does not itself approve coefficients, a role-assignment interface, migration mechanics or final all-class specialization kits. Existing later passive milestones at 30 remain governed by the separate accepted schedule; no passive-table change is made here.

Verify levels 14/15 independently for main and companions: no future aura or passive leaks; usable role resources; removal of replaced training abilities; save/load without duplicate grants; compatibility of old heroes; and flag-off behavior. Test definitions or aggregate CI alone do not establish all these outcomes. Record revision, actor population, test scope and actual results. No tests were run by this documentation update.
