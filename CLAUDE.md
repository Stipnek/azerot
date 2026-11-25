# Claude: repository review and fix workflow

## Start here

The owner wants a full, evidence-backed revision of this project, followed by bug fixes. Before anything else record `git branch --show-current`, `git rev-parse HEAD` and `git status --short`, and compare with main. Do not discard existing work.

Read in order:
1. README.md
2. DEVELOPMENT.md, especially the release boundary
3. docs/INDEX.md
4. docs/AI-HANDOFF.md
5. docs/REVIEW-MAP.md
6. docs/OPEN-WORK.md
7. docs/reading-source.md
Then read the design documents, corrections, implementation and tests relevant to the task.

## Roles

Claude owns code and tests. Artwork, visual style and interface design belong to the owner and assistant: do not replace approved art or invent visual direction. Propose design questions instead of guessing.

## Phases

1. Read-only revision. Keep a coverage ledger (commit, system, files and edits read, callers, tests run, findings, open questions). Expand coverage deliberately; targeted search is not proof that unvisited code is safe.
2. Findings report. Separate confirmed bugs, documentation drift, design questions and unsupported assumptions, each with file/line evidence, impact and verification.
3. Fixes. Only after the owner approves the findings. Work on a separate working branch, one problem at a time, with targeted tests. Report commands actually run, failures and skips.
4. Pull request. Prepare the diff for the owner to review.

## Hard limits

Never merge into main and never publish or trigger deployment without the owner's explicit approval of that exact action. Source or script changes on main can trigger release; recheck .github/workflows/pages.yml. Do not change gameplay, save keys or approved artwork without approval. Back up saves before migration tests and use isolated synthetic saves in browser tests; never expose real saves or credentials.

## Evidence rules

Separate requirements, proposals, historical observations, current implementation, executed tests and live deployment. A file name, an aggregate passing check or an open task proves nothing about presence or absence. Record inspected revisions and retrieval limitations; never claim complete reading of truncated content.

Trace base source or all manifest parts, filename-ordered edits, inlined core, callers and build-variant transformations before choosing where to fix. Do not edit generated HTML by default. Keep split-source mirrors and manifests consistent. Do not remove files merely because obvious references are missing; no renaming, patch squashing or architecture cleanup without separate evidence and approval.
