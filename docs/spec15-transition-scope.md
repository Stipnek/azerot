# Own-level specialization transition: scope and history

Reconciled: 2026-11-24 against source checkpoint `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`. Documentation changes are on `docs/documentation-refresh`, not yet merged.

## Later source evidence

The original patch below reviewed `b6aec79a83e5f0c643bb9556a0a13e0c6fe9b82e`. Its blanket statement that the other seven classes lack training is historical, not a current inventory.

- `scripts/test_neutral_training.cjs` defines registry invariants for all eight classes: three class training actives at own levels 2/5/9, valid training levels 1..14, and a specialization boundary at 15. A test definition is not a fresh execution result.
- The auto-spec15 source manifest persists a validated version-1 roll for newly created integrated-mode heroes. At own level 15 or above, with no choice yet recorded, it chooses once from the class DD specializations and stores the choice. This is not automatic retrofit of every old hero or a new companion policy.
- Related source/test records include neutral-training runtime and UI manifests, `test_auto_spec15.cjs`, `test_neutral_training_runtime.cjs`, `test_neutral_training_ui.cjs` and `test_neutral_training_browser.py`. Inspect effective assembled sources and actual results before claiming acceptance of a specific path.
- The combined Pages build includes hero integration; the original test-branch-only/no-publication wording describes the initial patch, not the current release architecture. See [development guide](../DEVELOPMENT.md). Deployment and live acceptance remain separate evidence.

This reconciliation does not approve a complete six-slot specialization catalogue, coefficients, cap expansion, personal seventh abilities, old-save migration or changes to pet timing. It does not claim the early warrior-only profile and later new-main training path apply to identical populations. No tests were executed for this documentation update.

## Historical patch: implemented scope

Base reviewed: b6aec79a83e5f0c643bb9556a0a13e0c6fe9b82e. Test branch only; no publication at that stage.

In the opt-in integrated preview the selection threshold is 15. Stored specialization intent is separate from the effective below-threshold profile. Synchronizing level no longer overwrites the main's selected path. Selection previews read own XP; event handlers validate own level and identifiers. Existing pet selection timing stays at 10 and is not silently moved with specialization.

Warriors below 15 use the existing prototype training combat profile regardless of their saved Protection/Arms/Fury path. Its training skills, zero talent ranks, absence of specialization passive IDs and absent leader aura are checked. Companion levels are independent. The hero heading uses the runtime profile; full shared skill-window and passive-icon consistency remains an audit item. Original non-integration mode retains its level-10 behavior.

## Historical patch: explicit limitations

At that revision this did not finish neutral training kits, role assignment or class-specific training AI for the other seven classes. Their runtime path still used the existing starting-profile fallback below 15, which was not proof of compliant passive/role behavior. That patch alone did not authorize release of the overall progression change. Preservation of stored choices was tested separately from combat acceptance. Later source evidence is recorded above; do not repeat this paragraph as proof of current absence.

Deep Wounds as an Arms passive at 15, the reconciled base Mortal Strike kit, passive scheduling at 30, and full catalogue consistency were separate audit items. Their current acceptance is not re-established by this documentation update. No new unlock proposal, coefficient, cap expansion, seventh ability or pet catalogue is accepted here.

## Historical verification scope and remaining evidence

The original patch included regression tests using assembled functions, the real character cleaner/save and engine battle creation. Those tests alone did not establish browser rendering, UI click interaction or end-to-end dungeon acceptance. Later tests must be evaluated against their own revisions and scopes. Record actual results, not only test filenames; retain invalid-input, flag-off, own-level and save/load boundaries.
