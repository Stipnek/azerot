# Computer task: repair and restyle the talent tree

Status: handoff specification only. Creating this file does not start a Computer session. Inspected project baseline: work/player-feedback-fixes at 78575bf663ff61aaf1fb5bafe8a3246501e20973. Pin the actual starting commit before work and use an isolated branch.

## Inputs and preflight

Use the user's previously uploaded talent prototype and graphics folder as the visual reference for a WoW-like tree. Locate and record the exact folder/archive ID and inventory before starting; its ID is not established in this document. Do not substitute unrelated art or claim the input was inspected when it was not. Inspect the current integrated tree, not only a historical prototype.

Return the starting commit, input inventory, owned-file list and any overlapping files before making changes. Coordinate shared files with the core/progression work. Do not start open-ended paid asset searching.

## Work

- Repair broken images and map each talent to the correct available icon. Distinguish broken image loading from the intentional dimming of locked talents.
- Recreate the WoW-like presentation from the supplied prototype: background, talent frames, ranks, row/column structure, dependency links and readable tooltips.
- Show available, locked, learned and max-rank states clearly. Keep rank text readable and links aligned on desktop and phones.
- Preserve current allocation rules, stable talent IDs and existing saves. Validate purchases/resets through existing rules; do not create a second rules implementation in the UI.
- If core allocation rules are unavailable or incorrect, report the exact missing contract or failing fixture rather than silently inventing rules.
- Preserve the current supported class/spec scope. Do not make preview-only branches playable or invent missing talent effects.
- Keep the tree usable without mouse hover on touch devices. Test opening, buying, resetting and reopening without losing the selected tree or dialog state.

## Out of scope

Ability unlock schedules, combat balance, new passive effects, the main character's seventh ability, companion progression, pet mechanics, core extraction and save-schema changes. Do not independently modify these to make the visual task pass. No automatic merge, publication or save reset.

## Deliverables and acceptance

- Changed files and an isolated commit/branch, with asset provenance and usage limitations.
- Desktop/mobile before-and-after screenshots and a map of the inspected talent states.
- Results for actual icon loading, tooltip readability, dependency alignment, allocation/reset/reopen, persistence after reload and standalone/offline asset availability.
- Existing relevant talent and combined-build tests must be run; report failures and untested cases explicitly.
- A reproducible preview built from the reported commit, plus remaining limitations. Screenshots alone are not proof that talent effects execute in combat.
- Hand the result back for integration with the separately tested core/progression work. Publication requires separate approval.
