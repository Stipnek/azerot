# Arms talent prototype — test branch only (2026-11-21)

## Scope and status

Isolated, flag-gated prototype of the Classic Era Arms tree for one warrior specialization. **Not** the new progression for all classes, **not** a complete Arms tree, **not** accepted balance, **not** published. Main and live are unchanged. The ordinary game ignores the prototype unless a party member carries `proto: 'arms'`; the ordinary new-game flow, global `SPEC_LEVEL` (10), other classes and ordinary pets are unchanged (verified by a 300-scenario flag-off fingerprint, see Tests).

Base: `e54150f4bdfba70fa37f1265f673e9b2467b1003`.

## Rules implemented under the flag

- Points: 0 before own level 15; `L − 9` from 15 (6 at 15, 21 at 30; model continues to 51 at 60, engine cap stays 30).
- Row N needs `5·(N−1)` points spent in lower rows; earliest purchase: rows 1–2 at 15, 3 at 20, 4 at 25, 5 at 30, 6 at 35, 7 (Mortal Strike) at 40. Prerequisites require the full prerequisite node (calculator rule; Anger Management/Tactical Mastery confirmed by source, others by the same rule).
- Before 15: training kit Heroic Strike (2), Thunder Clap (5), Rend (9); no talents, no specialization aura, no spec passives. From 15: Arms aura and talents; Cleave 20, Execute 24, Slam 30 (project schedule, not Classic trainer levels for the training kit). Mortal Strike only from the talent.
- Companion: automatic line (= build A), own level, same node definitions as the main. No compensation multiplier.
- Prototype availability is a separate layer (`ARMS_PROTO.unavailable`): Improved Charge, Tactical Mastery, Anger Management, Improved Overpower, Axe/Mace/Sword/Polearm Specialization, Improved Hamstring are visible but not purchasable. Validation can ignore this layer (`ignoreAvailability`) for future schema expansion.

## Effects (status)

| Node | Effect in prototype | Status |
| --- | --- | --- |
| Improved Heroic Strike | Rage cost −1/−2/−3 | Classic value |
| Deflection | Parry +1–5% (`parryBase`) | Classic value |
| Improved Rend | Rend tick ×1.15/1.25/1.35 | Classic value |
| Improved Thunder Clap | Rage cost −1/−2/−4 | Classic value |
| Deep Wounds | Total 20/40/60% of attack over 4 ticks; refresh, no stacking; from crits of weapon auto-attacks and weapon abilities (Heroic Strike, Cleave, Slam, Execute, Mortal Strike); not Thunder Clap, DoT, sweep hits | **Proposal** (unit "weapon damage" = 1.0 × attack) |
| Two-Handed Weapon Specialization | +1–5% to weapon auto-attacks and weapon abilities; not DoT/Thunder Clap | Classic value; event list is a **proposal**; Arms treated as two-handed archetype |
| Impale | Ability crit multiplier `1 + (M−1)(1 + 0.1·rank)` → ×1.55/×1.60 from ×1.5; not auto-attacks or DoT | Classic principle |
| Sweeping Strikes | 30 rage, cooldown 6 own turns, 5 charges, expires after 4 own turns; a charge is spent per damaging weapon hit (Cleave spends 2) on another living enemy; misses do not reach the hook and spend nothing; with no second target the charge is kept (`consumeWithoutSecondTarget: false`); extra hits cannot proc Deep Wounds or charges | **Proposal** (time units, cost mapping, miss/no-target behaviour) |
| Rend/Deep Wounds ticks of prototype warriors | Cannot crit | Follows agreed DoT rule; only for prototype sources |

## Experiments (separate, test only)

`createBattle({ experiment: { acc, petRb } })`; absent → unchanged behaviour.
- Accessory (`p.acc`): HP and role output (attack, or healing power for healers) in the additive bucket `1 + rb + acc`; mana, speed, crit unaffected; pet receives the owner's accessory once.
- Pet rarity (`petRb`): pet HP and attack × `(1 + owner rb)` once.
- Scales: A 5/10/15/20/25/30%, B 2.5/5/7.5/10/12.5/15% for grey…orange. No rarities added to loot.

## Saves

Prototype harness uses `localStorage['azerot.proto.arms.v1']` (schema 1: levels, talents, encounter, seeds, experiment settings). The normal save `azeroth-ab-setup-v5` is only read on request and never written. Derived stats are not stored. Invalid or foreign-schema data resets with full point refund.

## Files

- `src/scripts/script-05.txt` — engine hooks and prototype module (`api.armsProto`).
- `scripts/lib_engine_load.cjs`, `scripts/lib_flagoff_fingerprint.cjs`, `scripts/fixtures/arms-proto-flagoff-baseline.json` — loader and flag-off baseline (recorded from the unmodified engine at the base commit).
- `scripts/test_arms_proto.cjs` — fast regressions (runs in the existing `test_*.cjs` loop).
- `scripts/sim_arms_proto.cjs` — balance simulations (report only, not a gate).
- `scripts/arms_proto_ui.js`, `scripts/build_arms_proto.py` → `preview/arms-proto.html` — isolated test page.

## Known limitations

Talent UI exists only in the isolated page, not in the game's hero screen. Pre-15 training uses the Arms stat profile (training-profile stats remain undecided). No weapon types, no enemy dodge, no Charge/Overpower. Deep Wounds, two-handed event list and Sweeping Strikes parameters are proposals awaiting owner choice. Live deployment state was not verified.
