# Own-level specialization transition patch

Base reviewed: b6aec79a83e5f0c643bb9556a0a13e0c6fe9b82e. Test branch only; no publication.

## Implemented scope

In the opt-in integrated preview the selection threshold is 15. Stored specialization intent is separate from the effective below-threshold profile. Synchronizing level no longer overwrites the main's selected path. Selection previews read own XP; event handlers validate own level and identifiers. Existing pet selection timing stays at 10 and is not silently moved with specialization.

Warriors below 15 use the existing prototype training combat profile regardless of their saved Protection/Arms/Fury path. Its training skills, zero talent ranks, absence of specialization passive IDs and absent leader aura are checked. Companion levels are independent. The hero heading uses the runtime profile; full shared skill-window and passive-icon consistency remains an audit item. Original non-integration mode retains its level-10 behavior.

## Explicit limitations

This does not finish neutral training kits, role assignment or class-specific training AI for the other seven classes. Their runtime path still uses the existing starting-profile fallback below 15, which is not proof of compliant passive/role behavior. Do not release the overall progression change or claim their training is implemented. Preservation of stored choices is tested separately from combat acceptance.

Deep Wounds as an Arms passive at 15, the reconciled base Mortal Strike kit, passive scheduling at 30, and full catalogue consistency remain separate audit items. No new unlock proposal, coefficient, cap expansion, seventh ability or pet catalogue is accepted by this patch.

## Verification status

The patch includes regression tests using the actual assembled functions, real character cleaner/save and engine battle creation. Browser rendering, UI click interaction and end-to-end dungeon acceptance are not established by those tests. Record actual CI results against the resulting commit; syntax checks are not a completed regression run.
