# Элвиннский лес — список квестов Wowhead Classic и сверка с кодом

Дата: 26.11.2026. Статус: исследовательская сверка, не готовый импорт. Ничего в игре не изменено.

## Источник и границы

- Список: https://www.wowhead.com/classic/quests/eastern-kingdoms/elwynn-forest (49 строк, имя и «Req.» = минимальный уровень). Отдельные страницы квестов не открывались, поэтому ID, квестодатели и точные URL не подтверждены.
- Колонка «Ключ в коде» сопоставлена двумя способами (см. колонку «Основание»). «По имени ключа» означает догадку по смыслу названия, без проверки текста квеста. Такие строки требуют проверки.
- Код: `src/scripts/script-06.txt`. Первый список `QUESTS` — строки 2093–2131. Дополнения `v56` с `englishName` и ссылкой на warcraft.wiki.gg — строка 2221 (ключи `ef_*`).
- Предыдущая таблица помечала многие квесты как MISSING только по сопоставлению с ключами `ef_*`. Исправлено ниже.

## Таблица

| ID | Название (Wowhead) | Мин. уровень | Квестодатель | Решение | Причина | Ключ в коде | Основание | Примечание |
|---|---|---|---|---|---|---|---|---|
| не проверено | Welcome! | 1 | не проверено | INCLUDE | Стартовый квест | не найден | — | Проверить вручную |
| не проверено | A Threat Within | 1 | не проверено | INCLUDE | Стартовый квест | `threat` | по имени ключа | script-06.txt:2093 |
| не проверено | Eagan Peltskinner | 1 | не проверено | INCLUDE | В зоне | `ef_eagan` | englishName в строке 2221 | |
| не проверено | Kobold Camp Cleanup | 1 | не проверено | INCLUDE | В зоне | `kobold_camp` | по имени ключа | script-06.txt:2093 |
| не проверено | Investigate Echo Ridge | 1 | не проверено | INCLUDE | В зоне | `echo_scout` | по имени ключа | script-06.txt:2093 |
| не проверено | Skirmish at Echo Ridge | 1 | не проверено | INCLUDE | В зоне | `echo_raid` | по имени ключа | script-06.txt:2093 |
| не проверено | Report to Goldshire | 1 | не проверено | INCLUDE | Есть награда; сомнение: похоже на переход в город | `report_goldshire` | по имени ключа | script-06.txt:2093 |
| не проверено | Rest and Relaxation | 1 | не проверено | INCLUDE | В зоне | `ef_rest` | englishName в строке 2221 | |
| не проверено | Wolves Across the Border | 1 | не проверено | INCLUDE | В зоне | `wolves` | по имени ключа | script-06.txt:2093 |
| не проверено | Give Gerard a Drink | 1 | не проверено | INCLUDE | В зоне | не найден | — | Проверить вручную |
| не проверено | Waskily Wabbits! | 1 | не проверено | INCLUDE | Сомнение: в колонке Side стояло «??» | не найден | — | Проверить доступность в Classic Era |
| не проверено | Wabbit Pelts | 1 | не проверено | INCLUDE | Сомнение: в колонке Side стояло «??» | не найден | — | Проверить доступность в Classic Era |
| не проверено | Brotherhood of Thieves | 2 | не проверено | INCLUDE | В зоне | `thieves` | по имени ключа | script-06.txt:2093 |
| не проверено | Bounty on Garrick Padfoot | 2 | не проверено | INCLUDE | В зоне | не определено | — | Возможно, `ef_bounty`; не подтверждено |
| не проверено | Grape Manifest | 2 | не проверено | INCLUDE | Цепочка Милли | `ef_milly3` | englishName в строке 2221 | Порядок: milly1 → milly2 → milly3 |
| не проверено | Milly's Harvest | 2 | не проверено | INCLUDE | Цепочка Милли | `ef_milly2` | englishName в строке 2221 | |
| не проверено | Milly Osworth | 2 | не проверено | INCLUDE | Цепочка Милли | `ef_milly1` | englishName в строке 2221 | Первый этап |
| не проверено | Kobold Candles | 3 | не проверено | INCLUDE | В зоне | `ef_candles` | по имени ключа | строка 2221 |
| не проверено | Shipment to Stormwind | 3 | не проверено | INCLUDE | Сомнение: доставка в Штормград, но есть награда | `ef_shipment` | englishName в строке 2221 | |
| не проверено | The Fargodeep Mine | 4 | не проверено | INCLUDE | В зоне | `fargo` | по имени ключа | script-06.txt:2093 |
| не проверено | The Jasperlode Mine | 4 | не проверено | INCLUDE | В зоне | `jasper` | по имени ключа | script-06.txt:2093 |
| не проверено | Gold Dust Exchange | 4 | не проверено | INCLUDE | В зоне | `gold_dust` | по имени ключа | script-06.txt:2093 |
| не проверено | Red Linen Goods | 4 | не проверено | INCLUDE | В зоне | `ef_linen` | по содержимому (цель: красные бандану) | строка 2221 |
| не проверено | A Bundle of Trouble | 5 | не проверено | INCLUDE | В зоне | `ef_bundle` | englishName в строке 2221 | |
| не проверено | Collecting Kelp | 5 | не проверено | INCLUDE | В зоне | `ef_kelp` | по содержимому (цель: хрустальная водоросль) | строка 2221 |
| не проверено | The Escape | 5 | не проверено | INCLUDE | В зоне | `ef_escape` | englishName в строке 2221 | |
| не проверено | Lost Necklace | 5 | не проверено | INCLUDE | В зоне | `necklace` | по имени ключа | script-06.txt:2093 |
| не проверено | Pie for Billy | 5 | не проверено | INCLUDE | Цепочка влюбленных | `pie` | по имени ключа | script-06.txt:2093 |
| не проверено | Young Lovers | 5 | не проверено | INCLUDE | Цепочка влюбленных | `ef_lovers1` | englishName в строке 2221 | |
| не проверено | Note to William | 5 | не проверено | INCLUDE | Цепочка влюбленных | `ef_lovers3` | englishName в строке 2221 | |
| не проверено | Speak with Gramma | 5 | не проверено | INCLUDE | Цепочка влюбленных | `ef_lovers2` | englishName в строке 2221 | |
| не проверено | Back to Billy | 5 | не проверено | INCLUDE | Цепочка влюбленных | `back_billy` | по имени ключа | script-06.txt:2093 |
| не проверено | Goldtooth | 5 | не проверено | INCLUDE | В зоне | `goldtooth` | по имени ключа | script-06.txt:2093 |
| не проверено | Wanted: "Hogger" | 5 | не проверено | INCLUDE | В зоне, элита | `hogger` | по имени ключа | script-06.txt:2093 |
| не проверено | Riverpaw Gnoll Bounty | 6 | не проверено | INCLUDE | В зоне | не определено | — | Возможно, `ef_bounty`; не подтверждено |
| не проверено | Princess Must Die! | 6 | не проверено | INCLUDE | В зоне | `princess` | по имени ключа | script-06.txt:2093 |
| не проверено | Westbrook Garrison Needs Help! | 6 | не проверено | INCLUDE | В зоне | `garrison` | по имени ключа | script-06.txt:2093 |
| не проверено | The Collector | 7 | не проверено | INCLUDE | В зоне | `collector` | по имени ключа | script-06.txt:2093 |
| не проверено | Cloth and Leather Armor | 7 | не проверено | INCLUDE | В зоне | `ef_cloth` | englishName в строке 2221 | |
| не проверено | Manhunt | 7 | не проверено | INCLUDE | В зоне | `manhunt` | по имени ключа | script-06.txt:2093 |
| не проверено | Bounty on Murlocs | 7 | не проверено | INCLUDE | В зоне | `ef_bounty` | по содержимому (цель: рваный плавник мурлока) | строка 2221; название не подтверждено |
| не проверено | Find the Lost Guards | 7 | не проверено | INCLUDE | В зоне | `lost_guards` | по имени ключа | script-06.txt:2093 |
| не проверено | Discover Rolf's Fate | 7 | не проверено | INCLUDE | В зоне | `rolf` | по имени ключа | script-06.txt:2093 |
| не проверено | Protect the Frontier | 7 | не проверено | INCLUDE | В зоне | `ef_frontier` | по содержимому (цель: лесной волк) | строка 2221 |
| не проверено | A Fishy Peril | 7 | не проверено | INCLUDE | Сомнение: возможно, связано с рыбалкой | `fishy` | по имени ключа | script-06.txt:2093 |
| не проверено | Further Concerns | 7 | не проверено | INCLUDE | В зоне | `further_concerns` | по имени ключа | script-06.txt:2093 |
| не проверено | Deliver Thomas' Report | 7 | не проверено | INCLUDE | Сомнение: в основном доставка | `thomas_report` | по имени ключа | script-06.txt:2093 |
| не проверено | Report to Thomas | 7 | не проверено | INCLUDE | Сомнение: в основном доставка | `report_thomas` | по имени ключа | script-06.txt:2093 |
| не проверено | Report to Gryan Stoutmantle | 9 | не проверено | INCLUDE | Сомнение: похоже на отчёт и переход в Западный край; возможно EXCLUDE | `stoutmantle` | по имени ключа | script-06.txt:2093 |

## Итоги

- Явных EXCLUDE не найдено. Профессиональных, PvP и квестов на полёты среди названий не видно, но цели не проверялись.
- Подтверждено по `englishName` в строке 2221: `ef_milly1–3`, `ef_eagan`, `ef_rest`, `ef_shipment`, `ef_lovers1–3`, `ef_escape`, `ef_bundle`, `ef_cloth`.
- Не найдены в коде: Welcome!, Give Gerard a Drink, Waskily Wabbits!, Wabbit Pelts.
- Не определены: Bounty on Garrick Padfoot, Riverpaw Gnoll Bounty.
- Все квестодатели и ID не проверены. Нужно открыть страницы квестов или представление «квестодатели в Элвиннском лесу».
- Количество 49 взято со страницы списка. Квесты, которые начинаются в Элвиннском лесу, но отнесены к другой зоне, не проверялись.
