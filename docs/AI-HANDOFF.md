# AI review handoff

> **Status 2026-11-26:** the current coverage, findings and checkpoints are in [REVIEW-LEDGER.md](REVIEW-LEDGER.md); requirements in [OPEN-WORK.md](OPEN-WORK.md). The checkpoints below are historical. Documents named here as unread have since been read (see the ledger); historical audits moved to [archive/](archive/).

## Current handoff (2026-11-28; main `fd0203b`, live after the Publish run)

Released 2026-11-27/28: warrior Classic talents + spec selector with the WotLK switch sound (#33), Last Stand rework and one Deadmines rest (#34), the owner's bug-hunt fixes (#35: casters keep range, whole-fight effects shown, worn gear visible, no talent stub, visible approach). Bug list still open: [bug-hunt-2026-11-28.md](bug-hunt-2026-11-28.md) (sections 2–4).

**Owner direction 2026-11-28 (answers to the bug-hunt questions):**
1. **Remove the training kits; abilities exactly like WoW Classic trainers.** Every class learns its Classic trainer abilities by own level (same for all specs), learned abilities are never lost (nothing is lost at 15); the spec gives the role and the talent tree; ability talents only through talents (done for the warrior). No limit on the number of abilities (auto-battle AI chooses). Restoration druid keeps Wrath, hunters keep Serpent Sting, etc. Deviations from Classic only where our format needs them, labelled «адаптация».
2. **Spec passives come from talents, as in Classic** (Thick Hide, Deep Wounds…); companions get them when their talent line reaches that row.
3. **Bear: Growl with bear form** (Classic), not at 23.
4. Covered by 1 (Wrath stays for Restoration).
5. **Hunter pets like warlock demons** by own level: Turtle 10 (tanks solo), Cat 20, Wolf 30, Owl 40 ([pets](combat-pets-2026-11-21.md), PET-01); no pet before 10 as in Classic. First re-measure hunter 1–9 without a pet *with* the PLAY-19 approach turn before adding any compensation.
6. **Warlock 1–9 too easy after the imp change: nerf** (HP and similar) to the BAL-04/05 target (two enemies ≈ half HP).
7. **Vendor all icons into the build** (no runtime Wowhead/hearthstonejson loads), like `src/assets/talents/`.
8. **Architecture proposal approved** ([proposal](architecture-proposal-2026-11-28.md)), after stabilisation.

**Owner complaint:** new player play keeps hitting bugs. Agreed process: feature freeze (steps 4–6 gathering, Loch Modan, class preview wait); before every release a gate: `test_class_rules.cjs` (no new violations, known list only shrinks) + a new browser test «new player path» (create each class from a fresh save, first fights, hero/equipment/talents/party tabs); short «what to look at» report per release.

**Plan in order:** (1) the new-player-path gate; (2) obvious bugs from the report: Holy Shield never cast (P1), Whirlwind once per fight (W1), stuns lasting one turn less (W2/W3), Shield Wall text (W4), Assassination without finishers (R1), bear staff auto (D1), stale texts (W6–W8, 3.6); (3) vendored icons and the warlock nerf; (4) design doc «Classic trainer abilities to level 30 per class» for owner approval (lists, AI changes, what replaces training kits and spec passives); (5) after approval, rebuild class by class (warrior first) with hunter pets and Growl.

Local browser tests: Python Playwright 1.63.0 matches the preinstalled Chromium.

## Previous handoff (2026-11-27 late)

Step 3 (TALENT-03 + TALENT-01, warrior) on the branch, details in OPEN-WORK: COMBAT-02 shield-block fix; Classic talents for Arms/Fury/Protection with 3-point tiers (`B.specTalents` for Fury/Protection, `B.armsIntegrated` for Arms); ability talents only through talents (companions take them on their line); kits refilled with trainer abilities; per-spec saves (`armsTalents`, new `specTalents[spec]`); all three trees live in the talent window (TALENT-04 tree id fix). Simulators give mains the companion line as build; evidence in `docs/evidence/talent-03/`.
Spec selector (mock-up A, owner-approved): one selector in the hero tab (small spec icon, role, points, talents button for classes with the talent window) and the party tab (spec only); switch = 5 s cancellable cast with a bar, out of combat only; the owner-supplied WotLK sound `UI_DualTalentSpecilization` plays on completion (`scripts/build_spec_sound.py`). Wetlands map lost the leftover placeholder frame and label. Last Stand reworked by the owner: automatic immortality on a lethal hit until the next own turn, once per fight / per dungeon run (duos at 24–30 still above the BAL-06 target: follow-up). Next: other classes' trees (TALENT-03), then steps 4–6 (gathering PLAY-14, Loch Modan PLAY-15 research, class preview PLAY-07) and quest loot.
Local browser tests need Python Playwright 1.63.0 (matches the preinstalled Chromium 1243), not the 1.56.0 pinned in pages.yml.

## Earlier handoff (2026-11-27 night)

Done on the branch (each a commit, details in OPEN-WORK): step 1 UI/text fixes PLAY-05, 06, 08, 09, 10, 13, 16, 17 + PARTY-02; step 2 PLAY-11/12 (Classic level-1 abilities, trainer levels, training damage shape, level-1 solo curve); PLAY-18 Classic starter set (new save field `starterKit`); PLAY-19 approach turn + Classic wards for casters. New tools: `scripts/sim_early.cjs`; tests `test_quest_text_counts.cjs`, `test_early_classic.cjs`, `test_caster_range.cjs`, `test_starter_kit_browser.py` (the browser test is not in pages.yml yet). Nothing published; merge to main only with the owner's «да».

Checks at `30fb5d7` (2026-11-27): source edits, all `scripts/test_*.cjs`, coin test and every browser test of `pages.yml` plus equipment, party picker, starter kit, hero layout, talent window, world map saves pass locally (Chromium, synthetic saves). Test fixtures that check exact bag contents need `starterKit: 1` (otherwise the starter set is added). Owner is play-testing the live build meanwhile; branch changes are not live.

Next: step 3 TALENT-03, owner chose real Classic effects tree by tree, warrior first. Code facts: only Arms is live (`B.armsIntegrated`, save `hero.armsTalents`, tiers 5×(t−1) in `armsValidate`, points level−9 from 15, Mortal Strike is `baseline: 15` in `src/talents/warrior.json` and `mortal@15` in the integrated base kit). Fury/Protection nodes in the JSON have no engine effects; their kits still give Bloodthirst, Death Wish, Shield Slam for free. Plan: (1) compressed tiers 3×(t−1) while the cap is 30 (tier 7 at 18 points = level 27) for Arms, Mortal Strike only via the talent, companions' line reaches it automatically, refill the Arms kit with a trainer ability; (2) a generic per-spec talent store and validation (new save field per spec, keep `armsTalents`); (3) Fury then Protection effects, kits without talent abilities, AI; (4) rerun `sim_campaign.cjs` and `sim_class_audit.cjs`. Then steps 4–6 (gathering PLAY-14, Loch Modan PLAY-15, class preview PLAY-07) and quest loot (owner).

## Previous handoff (2026-11-27 evening)

Released today (owner approved each publish): BAL-05/06 (solo rule at every level, group quests need three, size-5 quests need five), Deadmines ×1.15, QUEST-07 (quest card only, short retellings), developer notes removed, ability unlock schedule to 30 (two core abilities from 1, the rest 15–30), Shadowform at 30 (KEY_TALENT_LEVEL), Classic order for Bear / Protection paladin / Shadow, Classic class tools (Protection paladin Righteous Fury + holy damage back, Holy paladin Seal of Righteousness, Arcane Mana Shield), Tactical Mastery and Anger Management learnable, desktop quest journal fix, the Classic talent window (`scripts/build_talent_window.py`, data in `src/talents/`, art in `src/assets/talents/`), Crusader Strike → Seal of Righteousness and Steady Shot → Concussive Shot (ids kept). Issues #24, #22, #13, #12 closed.

Tools: `scripts/sim_campaign.cjs` (feel, campaign, group with `--calibrate`, Deadmines), `scripts/sim_class_audit.cjs` (every spec in its role at 15/20/25/30).

Next session (owner, TALENT-03, decision B): talent trees for all 25 specs in the talent window; abilities that were Classic talents only through talents (22 listed in [talent-abilities-audit](talent-abilities-audit-2026-11-27.md)), companions take ability talents automatically; compressed tiers while the cap is 30 (e.g. 3 points per tier, back to 5 at the 60 cap); kits refilled with Classic trainer abilities; Mortal Strike is a stop-gap «learned at 15» in the window until then; rebalance with both simulators. Open: rename «Таланты и дополнительные сведения» (talents moved out), Holy paladin solo and Protection paladin tank at 30 still weak (BAL-07), issues #23 and #3 closed 2026-11-27 (Shadowform portrait idea → OPEN-WORK UI-10).

Prepared: 2026-11-25. Bounded handoff, not a completed audit or a replacement requirements register.

## Goal

Help the owner and another AI understand where code lives, how effective behavior is assembled, why decisions exist, where to fix problems and how to verify them. Finish documentation discovery before proposing moves, merges or removals of files. Open requirements stay in docs/OPEN-WORK.md. For a targeted source and test index see docs/REVIEW-MAP.md.

## Recorded checkpoints

- PR #27 merged to main as 204f22da1114e75f1723ab04ea9d562ace2f4f63: onboarding, corrected release guidance, initial index and source-reading guide. No gameplay change.
- Index relationships committed on work/docs-release-guide as 16513013d739763ff38305b173ea43fcaf48a64c; AI entry files at 2acb455044f6b8135a3b882b4ada5973b7deb5ca; review map at 222d96346f2024dc5c3ec6b2aabf4d5075d7c855. These may not be merged into main; recheck.
- main was inspected at 2f4296dcf3fc3c3caf652d192f6aaeecfe873669 (entry documents) and 9938f081b7d6ac15705b27dd0893f9218653cb0a on 2026-11-25. It has moved on from this working branch; compare before use and never overwrite newer files.
- At 9938f08 scripts/lib_engine_load.cjs delegates world-map core inlining to Python via scripts/core_sources.py. Earlier descriptions covering only the ability-progression marker are incomplete.

## Document relationships established by reading

- design-layout-correction.md explicitly corrects the service-menu placement in design.md; the correction is scoped.
- design-world-travel.md supplements design.md with world-map hint rules.
- OPEN-WORK.md is the existing requirements register. Open means reconciliation or acceptance remains. Its PR #7 checkpoint is historical.
- ui-review-register.md and validation records are bounded historical checks, not acceptance of the current game.
- ENTRY-ARTWORK.md supersedes the low-resolution artwork description in ENTRY-SCREEN.md; ENTRY-POLISH.md adds a later polish step.
- ENTRY-SCREEN.md says the preview is not published. The inspected workflow packages preview/combined.html with the entry overlay and hero flag, so preview-only language is historical. Workflow configuration does not prove a particular deployment succeeded.

## Not yet verified

Combat and progression documents, remaining quest documents, archived audits (opus-audit.txt and the DOCX archive; presence is not review) and validation records are unread. There is no completed system-to-function map, no test-assertion review, and no conclusion about unused files, save migration safety, live sourceCommit, physical-device acceptance or complete dungeon runs. No builds, link checks, browser tests or deployments were executed for these handoff files.

## Requested output

1. Revision, working tree state and divergence from these checkpoints.
2. Document inventory with roles, supersession and unresolved conflicts.
3. Systems traced to sources, applied edits, core, callers and tests, with partial coverage marked.
4. Findings by category with file/line evidence.
5. A fix plan awaiting the owner's approval.
