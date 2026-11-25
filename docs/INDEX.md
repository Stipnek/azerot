# Documentation navigation

Status: initial, incomplete catalog. This is navigation, not a completed source audit or a registry of implemented features.

Review recorded: 2026-11-24. Initial catalog scope: `work/docs-release-guide` at `f78812b450b8d2f72f8cbf6cfc7411d95e1bfa6e`. Follow-up reading of OPEN-WORK.md, design-layout-correction.md, design-world-travel.md and ui-review-register.md: `main` at `204f22da1114e75f1723ab04ea9d562ace2f4f63`. Recheck subsequent changes. Earlier coverage is not automatically revalidated by this follow-up.

## Reading order and document relationships

1. Start with [README](../README.md), then the [development guide](../DEVELOPMENT.md) for working and release boundaries.
2. Use [Reading the effective game source](reading-source.md) before tracing implementation. It covers source parts, ordered edits, core inlining, loader differences and build variants; it is not a complete subsystem map.
3. Use [Open work](OPEN-WORK.md) as the existing handoff and requirements register, not a new independent task list. Open means implementation reconciliation or acceptance remains, not necessarily that code is absent.
4. Read the relevant design document and its explicit corrections or supplements before interpreting an implementation.
5. Read review records for their exact revision and scope; then verify current source, tests and acceptance separately.

| Document role | Documents | Relationship and authority |
|---|---|---|
| General design | [Design](design.md) | Baseline decisions and historical status; read with explicit later corrections. |
| Layout correction | [Layout correction](design-layout-correction.md) | Explicitly takes precedence over the earlier placement of the service menu in design.md. Do not generalize this precedence to unrelated requirements. |
| Travel supplement | [World travel hint](design-world-travel.md) | Supplements design.md with hint conditions, accessibility and motion rules; not a replacement for the whole design. |
| Open-work register | [Open work](OPEN-WORK.md) | Consolidates requirements and remaining reconciliation; links supporting records rather than replacing them. Preserve older requirements until individually reconciled. |
| UI review evidence | [UI review register](ui-review-register.md), [saved CI record](validation/ui-redesign-ci.json) | Scoped historical evidence, not a new requirements authority or proof of current live behavior. |
| Build and source guidance | [Development](../DEVELOPMENT.md), [source reading](reading-source.md) | Explain where to inspect and how assembly/release work. Recheck current code and workflow before acting. |

Explicit corrections apply to the subjects they identify. Do not resolve other conflicts solely by filename, timestamp or the order of links here. Record the conflicting statements and reconcile them with explicit decisions and current implementation evidence.

## How to use this page

- Fully read means the document was retrieved and read in full during this review; it does not mean its claims were verified against current code.
- Located means the file or directory was listed, but its contents were not reviewed in full.
- Document status, implementation status, test results, and deployment status are separate.
- This index does not replace the linked documents or override their requirements.

## Documents read in full

| Topic | Document | Interpretation and limitations |
|---|---|---|
| Development and release | [Development guide](../DEVELOPMENT.md) | The release correction was merged through PR #27. Other sections contain earlier agreements and historical status that still require verification. |
| Open requirements | [Open work](OPEN-WORK.md) | Handoff and additive requirements register dated 2026-11-20. Its PR #7 release checkpoint is historical, not the current repository head. Open items require reconciliation, not automatic reimplementation. |
| Interface and dungeon design | [Design and implementation status](design.md) | Records decisions and status dated 2026-11-19; not confirmation of current live behavior. Ongoing design work is not modified by this catalog. |
| Layout correction | [Layout correction](design-layout-correction.md) | Explicit correction to service-menu placement; also describes dungeon preparation and intermission layout. Its pending-acceptance label is historical and must be reconciled with later scoped evidence. |
| World travel | [Travel hint supplement](design-world-travel.md) | Defines when the existing world-map button is highlighted. Reports nine isolated Node cases, not complete browser or deployment acceptance. |
| UI review | [UI review register](ui-review-register.md) | Records scoped local browser checks and unresolved acceptance. Does not establish physical Android acceptance, a full dungeon run, or current deployment. |
| Quest catalog rules | [Quest catalog introduction](quests/README.md) | Read before individual locations. Contains corrections that withdraw some earlier adaptation proposals. Research is not implemented content. |
| Deadmines loot | [Loot document](loot/deadmines.md) | Describes working-branch integration and provisional item values. Current implementation, acceptance, and publication require separate verification. |
| Core extraction | [Core module contract](core-module-contract.md) | Implementation plan tied to an earlier inspected revision; not proof of a completed module system. |
| Modularization | [Modularization notes](modularization-notes.md) | Advice and risks, not approved or completed restructuring. Verify technical details against current sources. |
| Saved UI checks | [UI redesign CI record](validation/ui-redesign-ci.json) | Records checks for commit `82036a382323eaf08b2852d5ab69341891460eb3`. Its stated scope excludes physical Android and full dungeon-run acceptance. The referenced Actions run was not independently inspected in this review. |

## Historical status and reconciliation

- The layout correction's pending-acceptance statement and the UI register's later scoped checks must be read together. Neither establishes complete acceptance of the current game.
- OPEN-WORK.md says Opus materials had not been supplied or reviewed in that session. The follow-up directory listing located `opus-audit.txt` and a DOCX chat/ability archive. Presence does not establish reading, approval or reconciliation; their contents remain unreviewed in this catalog.
- Keep requirements, implementation evidence, executed checks and publication evidence distinct. Do not silently overwrite historical records with present-tense completion claims.

## Quest location documents: located, not yet reviewed

Always read the [quest catalog introduction](quests/README.md) first. Do not infer approval, completeness, or implementation from a location file's presence.

- [Wetlands](quests/wetlands.md)
- [Hillsbrad](quests/hillsbrad.md)
- [Tirisfal](quests/tirisfal.md)
- [Alterac](quests/alterac.md) — present in the directory but absent from the introductory location table at the reviewed revision.
- [Hillsbrad map prompt](quests/hillsbrad-map-prompt.md)
- [Tirisfal map prompt](quests/tirisfal-map-prompt.md)

## Validation records: located, not yet reviewed

These files are saved records, not evidence that the current revision passed checks.

- [Feedback UI source record](validation/feedback-ui-source.json)
- [Rarity source record](validation/rarity-source.json)
- [UI test preview record](validation/ui-test-preview.json)

## Remaining coverage

Other documents in this directory and documents outside it are not yet fully cataloged here. Absence from this page is not a recommendation to ignore or delete a file.

Next steps: read remaining documents in thematic groups; record conflicts and superseding decisions; then build a source map backed by inspected implementation and callers. Do not move or delete source documents merely to tidy this index.
