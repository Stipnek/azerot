# Pocket Azeroth — харнесс C1+C4, воин L1→L2 (частичный результат)

Статус: **частичный результат**. C1+C4 целиком НЕ закрыт. Проверен только `combined.html`
(ARMS_HERO_MODE, специализация с 15), а не основной `index.html` (там специализация с 10).

## Цель сборки
- Репозиторий: main `6d885bd52a65e9422f12c4c0f231f06aa4d6a5d3` (игровой код и баланс не менялись).
- `preview/combined.html` sha256 `ff45e9efdb4e7a1bb609f78a9a3daca463d97575bb2b09b25990fb4f63f86853`.

## Версии зависимостей (как в прогоне out9)
| Компонент | Версия |
|---|---|
| Python | 3.11.17 |
| playwright (pip) | 1.64.1 |
| Chromium (headless, из playwright) | 156.0.8078.4 |
| ОС | Linux 7.0.0-1014-aws |
| HTTP-сервер | `python3 -m http.server` (stdlib) |

Установка: `pip install playwright==1.64.1 && python3 -m playwright install chromium`

## Команды
```bash
# 1. Сборка (из корня клона на 6d885bd)
python3 scripts/build_game.py >/dev/null && python3 scripts/build_combined_preview.py
sha256sum preview/combined.html   # должно совпасть с хэшем выше

# 2. Сервер (отдельный терминал)
cd preview && python3 -m http.server 8765

# 3. Прогон (~4 мин; в out9 — 244 с, код выхода 0). Запускать из этой папки:
#    run_warrior.py импортирует соседние lib.py и engine_probe.py
cd tools/c1c4-harness && python3 run_warrior.py out9 400

# 4. Чтение панели умений героя из СОБСТВЕННОГО финального сохранения прогона
python3 probe_saved.py out9

# 5. Хронологическая распечатка лога
python3 summarize.py out9/actions.jsonl
```
`run_warrior.py` импортирует `lib.py` и `engine_probe.py` из той же папки. Результаты прогона пишутся в `<outdir>/`
(actions.jsonl, CSV, final-localStorage.json, скриншоты) и в репозиторий не добавляются.

## Состав папки `tools/c1c4-harness/`
- `run_warrior.py` — прогон воина L1→L2 только через UI игры
- `lib.py` — лог (JSONL), дампы, чтение состояния из localStorage (только чтение)
- `engine_probe.py` — чтение панели умений (только чтение)
- `probe_saved.py` — открывает финальное сохранение прогона и читает панель умений героя
- `summarize.py` — хронологическая распечатка `actions.jsonl`
- `results-out9/warrior-L1-L2.csv` — 21 строка по возрастанию `t_s` (прогон out9)
- `results-out9/REPORT-warrior-L1-L2.md` — текстовый отчёт out9

Не добавлены (намеренно): сборки HTML, actions.jsonl, final-localStorage.json, скриншоты, зависимости, браузеры, кэши.

## Итог out9
L2 достигнут без поражений, тупиков и pageerror. Финал: level 2, XP 445, деньги 430, камни 42,
отряд [герой, жрица], локация abbey. Квесты: tutorial57_train, _hire, _party, _team, wolves,
kobold_camp, thieves, echo_scout (XP 335→445 → L2). Точка остановки — условие «достигнут L2».

## Обходы и допущения автоматизации
- Харнесс в localStorage не пишет; в начале проверяется пустое хранилище и `__AZEROT_ARMS_HERO__===true`.
- Запрещённые id (lv-plus, lv-minus, tav-give, chk-allq, chk-allspecs, chk-amb, chk-test, chk-comp, chk-auto)
  проверяются assert-ом; прямых выдач XP/уровней/денег/предметов/спутников нет.
- Выбор действия — эвристика по видимым кнопкам (`#q-turn/#q-fight/#q-party/#pick-ok/#q-go/#q-take/#skipbtn`, `#back`, таверна, журнал); бои проходят штатным UI-потоком игры, тактический выбор умений в бою харнесс не делает.
- `probe_saved.py` в новом профиле браузера загружает в localStorage ТОЛЬКО финальное сохранение этого же прогона, чтобы открыть панель умений (только чтение).
- Не проверено: фактическое применение умений в бою и автоатака на уровне движка.
