# Progression and balance: reading notes

Status: reading notes from documents retrieved 2026-11-25 from branch work/docs-index-combat (created from main). Not a specification and not verification of code. Each statement below restates a document; check it against current source before relying on it.

## Precedence chains established by the documents

| Subject | Earlier statement | Later statement that governs it | Note |
|---|---|---|---|
| Voidwalker unlock | combat-decisions: level 9 | combat-pets: level 10; the pets document says it supersedes the old level 9 | Unlocks use each owner's own level. |
| Warlock pets | combat-decisions: Imp 1 working proposal | combat-pets: Imp 1, Voidwalker 10, Succubus 20, Felhunter 30 | No Felguard. |
| Hunter pets | combat-decisions: first pet at 10 working proposal | combat-pets: Turtle 10, Cat 20, Wolf 30, Owl 40, automatic by level, no taming | Project adaptation, not Classic levels. |
| Beast Mastery kit | combat-decisions: Bestial Wrath at 40, superseding an earlier 54 | combat-bm: Multi-Shot as sixth base ability at 54, replacing the Hunter's Mark candidate | Consolidated target kit: 15 Arcane Shot, Scorpid Sting, Intimidation; 22 Mend Pet; 40 Bestial Wrath; 54 Multi-Shot. Not every unlock level is finalized. |
| Warrior Arms rules | prototype-arms: talent tree, Mortal Strike only from a talent, Deep Wounds as a talent | arms-stage1-temporary-rules (cap 30, test build): training Heroic Strike 2, Thunder Clap 5, Rend 9; at 15 Mortal Strike replaces Heroic Strike; Cleave 20, Execute 24, Slam 30; Deep Wounds baseline from 15 | Applies to descriptors with integratedArms true only. The prototype stays a comparison baseline. Sweeping Strikes is the main character's separate talent active. |
| Hero integration | arms-integration-gates: required corrections before accepting the integrated hero | spec15-transition-scope: opt-in preview patch at threshold 15 | Gates refer to an earlier implementation commit and a failed run whose log was not read there. |
| Specialization level | existing code: level 10 | combat-decisions, combat-training, spec15 patch: own level 15 in the integrated opt-in preview | The original non-integration mode keeps level 10 per the transition document. |

## Enemy curve (documents dated 2026-11-23, Russian)

The report describes a shared enemy-strength curve replacing a temporary weakening of five quests. It states the formula and parameters (ENEMY_CURVE full 15, hp 0.45, atk 0.40, pow 2), the affected fights (enemy level below 15) and simulation results on 200 fixed seeds per class and fight. It records a branch work/enemy-curve based on work/first-quests-balance, with draft pull requests 16 and 18 at that time. Those statuses, and the main head 9f96edc it cites, are historical.

The report itself lists unresolved issues: solo mages with fire or arcane specializations at levels 15 to 17 and one level 24 fight remain weak because the curve does not act from level 15; a few early fights remain below 95 percent; early fights became easy; five level-shift keys in PR 18 are misspelled and do not apply, and the report recommends deciding whether the shift is needed at all. It also lists unverified areas: browser tests, equipment and tavern bonuses, other races and companions, dungeon runs with carried health. These are the report's statements at its date, not current results.

The branch tree listing contains script-05.zzzzzz-enemy-curve.edits.json, script-05.zzzzz-first-quests-level-shift.edits.json and a script-06 enemy-curve-summary manifest, so the changes appear to be present. Whether the current behavior matches the report, and whether the level-shift keys were corrected, is not verified. The simulation table document was retrieved only partially (output truncated within the ambush rows); treat it as partly read.

## Source edit chain (directory listing, names only)

src/scripts contains whole sources script-01 to script-05 and script-07 to script-17, a script-06.parts directory, and roughly 90 *.edits.json manifests. Eight are for script-05, about sixty for script-06, and the rest for script-10, script-11, script-16 and script-17. Manifests are applied in sorted filename order, and the names encode order through repeated z characters and suffixes. Do not rename, reorder or squash them; see docs/reading-source.md. Contents of these manifests were not read in this pass, so the listing shows file names only and says nothing about what each edit changes. Test the effective result by running the builder rather than inferring it from names.

## Not verified here

No code, build or test was run. Unlock tables, coefficients and curve parameters were not compared with source. Whether any addendum is implemented in the current build is unknown. Read the relevant edit manifests and tests before treating a rule as live behavior.
