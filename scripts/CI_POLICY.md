# Development commit and CI policy

For ongoing work on work/roster-xp-and-updates:

- Submit source changes directly through the connected GitHub integration, with the required user confirmation.
- Do not use write-back workflows as the routine method of changing source files or committing generated reports. GITHUB_TOKEN-generated PR updates can require manual approval of subsequent PR workflows.
- Existing one-off write-back workflows are historical preparation tools; do not modify their trigger files merely to make new source changes. This document does not disable those workflows or change repository security settings.
- Keep build, CSS and browser checks enabled. Prefer CI artifacts for generated reports and previews rather than committing them back to the PR branch.
- Do not add personal tokens, enable automatic approval of untrusted code, or use pull_request_target to execute PR code.
- Merging into main and publishing the game remain separate, explicitly approved actions.

This documentation-only commit also requests fresh PR checks through the connected integration. Verify their actual status; do not assume that earlier approval-required runs were approved or that tests have passed.
