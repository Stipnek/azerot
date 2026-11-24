# Documentation navigation

Status: initial, incomplete catalog. This is navigation, not a completed source audit or a registry of implemented features.

Review recorded: 2026-11-24. Scope: documentation in `work/docs-release-guide` at commit `f78812b450b8d2f72f8cbf6cfc7411d95e1bfa6e`. Recheck changes after that revision.

## Source-reading guide

[Reading the effective game source](reading-source.md) explains source parts, ordered edits, core inlining, the observed Node-loader input difference, build variants, entry-screen source locations, and save-safety limitations. Its inspected revisions and limitations are recorded on that page. It is not a complete subsystem map.

## How to use this page

- Fully read means the document was retrieved and read in full during this review; it does not mean its claims were verified against current code.
- Located means the file or directory was listed, but its contents were not reviewed in full.
- Document status, implementation status, test results, and deployment status are separate.
- This index does not replace the linked documents or override their requirements.

## Documents read in full

| Topic | Document | Interpretation and limitations |
|---|---|---|
| Development and release | [Development guide](../DEVELOPMENT.md) | The release section was corrected in this branch. Other sections contain earlier agreements and historical status that still require verification. |
| Interface and dungeon design | [Design and implementation status](design.md) | Records decisions and status dated 2026-11-19; not confirmation of current live behavior. Ongoing design work is not modified by this catalog. |
| Quest catalog rules | [Quest catalog introduction](quests/README.md) | Read before individual locations. Contains corrections that withdraw some earlier adaptation proposals. Research is not implemented content. |
| Deadmines loot | [Loot document](loot/deadmines.md) | Describes working-branch integration and provisional item values. Current implementation, acceptance, and publication require separate verification. |
| Core extraction | [Core module contract](core-module-contract.md) | Implementation plan tied to an earlier inspected revision; not proof of a completed module system. |
| Modularization | [Modularization notes](modularization-notes.md) | Advice and risks, not approved or completed restructuring. Verify technical details against current sources. |
| Saved UI checks | [UI redesign CI record](validation/ui-redesign-ci.json) | Records checks for commit `82036a382323eaf08b2852d5ab69341891460eb3`. Its stated scope excludes physical Android and full dungeon-run acceptance. The referenced Actions run was not independently inspected in this review. |

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
