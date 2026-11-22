# Temporary integrated Arms rules — cap 30

Reviewed baseline: 567ce1b2cdd465df7be7c3836535f7c797098dbe. Test branch/build only. This is not a level-60 progression, accepted numerical balance or publication approval.

The owner accepted the temporary direction after the proposed package: training Heroic Strike 2, Thunder Clap 5, Rend 9; at 15 Mortal Strike replaces Heroic Strike; Cleave 20, Execute 24, Slam 30. Thus six base actives at 30, preserving the existing five Arms base abilities plus Thunder Clap. Sweeping Strikes is the main's separate talent active; ordinary companions do not receive it. The retired Mortal Strike talent does not grant a second copy.

The stable ihs rank key is retained but shown and applied as Improved Mortal Strike: rage reduction 1/2/3. Deep Wounds is baseline from own level 15: 20% attack total over four ticks. Its retained deepwounds talent key now increases that baseline by 20/40/60% (totals 24/28/32%), not another grant. This is an explicit temporary adaptation, not the old prototype coefficient table. The existing eligible weapon-event filter and noncritical periodic rule remain; ordinary onCrit is not also granted for these actors.

Only descriptors with integratedArms:true use these rules. The historical armsProto preview remains a comparison baseline and is not rebalanced. Ordinary flag-off gameplay and ordinary saves remain outside this opt-in integration. Existing character rank keys are preserved; affected talent labels explain the changed temporary semantics. Bad allocations still use validated reset behavior, not partial grants.

The shared integrated slots API supplies combat kits and the warrior training/Arms renderer used by the hero, details and catalogue callers. Battle passive lists and resource labels use the same effective integrated data. Other specializations and other classes are outside this change.

The patch adds engine and shared-renderer regressions. A passing historical Chromium/original-art job is not browser acceptance of the integrated hero page. Stage 1 is not complete until the integrated page itself has browser checks, reload/character-switch checks and recorded CI results for the exact resulting commit. Cap-60 design, final coefficients, audio and full dungeon acceptance remain later work. Do not merge or publish merely because these tests pass.
