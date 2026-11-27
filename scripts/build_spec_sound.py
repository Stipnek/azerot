"""Inline the owner-supplied spec switch sound into the game (TALENT-01, 2026-11-27).

Input: src/assets/audio/ui-dual-talent-specialization.ogg (WotLK UI_DualTalentSpecilization, bytes as supplied) and its .mp3 fallback.
Output: src/scripts/script-06.~~~~~~~~~~spec-sound.edits.json (data URIs inlined; the game fetches nothing).
Run: python3 scripts/build_spec_sound.py [--check]
World of Warcraft sounds are copyright Blizzard Entertainment (see src/assets/audio/NOTICE.md); no licence is granted.
"""
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / 'src/assets/audio'
OUT = ROOT / 'src/scripts/script-06.~~~~~~~~~~spec-sound.edits.json'
SOURCE_SHA256 = 'd6b8884a64eac761cbb061e28a3cfe001324a01b19917a813ae6bb6c1a0879c3'
OLD = "  function specCastSound(kind) {\n    if (S.sound === false) return;\n    try {\n      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;\n      const ctx = specCastSound.ctx || (specCastSound.ctx = new A()), t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();\n      o.type = 'sine'; o.connect(g); g.connect(ctx.destination);\n      if (kind === 'done') { o.frequency.setValueAtTime(660, t); o.frequency.exponentialRampToValueAtTime(990, t + 0.25); g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6); o.start(t); o.stop(t + 0.6); }\n      else { o.frequency.setValueAtTime(220, t); o.frequency.linearRampToValueAtTime(440, t + SPEC_CAST_MS / 1000); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.03, t + 0.4); g.gain.linearRampToValueAtTime(0.0001, t + SPEC_CAST_MS / 1000); o.start(t); o.stop(t + SPEC_CAST_MS / 1000); specCast && (specCast.osc = o); }\n    } catch (e) {}\n  }\n"
NEW = '  function specCastSound(kind) {\n    /* Владелец, 27 ноября: звук WotLK «UI_DualTalentSpecilization» (src/assets/audio, встроен scripts/build_spec_sound.py). Это звук завершения: играет, когда смена применилась (владелец, 27 ноября); во время каста и при отмене — тишина. */\n    if (S.sound === false || kind !== \'done\') return;\n    try {\n      const a = specCastSound.el || (specCastSound.el = new Audio());\n      if (!a.src) a.src = a.canPlayType(\'audio/ogg; codecs="vorbis"\') ? SPEC_SOUND.ogg : SPEC_SOUND.mp3;\n      a.currentTime = 0; a.volume = 0.8;\n      const play = a.play(); if (play && play.catch) play.catch(function () {});\n    } catch (e) {}\n  }\n'


def uri(path, kind):
    return 'data:' + kind + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def build():
    sound = {'ogg': uri(AUDIO / 'ui-dual-talent-specialization.ogg', 'audio/ogg'), 'mp3': uri(AUDIO / 'ui-dual-talent-specialization.mp3', 'audio/mpeg')}
    data = '  const SPEC_SOUND = ' + json.dumps(sound, separators=(',', ':')) + ';\n'
    return {
        'sourceSha256': SOURCE_SHA256,
        'description': 'TALENT-01 (owner 2026-11-27): the owner-supplied WotLK sound UI_DualTalentSpecilization plays when the spec switch completes (no sound during the cast), replacing the placeholder tone; built by scripts/build_spec_sound.py.',
        'edits': [
            {'name': 'Spec switch cast sound', 'old': OLD, 'new': data + NEW},
            {'name': 'Comment: the real sound is in', 'old': 'Звук каста — временный синтезированный тон (свой, без чужих файлов); настоящий звук — решение AUDIO.', 'new': 'Звук каста — оригинальный звук WotLK от владельца (src/assets/audio).'},
        ],
    }


if __name__ == '__main__':
    text = json.dumps(build(), ensure_ascii=False, indent=1) + '\n'
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != text:
            raise SystemExit('Spec sound edit is out of date: run python3 scripts/build_spec_sound.py')
        print('spec sound edit up to date')
    else:
        OUT.write_text(text, encoding='utf-8')
        print('wrote', OUT.relative_to(ROOT), len(text), 'bytes')
