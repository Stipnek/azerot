# Claude: repository review entry point

## Start here

The owner wants an evidence-backed review of this project, not an automatic rewrite. First record `git branch --show-current`, `git rev-parse HEAD` and `git status --short`. Do not discard existing work. This file does not authorize gameplay changes, commits, pushes, merges or deployment.

Read in order:
1. README.md
2. DEVELOPMENT.md, especially the release boundary
3. docs/INDEX.md
4. docs/AI-HANDOFF.md
5. docs/OPEN-WORK.md
6. docs/reading-source.md
Then read the relevant design documents, corrections, implementation and tests. Read any more specific repository instructions before editing their scope.

## Evidence rules

Separate requirements, proposals, historical observations, current implementation, executed tests and live deployment. A file name, a passing aggregate check or an open task does not prove a feature is present or absent. Record the inspected revision and retrieval limitations. Never claim complete reading of truncated content.

Trace base source or all manifest parts, filename-ordered edits, inlined core, callers and build-variant transformations before choosing where to fix behavior. Do not default to editing generated HTML. Preserve source mirrors and manifest integrity. Consult the actual builders before running or changing assembly.

Preserve stable save identifiers, approved artwork and existing requirements. Do not remove files merely because obvious references are missing. No bulk renaming, patch squashing, migrations or architecture cleanup without separate evidence and approval.

## Initial assignment

Begin with a read-only review. Verify the handoff against the checked-out revision, finish the document catalog, then map systems to owning sources, ordered edits, callers and relevant tests. Report confirmed findings separately from hypotheses and proposals. Include file/line evidence, impact, verification and remaining uncertainty. Do not treat this handoff as proof the audit is finished.

Before running checks, inspect their prerequisites, network use, generated outputs and save handling. Use isolated synthetic saves for browser tests; do not expose real saves or credentials. Report commands actually run, failures and skips.

Source or script changes on main can trigger release. Recheck .github/workflows/pages.yml; merge and publication need explicit owner approval.
