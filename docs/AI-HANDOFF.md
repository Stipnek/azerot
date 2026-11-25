# AI review handoff

Prepared: 2026-11-25. Bounded handoff, not a completed audit or a replacement requirements register.

## Goal

Help the owner and another AI understand where code lives, how effective behavior is assembled, why decisions exist, where to fix problems and how to verify them. Finish documentation discovery before proposing moves, merges or removals of files. Open requirements stay in docs/OPEN-WORK.md. For a targeted source and test index see docs/REVIEW-MAP.md.

## Recorded checkpoints

- PR #27 merged to main as 204f22da1114e75f1723ab04ea9d562ace2f4f63: onboarding, corrected release guidance, initial index and source-reading guide. No gameplay change.
- Index relationships committed on work/docs-release-guide as 16513013d739763ff38305b173ea43fcaf48a64c; AI entry files at 2acb455044f6b8135a3b882b4ada5973b7deb5ca; review map at 222d96346f2024dc5c3ec6b2aabf4d5075d7c855. These may not be merged into main; recheck.
- main was inspected at 2f4296dcf3fc3c3caf652d192f6aaeecfe873669 (entry documents) and 9938f081b7d6ac15705b27dd0893f9218653cb0a on 2026-11-25. It has moved on from this working branch; compare before use and never overwrite newer files.
- At 9938f08 scripts/lib_engine_load.cjs delegates world-map core inlining to Python via scripts/core_sources.py. Earlier descriptions covering only the ability-progression marker are incomplete.

## Document relationships established by reading

- design-layout-correction.md explicitly corrects the service-menu placement in design.md; the correction is scoped.
- design-world-travel.md supplements design.md with world-map hint rules.
- OPEN-WORK.md is the existing requirements register. Open means reconciliation or acceptance remains. Its PR #7 checkpoint is historical.
- ui-review-register.md and validation records are bounded historical checks, not acceptance of the current game.
- ENTRY-ARTWORK.md supersedes the low-resolution artwork description in ENTRY-SCREEN.md; ENTRY-POLISH.md adds a later polish step.
- ENTRY-SCREEN.md says the preview is not published. The inspected workflow packages preview/combined.html with the entry overlay and hero flag, so preview-only language is historical. Workflow configuration does not prove a particular deployment succeeded.

## Not yet verified

Combat and progression documents, remaining quest documents, archived audits (opus-audit.txt and the DOCX archive; presence is not review) and validation records are unread. There is no completed system-to-function map, no test-assertion review, and no conclusion about unused files, save migration safety, live sourceCommit, physical-device acceptance or complete dungeon runs. No builds, link checks, browser tests or deployments were executed for these handoff files.

## Requested output

1. Revision, working tree state and divergence from these checkpoints.
2. Document inventory with roles, supersession and unresolved conflicts.
3. Systems traced to sources, applied edits, core, callers and tests, with partial coverage marked.
4. Findings by category with file/line evidence.
5. A fix plan awaiting the owner's approval.
