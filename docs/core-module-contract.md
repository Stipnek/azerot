# Incremental core extraction

Status: implementation plan, not an implemented module system or completed gameplay fix. Inspected baseline: 78575bf663ff61aaf1fb5bafe8a3246501e20973 on work/player-feedback-fixes. Recheck the branch head before implementation.

## Goal and boundaries

Move shared rules into a reusable core incrementally. Keep the standalone HTML build. Do not rewrite the whole game or introduce a dynamic plugin framework in this first step.

- Core owns ability availability and validation. Later extractions may cover talent allocation, combat events and save migration after separate inspection.
- Content supplies stable class/spec/skill IDs, approved unlock schedules and descriptions. Do not silently convert draft schedules into approved balance.
- UI reads core results and submits validated commands; it must not independently calculate unlock levels or talent requirements.
- Assets supply icons, backgrounds and sounds; they do not define gameplay rules.
- Build adapters embed the same core source in standalone HTML and Node tests. Core must not depend on DOM, localStorage, network access or presentation assets.

## First extraction: ability progression

Preserve the existing API: slots(cls, spec, level), active(cls, spec, level), create(rules), configuredProfiles. Preserve availability, validation, fallback behavior and stable IDs during extraction. Moving the code is not approval to alter unlock schedules.

The current implementation is inserted by src/scripts/script-05.ability-progress.edits.json. Extract its factory to a dedicated core source and inject CLASSES and SKILLS explicitly. Both combat and UI must keep consuming the same API.

Inspect and update all relevant consumers together:
- scripts/build_game.py: final HTML assembly.
- scripts/lib_engine_load.cjs: source assembly for Node tests.
- scripts/check_source_edits.py: manifest and JavaScript validation; ensure the resolved core is also checked, not just a syntactically valid placeholder.
- scripts/test_ability_progression.cjs and scripts/test_ability_ui.cjs.
- scripts/test_ability_progression_combat.cjs: isolated synthetic schedules, not production balance.

Reject missing/duplicate module anchors and unresolved build markers. Preserve deterministic source ordering. Keep new code in short reviewable files instead of extending chains of alphabetically named patches. Do not reorder or squash historical manifests without proving equivalent output.

## Acceptance gates

1. Capture baseline results for the exact source commit; never treat unknown or failing checks as green.
2. Compare exported slots, availability, errors and combat behavior before and after extraction with identical fixtures and seeds.
3. Run existing Node regressions, edited-source validation and combined build. Verify standalone output contains the core and no unresolved marker.
4. Run desktop/mobile combined-browser acceptance. Verify old saves without resetting them.
5. Connect final ability schedules only in a separate tested change. Test unlock boundaries, mixed-level parties, 14-to-15 transitions and UI/combat agreement.
6. No merge or publication without separate approval of the exact tested candidate.

## Parallel ownership

Core/progression work must not edit talent layout, talent artwork or Computer-owned presentation files. The talent task must not edit progression schedules, combat rules, the core loader or save schema. Any overlapping file must be identified and coordinated before editing.
