# Arms hero integration gates — 2026-11-21

## Scope and evidence

The user requested implementation work in the test branch after reviewing the Opus audit. This is not permission to merge or publish. The audit did not pin a source SHA and must not be treated as a current-code execution result.

Implementation under review: de045d320efddd597e1ea08e5b7b80810db66d45. Its regressions failed in workflow run 44969285567; Chromium and original-art checks succeeded. Those successes do not establish browser acceptance of the new hero editor. Do not claim a failure cause until the pinned log is read.

## Required corrections

- Follow combat-training-2026-11-21.md: specialization selection and its primary passive/state and aura start at each character's own level 15, not the existing level-10 switch. No future-specialization bonuses before selection.
- Follow combat-passives-2026-11-21.md: Arms Deep Wounds is a specialization passive at own level 15. Do not gate its entire effect behind a level-20 talent or grant the same passive twice. Numerical talent improvements are not approved by the passive schedule.
- Preserve guaranteed base abilities independently of talents. Treat Mortal Strike as a base-kit integration requirement rather than accepting the prototype's unreachable talent-only grant as final. Its precise base unlock level and the reconciled six-slot kit still require an explicit specification; do not silently invent them in a code patch.
- Ordinary companions must not automatically receive the main character's extra seventh active. The prototype companion line granting Sweeping Strikes is not the final companion policy. Legendary personal sevenths are a separate system.
- Preserve level, XP and character identity during migration. Retain a legacy character's chosen path as stored intent while using the training kit below 15; this migration approach is an integration proposal, not proof of implementation.
- Use the same effective level, kit and ranks in combat, stat previews, the main hero screen and character-details views. The initial hero editor does not complete the other views.
- Keep testing behind the opt-in flag and isolated save namespace. Normal saves, main and live remain untouched by this integration work.

## Unresolved release blockers

The full training-role catalogue and AI, six base-slot membership and detailed active unlocks, the seventh active's final effect, missing mechanics, final coefficients, cap expansion beyond 30 and numerical balance are not approved merely by the instruction to continue engineering. The Opus CSV remains a proposal, not an automatically executable specification.

## Verification before acceptance

Recover the failed run's exact log, fix the observed failure without weakening assertions, and test the actual integrated build. Cover 14/15 and 29/30 for main and companions independently; save/load through the real character cleaner; character switching; invalid ranks and failed storage; no extra active for ordinary companions; aura/passive leakage; consistency of all skill views; and flag-off baseline preservation. Browser acceptance must target the integrated hero preview, not only the isolated prototype. Record tested SHAs and actual results. Publication needs separate approval of the exact tested version.
