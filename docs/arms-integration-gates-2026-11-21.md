# Arms hero integration gates: decisions and history

Reconciled: 2026-11-24. Source checkpoint: `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`. This update changes documentation only; it neither executes tests nor confirms deployment.

## Current reading of the original gates

This record began with implementation `de045d320efddd597e1ea08e5b7b80810db66d45` and failing regressions in workflow run `44969285567`. Chromium and original-art checks succeeded at that historical stage. That failure is not the latest CI result, and its cause is not diagnosed here. The Opus audit did not pin an execution SHA and is not current-code test evidence.

PR #21 subsequently merged as `2c2fc62`, with tested candidate `f8bc129`. Its build, source-and-modules, combined-preview, safe-area, browser and portrait rerun succeeded before merge. This does not establish every gate below, balance, physical-device acceptance or deployment of the merge. See [design status](design.md).

The old test-branch-only statement is historical: the current Pages workflow packages the combined entry/hero build. Runtime flag boundaries and isolated-save tests still matter; they do not by themselves prove production-save compatibility. See [DEVELOPMENT.md](../DEVELOPMENT.md).

## Reconciled requirements

- Own-level 15 remains the specialization boundary in the integrated policy. No future-specialization aura or passive should leak before it. See [training policy](combat-training-2026-11-21.md).
- Deep Wounds is baseline from own level 15 for integrated Arms, not a passive granted only by buying a level-20 talent. The later [temporary rules](arms-stage1-temporary-rules.md) explicitly record a numerical baseline-plus-talent adaptation. The general passive schedule alone did not authorize those numbers.
- The early open question about Mortal Strike and the six-slot Arms kit was resolved for the temporary cap-30 package: Mortal Strike 15, Thunder Clap 5, Rend 9, Cleave 20, Execute 24, Slam 30. This is not an approved six-slot catalogue for every class or final level-60 progression.
- Sweeping Strikes remains the main's separate talent active in that temporary package, not an automatic extra active for ordinary companions. Legendary personal sevenths are a different system.
- Preserve XP, level, identity and stored choices. New-main autoSpec15 behavior is not proof of legacy migration or equivalent companion conversion; see [transition history](spec15-transition-scope.md).
- Combat, stat previews, hero details and catalogues must use consistent effective levels, kits and ranks. Shared APIs and source edits are evidence of engineering, not complete acceptance of every caller.

## Implementation evidence and limits

`src/scripts/script-05.zz-arms-stage1.edits.json` defines the integrated kit, costs, baseline bleed and main-only extra-active distinction. The neutral-training UI manifest enables the newer class-training path for a validated autoSpec15 main at own levels 1..14, not automatically for companions or all old saves. Inspect ordered edits and effective assembled sources before attributing behavior to every actor.

Later implementation does not automatically settle all training roles and AI, all-class active unlocks, missing mechanics, final coefficients, cap expansion beyond the temporary scope or numerical balance. The Opus CSV remains a proposal where no later explicit decision resolves it.

## Acceptance checklist: do not mark complete from this document

- Check 14/15 and 29/30 independently for main and companions.
- Exercise real cleaner/save/load, character switching, invalid ranks and failed storage.
- Check no extra main-only active for ordinary companions and no premature aura/passive leakage.
- Verify combat, previews, skill views and resource labels against the same effective data.
- Verify flag-off baseline behavior and existing-save compatibility separately from seeded isolated saves.
- Inspect the integrated candidate in browser and on target devices; record exact revisions and actual results.
- Confirm the deployed revision separately from merge and CI. New publication requires explicit approval of the exact action.

The historical instruction to recover the failed run must not be used to declare current CI blocked without inspecting the current revision. Preserve the old run as evidence; do not weaken assertions to obtain a passing result.
