# Interrupt timing and feedback — 2026-11-21

## Status

User-approved design addendum to [Combat decisions](combat-decisions-2026-11-21.md). Documentation only: no implementation, tests, balance verification, or publication is claimed or authorized by this commit.

## Accepted timing policy

- Show preparation of dangerous enemy spells, including whether the spell is interruptible.
- Use the normal speed-dependent action order. Do not insert a guaranteed allied reaction turn, free interrupt, or artificial delay solely to ensure that the party can stop the spell.
- A slower character may act too late. A completed spell cannot be interrupted retroactively.
- Losing because the current party cannot stop or survive a spell is an acceptable progression challenge, not automatically a defect. Leveling, speed, composition, survivability, and future build choices may provide solutions; not every current build must win every encounter.
- Feedback must explain events. A visible warning communicates danger, not a promise of an available response before completion.

## Classic reference and adaptation boundaries

Preserve separate mechanics: an interrupt stops eligible current casting and may lock the interrupted school; silence restricts spellcasting; stun restricts actions. Check spell interruptibility, school lockout, silence immunity, and stun immunity separately. Do not make immunity to one imply immunity to all.

Speed-dependent action opportunities are an autobattler adaptation, not a claim that Classic Kick or Counterspell has a cast time. Do not silently convert Classic seconds into turns. Per-ability duration, costs, cooldowns, hit rules, and boss exceptions require review.

A successful interrupt does not automatically stun the enemy or prohibit all other schools and future attacks. A pure interrupt must not be spent against an already completed cast. Abilities with additional damage or control need their own usage conditions. Allied AI must recheck the target after another ally interrupts it, rather than waste multiple pure interrupts on the same cancelled cast.

## Builds and talents

Additional silence or stun may be a future build option, not a newly approved ability or an automatic extra active slot. A second control button does not by itself solve late initiative: it may help through preventive control, cooldown coverage, or another target if the ability and immunity rules allow. Do not grant a free action or ignore speed to make that talent work.

## Player-facing feedback

Provide distinct, readable reasons using the actual event and eligibility checks. Russian wording below is a draft, not a claim of verbatim Classic text:

- Заклинание завершилось раньше действия персонажа.
- Прерывание недоступно: перезарядка.
- Недостаточно ресурса.
- Цель невосприимчива к немоте.
- Цель невосприимчива к оглушению.
- Это заклинание нельзя прервать.
- Заклинание прервано.

Do not claim an attempted cast or spend resources merely to explain an action that AI correctly skipped. Presentation frequency and aggregation require UI review.

## Still open and required verification

Exact preparation timing, tie-breaking, channel tick/action/resource rules, individual control kits and AI priorities, numerical school-lockout durations, and encounter-specific immunities remain open. No guaranteed reaction window is approved for any of these unresolved details.

Test faster and slower interrupters, completed casts, simultaneous allied candidates, cooldown/resource restrictions, separate immunities, and accurate feedback. Verify that failure from insufficient speed remains possible and that no retrospective cancellation or wasted duplicate pure interrupt occurs. Tests have not been run by this documentation change.
