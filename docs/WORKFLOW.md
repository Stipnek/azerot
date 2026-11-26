# How we work

Practical rules for the owner, Claude and other AI helpers (e.g. Perplexity). Short on purpose. Hard limits for AI assistants are in [CLAUDE.md](../CLAUDE.md); release mechanics in [DEVELOPMENT.md](../DEVELOPMENT.md).

## Roles

- **Owner**: decides game design, art, priorities; plays and accepts; approves every merge to main.
- **Claude (lead engineer)**: keeps the register and docs honest, reviews every PR, takes larger or risky changes, investigates bugs.
- **Other AI helpers**: small, well-scoped tasks from the register, each on its own branch, always through a PR that Claude reviews.

## The loop for every change

1. **Pick one item** from [OPEN-WORK.md](OPEN-WORK.md). If it has no ID, add it first. If it needs a decision, the owner decides before code.
2. **Branch from current main**: `fix/<topic>`, `feat/<topic>`, `docs/<topic>`, `chore/<topic>`. One item per branch. Never two agents on one branch at the same time.
3. **Change the owning source layer**: base script/parts, a new ordered `*.edits.json`, or `src/core/`. Never edit generated HTML. New edits anchor to the code as it looks after all earlier edits in filename order (`scripts/check_source_edits.py` tells you).
4. **Run local checks before pushing**:
   ```sh
   python3 scripts/check_source_edits.py
   for t in scripts/test_*.cjs; do node "$t" || echo "FAIL $t"; done
   python3 scripts/build_combined_preview.py
   ```
   Add or update a targeted test for the behaviour you changed.
5. **Open a PR to main** with: what and why, the register ID, commands run with results, what was not tested, screenshots for UI.
6. **CI must be green.** Do not skip, disable or weaken tests to get green.
7. **Review**: Claude reviews helper PRs; the owner reviews anything that changes gameplay, art or saves.
8. **Merge = release.** A merge of `src/**`, `scripts/**`, `index.html` or `pages.yml` to main publishes the game automatically. Merge only with the owner's explicit OK, then play the released build and mark the register item.

## Commit and PR hygiene

- Small commits with clear messages: `fix: …`, `feat: …`, `test: …`, `docs: …`, `chore: …`, `ci: …`.
- Keep gameplay, art, docs and CI changes in separate PRs when possible; docs-only and CI-only PRs do not trigger a release.
- Delete the branch after merge. Long-lived branches drift and break (PR #26 failed because main moved under it).
- Do not commit build outputs (`preview/`, `_site/`, `test-results/` are ignored), large reports or screenshots; attach them to the PR or keep them as CI artifacts.

## Game-development practices we follow

- **Decide, then build.** Mechanics, numbers and art direction are owner decisions recorded in a design doc; code follows the doc.
- **Measure balance.** Change balance numbers only with a simulation or play-test result before and after; record it in the PR. If the simulator disagrees with real play, fix the simulator first.
- **Protect saves.** Never rename save keys or stable IDs. Any change to saved data needs a migration and a test with an old save. Back up real saves before testing; tests use isolated synthetic saves.
- **Play the release.** Every release ends with the owner playing the changed part on the real site (phone and desktop when relevant).
- **Keep one source of truth.** Requirements in OPEN-WORK, decisions in design docs, history in `docs/archive/` and git. No parallel task lists in chats.

## Brief template for an AI helper task

```
Repository: Stipnek/azerot, branch from main as <type>/<topic>.
Task: <register ID and one-paragraph goal>.
Read first: CLAUDE.md, docs/WORKFLOW.md, <specific docs and source files>.
Do not change: save keys, approved art, unrelated gameplay, workflows.
Done when: <observable behaviour>, local checks pass (list above), targeted test added, PR opened with results.
```
