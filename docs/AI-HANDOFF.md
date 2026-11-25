# AI review handoff

Prepared: 2026-11-25. This is a bounded handoff, not a completed audit or a replacement requirements register.

## Goal and scope

Help the owner and another AI understand where code lives, how effective behavior is assembled, why decisions exist, where to fix problems and how to verify them. Finish documentation discovery before proposing file moves, consolidation or removal. Keep open requirements in OPEN-WORK.md rather than creating a competing feature backlog here.

## Recorded checkpoints

- Documentation PR #27 merged as 204f22da1114e75f1723ab04ea9d562ace2f4f63. It added onboarding, corrected release guidance, an initial document index and source-reading guidance. It did not change gameplay.
- Follow-up index relationships were committed on work/docs-release-guide as 16513013d739763ff38305b173ea43fcaf48a64c. That follow-up was not merged at the last main-index check. Recheck current branch and integration status.
- Entry-document follow-up inspected main at 2f4296dcf3fc3c3caf652d192f6aaeecfe873669. This is an inspected checkpoint, not a claim about the latest main. New maps in that checkpoint were not audited.
- This working branch is not guaranteed to include later main changes. Compare before review or integration; do not overwrite newer files.

## Document relationships established by reading

- design-layout-correction.md explicitly corrects the service-menu placement in design.md. Its authority is scoped, not a blanket override.
- design-world-travel.md supplements design.md with world-map hint rules.
- OPEN-WORK.md is the existing handoff and additive requirements register. Open means reconciliation or acceptance remains, not necessarily missing code. Its PR #7 release checkpoint is historical.
- ui-review-register.md and validation records describe bounded historical checks, not acceptance of the entire current game. The layout correction's pending acceptance must be reconciled with later scoped evidence.

## Entry-screen documents: read in full at 2f4296d

Read ENTRY-SCREEN.md, then ENTRY-POLISH.md and ENTRY-ARTWORK.md. The polish document adds focus, transitions and settings-layout work; it is not a full replacement of the initial description.

ENTRY-ARTWORK.md explicitly supersedes the earlier low-resolution artwork description. It identifies image-2.png (852x1846) and image-3.png (1672x941), with pinned Git blob identities. This handoff records the document claims, not a new visual or asset audit. Cropping/safe zones and local-font status require current inspection.

ENTRY-SCREEN.md says the preview is not published by the current Pages workflow. At the inspected checkpoint, .github/workflows/pages.yml instead builds and packages preview/combined.html, checking for the entry overlay and hero flag. Thus preview-only language must not be read as the current release architecture. The separate preview/entry.html is not the packaging input. Workflow configuration does not prove a particular deployment succeeded.

Retain historical context when correcting these notes; do not infer complete save compatibility, browser acceptance or release success.

## What remains unverified

The catalog is incomplete; consult INDEX.md for earlier reading coverage and revisions. Combat/progression documents, remaining quest documents, archived audits and validation records still need systematic reading and reconciliation. The presence of opus-audit.txt and a DOCX archive does not establish review or approval.

There is no completed system-to-source/caller/test map. No conclusion is established about unused files, complete gameplay correctness, save migration safety, current live sourceCommit, physical-device acceptance or complete dungeon acceptance.

No builds, link-check suite, browser tests or deployments were executed for the entry-document reading or this handoff. Historical CI results must not be presented as fresh verification.

## Requested review output

1. Record checked-out revision, working-tree state and any divergence from these checkpoints.
2. Finish document inventory with roles, explicit supersession, inspected revisions and unresolved conflicts.
3. Trace each system to effective sources, applied edits, core, callers and relevant checks. Mark partial coverage.
4. Report confirmed bugs, documentation drift, design questions and unsupported assumptions separately, with file/line evidence.
5. Propose a minimal next documentation patch; do not implement mechanics or restructure files without approval.

An appropriate opening instruction from the owner is: read CLAUDE.md and docs/AI-HANDOFF.md, verify them against this checkout, and perform the initial read-only review.
