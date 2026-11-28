# Temporary integrated Arms rules — cap 30

> **Superseded in part 2026-11-27 (TALENT-03, owner decision B, candidate on `claude/charming-shannon-y7g0a1`):** Mortal Strike is no longer a base ability at 15 but the tier-7 talent (3 points per tier, earliest level 28), Heroic Strike stays in the kit with Classic Improved Heroic Strike, Deep Wounds is the Classic talent (no baseline), companions take Sweeping Strikes and Mortal Strike on their line. The rest below is history.

> **Status 2026-11-26:** the release workflow publishes the combined build, which includes the integrated hero mode with these temporary rules. Statements below that this is preview-only, test-only or unpublished describe their own date. Open items are tracked in [OPEN-WORK](OPEN-WORK.md) (ARMS-01).

Reconciled: 2026-11-24 against source checkpoint `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`. Original reviewed baseline: `567ce1b2cdd465df7be7c3836535f7c797098dbe`.

## Status and boundary

The temporary rules below were accepted for the integrated Arms package, not as final numerical balance or level-60 progression. The original test-branch-only wording described that stage. Later integration is in main through PR #21 and the combined release workflow; this record does not confirm deployment or player acceptance. Historical comparison prototype, integrated runtime descriptors and the combined release are distinct concepts.

## Accepted temporary rules

Training: Heroic Strike 2, Thunder Clap 5, Rend 9 (superseded 2026-11-28 by the Classic trainer levels of PLAY-11: Heroic Strike 1, Rend 4, Thunder Clap 6; bug hunt W5/W6). At 15 Mortal Strike replaces Heroic Strike. Cleave unlocks at 20, Execute at 24 and Slam at 30. Thus the temporary kit has six base actives at 30: Mortal Strike, Thunder Clap, Rend, Cleave, Execute and Slam. This does not select other classes' six-slot kits.

Sweeping Strikes is the main's separate talent active; ordinary companions do not receive it automatically. The retired Mortal Strike talent does not grant a second copy.

The stable `ihs` rank key is retained but shown and applied as Improved Mortal Strike: rage reduction 1/2/3. Deep Wounds is baseline from own level 15: 20% attack total over four ticks. Its retained `deepwounds` talent key increases that baseline by 20/40/60% (totals 24/28/32%), rather than granting another copy. These numbers are the recorded temporary adaptation, not a general coefficient approval or a newly executed balance check. Eligible weapon-event and noncritical-periodic rules remain; ordinary onCrit must not also be granted for these actors.

## Source implementation and populations

`src/scripts/script-05.zz-arms-stage1.edits.json` defines the integrated API: training/base slot plans, validation, changed costs, bleed calculation, passive description and separate main talent active. It applies the integrated kit to explicitly marked `integratedArms` actors and retains the historical prototype path.

Character adapters decide which actors reach that API. In particular, later validated new mains can use the neutral-training path before 15. Do not assume every stored hero or companion follows that same new-main path. Existing rank keys are preserved; bad allocations use validated reset behavior rather than partial grants. Reconcile all ordered edits before changing implementation.

The shared integrated slots API is intended to supply combat kits and corresponding skill views. Source reuse does not prove every caller renders or saves correctly. Other classes, final balance and ordinary-mode behavior are not redefined by these Arms rules.

## Evidence and remaining acceptance

PR #21's pre-merge checks passed for candidate `f8bc129`, including browser and the portrait rerun; merge commit is `2c2fc62`. That is later evidence than the original stage-1 note requesting browser checks. Do not present that historical request as proof that no browser tests exist.

No tests were run by this documentation update. Preserve targeted acceptance of reload/character switching, ranks, storage failures, own-level boundaries, companion restrictions and all relevant skill views. Final coefficients, cap-60 design, audio, full dungeon acceptance, real devices and live revision require separate evidence. A passing test does not authorize an unrelated merge or publication.
