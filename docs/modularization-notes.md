# Modularization notes

Status: advice only. Nothing here is implemented or approved. Do not mix these changes into PR #16; do them in separate PRs after the current work is reviewed.

## Context

The source is split into large script files plus many ordered edits.json patches. script-06 is about 371 KB with dozens of patches, and script-05 is about 283 KB. Patch order depends on file names, so adding a fix means adding another long-suffix file. The earlier risk of drift between script-06.txt and script-06.parts is now guarded by a build check (commit 95d085c).

## Recommended work, in order

1. docs/source-map.md: a table mapping each script file to its game subsystem. Safe, no code change.
2. Move more shared logic into src/core/ one module per PR, only when behavior is unchanged (pattern: commit 1bd84ef). Candidates: inventory, combat, party, training.
3. Move Node tests that read script-06.txt directly to the same source reader the build uses.
4. Split script-05 into parts the way script-06 is split, then migrate tests that read script-05.txt.
5. Clean the repository root (game-1.txt, game-2.txt, QA archives, prototypes, screenshots, reports) in a separate PR.

## Risk: renaming edits.json files

Replacing the long z-suffixes with numeric prefixes (for example 0010, 0020) would make order explicit, but it is not zero-risk. Patch order, source_manifest entries, hashes, CI checks and tests may reference current names. Before any rename:

- prove the applied order is identical;
- compare the built HTML before and after byte for byte;
- run all unit and browser checks;
- do it in its own PR, not together with gameplay changes.

## Unverified claims

- That the original-snapshot check fails because game-1.txt/game-2.txt are outdated is a hypothesis, not confirmed.

## Must not change

The single built preview/index.html format, save compatibility, Russian UI text, and the main branch.
