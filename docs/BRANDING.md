# Pocket Azeroth branding

The canonical application name is Pocket Azeroth in both English and Russian. Poket WoW and Pocket Azeroth are not separate editions; Poket WoW was an abandoned naming proposal.

## Scope of this patch

- Rename the production loader title and loading message.
- Rename the source HTML title and the character creation/selection brand labels.
- Rename the runtime document title while preserving the displayed build version.
- Update the README and add a Chromium startup check at desktop and mobile viewport sizes.

## Compatibility boundaries

Keep the existing repository and site address, localStorage keys, internal identifiers, source markers, asset hashes and the approved lion artwork unchanged. Do not rename Azeroth / Азерот when it refers to the fictional world, including the heading Приключения в Азероте.

Historical documentation, archived QA evidence, prototype snapshots and frozen game parts may retain the former project name. They are not rewritten as if earlier tests had used the new name. This patch does not claim an exhaustive historical-documentation rename.

English/Russian localization is a separate follow-up. This rename does not translate gameplay, enable integration flags, change mechanics, or migrate saves. It does not establish trademark availability or a license to third-party content.

## Verification and release

The Pocket Azeroth branding workflow builds from current sources, checks the loader, source title, brand labels and runtime title, and captures startup screenshots in Chromium. Results are pending until that workflow succeeds. It does not validate combat, all UI screens, real devices or Safari.

Do not publish or merge this branch without separate approval. A later merge into main can trigger the existing automatic Pages release workflow.
