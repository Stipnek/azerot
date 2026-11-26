# Entry screen: first polish patch history

> **Status 2026-11-26:** the release workflow publishes the combined build, which includes this entry screen. Statements below that this is preview-only, test-only or unpublished describe their own date. Open items are tracked in [OPEN-WORK](OPEN-WORK.md) (ENTRY-01).

Status: historical implementation record, reconciled 2026-11-24. Use [ENTRY-SCREEN.md](ENTRY-SCREEN.md) for the current build boundary and [ENTRY-ARTWORK.md](ENTRY-ARTWORK.md) for selected assets.

The first patch addressed the Computer review of implementation `4ad1a05` without redesigning game entry or audio persistence:

- Remove automatic focus on Enter while preserving visible keyboard focus.
- Fade loading out and actions in; respect reduced motion.
- Keep the settings header and close control sticky while content scrolls.
- Use light percentage values and hide diagnostic audio paragraphs only inside the entry modal, preserving DOM nodes and listeners.
- Extend checks for short landscape and reduced-motion viewports.

The original notes that this patch retained low-resolution test artwork describe that stage only. Later PNG selection supersedes that artwork status. Likewise, isolated-preview/no-publication wording is not a description of the current combined Pages workflow.

Historical concerns about safe-zone composition, seams/borders and a locally bundled font require reconciliation against current sources and visuals. Do not describe them as confirmed current defects or silently implement changes from this checklist. Syntax checks and calculated contrast do not establish browser or player acceptance.
