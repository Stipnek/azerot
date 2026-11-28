'use strict';
// Class rules: documented and in-game consistency rules checked for every class, specialization and role on the effective
// engine (base + ordered edits + core). Rules come from docs/OPEN-WORK.md, docs/combat-*.md and the 2026-11-28 bug hunt
// (docs/bug-hunt-2026-11-28.md). Known violations are listed in scripts/fixtures/class-rules-known.json with the report id;
// the test fails on any NEW violation and also when a listed one no longer occurs (remove it from the list after a fix).
// Run: node scripts/test_class_rules.cjs [--n 16] [--list]   (--list prints every violation with its message)
const fs = require('node:fs');
const path = require('node:path');
const P = require('./lib_class_probe.cjs');
const { B } = P;
const args = process.argv.slice(2);
const N = args.includes('--n') ? +args[args.indexOf('--n') + 1] : 16;
const KNOWN_FILE = path.join(__dirname, 'fixtures', 'class-rules-known.json');
const known = JSON.parse(fs.readFileSync(KNOWN_FILE, 'utf8')).known;

const found = new Map(); // key -> message
const flag = (key, msg) => { if (!found.has(key)) found.set(key, msg); };

const MAIN_TRAINING_LEVELS = [1, 4, 8, 10, 14];
const SPEC_LEVELS = [15, 20, 23, 25, 30];
const COMPANION_LEVELS = [5, 15, 30];
// combat-passives-2026-11-21.md: primary mechanic at own level 15, listed secondary passives at 30.
const SECONDARY_30 = { 'warrior:prot': ['deflect'], 'mage:arcane': ['arcinst'], 'rogue:subt': ['initiative'], 'warlock:demo': ['masterdemo'] };
// Wording that belongs to developers, not players (ARMS-02 and the bug hunt, section 3.6).
// References to Classic are intentional owner wording and are not flagged.
const DEV_WORDS = [/ИИ /, /Адаптация автобоя/, /Временная схема/, /не подключен/, /\(ход ≈/, /из поздних дополнений/, /баланс тестовый/, /решение владельца/, /Classic: умение тренера с/];
// Kit entries that trigger by themselves instead of being cast (Last Stand, owner 2026-11-27).
const AUTOMATIC = new Set(['laststand']);
const skillByName = Object.fromEntries(Object.entries(B.SKILLS).map(([id, s]) => [s.name, id]));
const nameOf = id => (B.SKILLS[id] && B.SKILLS[id].name) || id;

function checkCasts(tag, cls, spec, L, role, ctx) {
  const skills = ctx.solo2.skills || [];
  const total = {};
  for (const c of Object.values(ctx)) for (const [k, v] of Object.entries(c.casts)) total[k] = (total[k] || 0) + v;
  for (const id of skills) if (!total[id] && !AUTOMATIC.has(id)) flag(`cast:${tag}:${id}`, `«${nameOf(id)}» есть в наборе, но ИИ ни разу не применил его (соло против двух, длинный бой против одного, долгий бой против трёх в группе${ctx.party ? ', своя роль в группе, тяжёлый бой против четырёх' : ''}).`);
  // An area ability on a short cooldown should repeat in a long three-enemy fight.
  const l3 = ctx.long3, turnsPerFight = l3.turns / l3.fights;
  for (const id of skills) {
    const sk = B.SKILLS[id]; if (!sk || !/всем врагам/.test(sk.text || '') || !(sk.cd <= 4)) continue;
    const per = (l3.casts[id] || 0) / l3.fights;
    if (turnsPerFight >= 4 * (sk.cd + 1) && per > 0 && per <= 1) flag(`aoe-once:${tag}:${id}`, `«${nameOf(id)}» (перезарядка ${sk.cd}) применяется ${per.toFixed(1)} раз за длинный бой против трёх врагов (${turnsPerFight.toFixed(0)} ходов героя за бой).`);
  }
}

function checkUnlocks(tag, cls, spec, L, role, ctx) {
  const declared = P.declaredUnlocks(cls, spec, L, role), have = new Set(ctx.solo2.skills || []);
  for (const [id, at] of Object.entries(declared)) {
    if (at <= L && !have.has(id)) flag(`unlock-missing:${tag}:${id}`, `«${nameOf(id)}» объявлено с ${at} ур., но в бою на ${L} ур. его нет.`);
    if (at > L && have.has(id)) flag(`unlock-early:${tag}:${id}`, `«${nameOf(id)}» объявлено с ${at} ур., но в бою есть уже на ${L} ур.`);
  }
}

function checkEffects(tag, cls, spec, L, role, ctx) {
  const all = {};
  for (const c of Object.values(ctx)) Object.assign(all, c.longEffects);
  for (const name of Object.keys(all)) flag(`permanent:${tag}:${name}`, `Эффект «${name}» действует весь бой (turns ≥ ${P.PERMANENT}): в бою виден счётчик ~999, во вкладке «Герой» его нет. Показать как пассивку, без счётчика.`);
}

function checkCaster(tag, cls, spec, L, role, ctx) {
  const c = ctx.solo2;
  if (c.autoMeleeWithMana > 0) flag(`staff-melee:${tag}`, `Кастер бьёт «${c.autoName}» в ближнем бою при мане > 20%: ${c.autoMeleeWithMana} из ${c.autos} автоатак (PLAY-11: посох только без маны).`);
}

function checkPassives(tag, cls, spec, L, role, ctx) {
  const pids = ctx.solo2.pids || [], key = cls + ':' + spec;
  if (L < 15 && pids.length) flag(`passive-early:${tag}`, `Пассивки спека (${pids.join(', ')}) действуют на ${L} ур.; по combat-passives основная открывается с 15.`);
  if (L < 30) for (const id of SECONDARY_30[key] || []) if (pids.includes(id)) flag(`passive30-early:${tag}:${id}`, `Вторая пассивка «${id}» действует на ${L} ур.; по combat-passives она открывается с 30.`);
}

function checkStuns(tag, ctx) {
  const applied = {}, skipped = {};
  for (const c of Object.values(ctx)) { for (const [k, v] of Object.entries(c.stunApplied)) applied[k] = (applied[k] || 0) + v; for (const [k, v] of Object.entries(c.stunSkipBy)) skipped[k] = (skipped[k] || 0) + v; }
  for (const [name, n] of Object.entries(applied)) {
    if (n < 15) continue; // fewer stuns are too noisy: stunned enemies often die before their turn
    const id = skillByName[name], text = (id && B.SKILLS[id].text) || '', m = /на (\d+) ход/.exec(text);
    const expected = /следующий ход/.test(text) ? 1 : m ? +m[1] : 1, got = (skipped[name] || 0) / n;
    if (Math.abs(got - expected) > 0.25 && !(expected === 1 && !m && got >= 1)) flag(`stun:${name}`, `«${name}»: ожидается пропуск ${expected} ход(а) врага за оглушение${m ? ' (по тексту)' : ''}, в бою ${got.toFixed(2)} (${n} оглушений).`);
  }
}

// Every class, spec and role.
for (const cls of P.CLASSES) {
  for (const L of MAIN_TRAINING_LEVELS) {
    const spec = B.CLASSES[cls].def, tag = `main:${cls}:training:${L}`, ctx = P.contexts(cls, spec, L, 'main', N);
    checkCasts(tag, cls, spec, L, 'main', ctx); checkUnlocks(tag, cls, spec, L, 'main', ctx); checkEffects(tag, cls, spec, L, 'main', ctx);
    checkCaster(tag, cls, spec, L, 'main', ctx); checkStuns(tag, ctx);
  }
  for (const spec of Object.keys(B.CLASSES[cls].specs)) {
    for (const [role, levels] of [['main', SPEC_LEVELS], ['companion', COMPANION_LEVELS]]) for (const L of levels) {
      const tag = `${role}:${cls}:${spec}:${L}`, ctx = P.contexts(cls, spec, L, role, N);
      checkCasts(tag, cls, spec, L, role, ctx); checkUnlocks(tag, cls, spec, L, role, ctx); checkEffects(tag, cls, spec, L, role, ctx);
      checkCaster(tag, cls, spec, L, role, ctx); checkPassives(tag, cls, spec, L, role, ctx); checkStuns(tag, ctx);
    }
    // Shape-shift and melee identity: forms attack with paws, melee heroes get no free approach turn.
    const sp = B.CLASSES[cls].specs[spec], auto = B.autoOf(cls, spec);
    if (cls === 'druid' && (spec === 'bear' || spec === 'cat') && /посох/i.test(auto.name)) flag(`form-auto:${cls}:${spec}`, `${sp.name}: в облике автоатака «${auto.name}».`);
    if (!auto.ranged) {
      const me = Object.assign(P.member(cls, spec, 20, 'main'), { pet: undefined }), mob = P.mobFor(20);
      const r = P.probe({ party: [me], L: 20, enemies: [mob, mob], n: 6 });
      if (r.approach > 0) flag(`approach-melee:${cls}:${spec}`, `${sp.name}: автоатака ближняя («${auto.name}»), но враги тратят ход на «Сближение» как к дальнику (${(r.approach / r.fights).toFixed(1)} за бой).`);
    }
    for (const p of sp.passives || []) if (cls === 'hunter' && spec === 'surv' && /Парир/.test(p.name)) flag(`label:${cls}:${spec}:${p.id}`, `Пассивка «${p.name}» даёт уклонение; combat-passives запрещает «парирование» под этим именем.`);
  }
}

// Player-visible texts.
for (const [id, sk] of Object.entries(B.SKILLS)) for (const re of DEV_WORDS) if (re.test(sk.text || '')) { flag(`text:skill:${id}`, `Текст «${sk.name}» содержит служебную формулировку (${re}).`); break; }
for (const [cls, c] of Object.entries(B.CLASSES)) for (const [spec, sp] of Object.entries(c.specs)) for (const p of sp.passives || [])
  for (const re of DEV_WORDS) if (re.test(p.text || '')) { flag(`text:passive:${cls}:${spec}:${p.id}`, `Пассивка «${p.name}» содержит служебную формулировку (${re}).`); break; }

// PET-01 (combat-pets-2026-11-21.md): approved pet roster.
for (const pet of ['imp', 'voidwalker', 'succubus', 'felhunter', 'turtle', 'cat', 'wolf', 'owl']) if (!B.PETS[pet]) flag(`pet-missing:${pet}`, `Питомца «${pet}» из PET-01 нет в движке.`);

// Compare with the known list.
const newOnes = [...found.keys()].filter(k => !known[k]);
const fixed = Object.keys(known).filter(k => !found.has(k));
if (args.includes('--list')) for (const [k, m] of found) console.log((known[k] ? '[' + known[k] + '] ' : '[NEW] ') + k + '\n    ' + m);
console.log(`class rules: ${found.size} violations, ${found.size - newOnes.length} known, ${newOnes.length} new, ${fixed.length} known but no longer occurring`);
if (newOnes.length) { console.log('\nNEW violations (fix them, or add to scripts/fixtures/class-rules-known.json with a report id):'); for (const k of newOnes) console.log('  ' + k + '\n    ' + found.get(k)); }
if (fixed.length) { console.log('\nNo longer occurring (remove from scripts/fixtures/class-rules-known.json):'); for (const k of fixed) console.log('  ' + k + '  [' + known[k] + ']'); }
if (newOnes.length || fixed.length) process.exit(1);
