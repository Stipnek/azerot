# Documentation index

Updated: 2026-11-24. Source checkpoint: `2c2fc62a4d6ebddaf8ac846f399a56fe3d1ee156`.

## Start here

- [Design and implementation status](design.md): project decisions and the latest reconciled checkpoint.
- [Development guide](../DEVELOPMENT.md): source builds, release boundary and evidence rules.
- [Open work](OPEN-WORK.md): requirements register; historical pending labels require reconciliation, not automatic implementation.
- [Entry screen](ENTRY-SCREEN.md), [artwork](ENTRY-ARTWORK.md), [polish history](ENTRY-POLISH.md).

## Specialist records

- Interface: [layout](design-layout-correction.md), [world travel](design-world-travel.md), [review register](ui-review-register.md).
- Talents: [integration gates](arms-integration-gates-2026-11-21.md), [temporary rules](arms-stage1-temporary-rules.md), [level-15 transition](spec15-transition-scope.md).
- Content: [quests](quests/README.md), [Deadmines loot](loot/deadmines.md).
- Historical evidence: [chat audit](CHAT-AUDIT.md), dated combat/prototype documents and validation records.

## Status vocabulary

Keep separate: proposed; approved design; implemented at a revision; tested with scope; merged; deployed at a revision; accepted by the player. A passing check or a merged PR does not prove live or real-device acceptance.

PR #21 merged as `2c2fc62`. PR #11 was closed after its exact head `e2ae13a` was found in main history; no branch-only commits needed recovery. Issue #22 tracks entry-documentation reconciliation. This document does not confirm the deployment of that merge.

## Remaining documentation audit

This is a first reconciliation package, not a claim that every document has been audited. Preserve `OPEN-WORK.md` requirement IDs and historical decisions until individually checked. Next reconcile its old release checkpoint and pending labels against current sources and evidence; review dated combat, progression, quest and UI records by subsystem. Do not turn old proposals into approved mechanics.

## Repository organization

Use one issue for a bounded task and a reviewable branch from current main. Record the source checkpoint, acceptance criteria and links to relevant design sections. Before recovering an old branch, check ancestry and then inspect any unique changes. Keep archival material identifiable and linked; do not delete branches, artwork or source files as part of documentation cleanup. Repository-wide renaming, labels, milestones and deletions require a separately reviewed plan.
