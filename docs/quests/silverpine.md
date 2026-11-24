# Серебряный бор — оригинальные задания, крепость и требования к карте

24.11.2026. Vanilla / Classic Era. Исследовательский комплект. Ничего в игру не внедрено. Именное покрытие исходного зонального каталога сведено ниже, но не все ID, точные цели, минимальные уровни, ограничения и скрытые prerequisites проверены. Это НЕ готовый импорт и НЕ закрытый полный аудит. Правила: [каталог](README.md); ранее согласованные уточнения: [первый аудит](quest-audit-2026-11-24.md).

## 1. Источники и пределы проверки

S1: https://classicdb.ch/?quests=0.130 — базовый каталог категории Silverpine Forest.
S2: https://warcraft.wiki.gg/wiki/Silverpine_Forest_quests — указатель внешних связей; содержит поздние вставки, их фильтровать.
S3: https://www.wowhead.com/classic/guide/classic-wow-shadowfang-keep-dungeon-quests — три обычных ордынских задания инстанса; классовые разобраны отдельно ниже.
S4: https://www.hcguides.com/dungeons/shadowfang-keep — маршрут и встречи; специальные ограничения Hardcore не переносить в нашу игру.
S5: https://www.warcrafttavern.com/wow-classic/guides/shadowfang-keep/ — состав боссов и отдельное событие вторжения Плети; таблицы тактики/добычи не считать полной проверкой чисел.

В таблицах «?» означает незавершённую сверку, не отсутствие задания или условия. Получение/сдача и связи, взятые только из S2, остаются частично проверенными. В ClassicDB встречается общий ярлык Side: Both у ордынских историй; не использовать его одного для объявления нейтральности. Обычные ветки ниже ордынские по S2, общие/классовые связи выделены отдельно. Награды проекта, характеристики и пиксельные точки не назначены.

## 2. Разведчики: две разные линии

| ID / название | Получение → сдача | Цель / связь |
|---|---|---|
| 428 Lost Deathstalkers | High Executor Hadrec → Rane Yorick | Найти разведчиков у The Ivar Patch; направление к линии лечения |
| 429 Wild Hearts | Rane → Apothecary Renferrel | 6 Discolored Worg Hearts; ворги между фермой и Malden’s Orchard |
| 430 Return to Quinn | Renferrel → Quinn Yorick | Отнести лечебное средство, не сдавать Рейн |
| 425 Ivar the Foul | Rane → Rane | Голова Ивара; после истории лечения, техническую обязательность всех входных стадий сверить |
| 435 Escorting Erland | Deathstalker Erland → Rane Yorick | Сопроводить Эрланда от Malden’s Orchard до разведчиков |
| 449 The Deathstalkers’ Report | Rane → Hadrec | Отчёт после сопровождения; убийство Ивара НЕ назначать условием |
| ? Speak with Renferrel | Hadrec → Renferrel | Поговорить с аптекарем после отчёта |
| 1359 Zinge’s Delivery | Renferrel → Apothecary Zinge, Подгород | Доставить Wolf Heart Samples; городской этап — адаптировать позже |
| 1358 Sample for Helbrim | Zinge → Apothecary Helbrim, Перекрёсток | Wolf Heart Sample; внешнее продолжение в Степях, не удалять |

Lost Deathstalkers — вводное направление; S2 помечает его optional для Wild Hearts. Не создавать общий шлюз из всех северных заданий. Рецепт зелья как награда Wild Hearts не превращает само задание в требование алхимии. Источники: S2; https://classicdb.ch/?quest=429 ; https://warcraft.wiki.gg/wiki/Speak_with_Renferrel ; https://www.wowhead.com/classic/quest=1359/zinges-delivery ; https://www.wowhead.com/classic/quest=1358/sample-for-helbrim

## 3. Опыты Аругала — пять оригинальных этапов

Все берутся и сдаются Dalar Dawnweaver в Гробнице.

| ID / название | Оригинальная цель |
|---|---|
| 421 Prove Your Worth | Убить 5 Moonrage Whitescalps у склонов ниже дороги |
| 422 Arugal’s Folly | Remedy of Arugal из книг на ферме севернее моста |
| 423 Arugal’s Folly | 6 Glutton Shackles и 3 Darksoul Shackles с соответствующих Moonrage |
| 424 Arugal’s Folly | Head of Grimson с Grimson the Pale в Deep Elem Mine |
| 99 Arugal’s Folly | 6 Pyrewood Shackles в Pyrewood Village; оригинальная групповая стадия |

Связь: 421 → 422 → 423 → 424 → 99. Это НЕ prerequisite похода за головой Аругала в крепость. Источники: https://classicdb.ch/?quest=421 ; https://classicdb.ch/?quest=422 ; https://classicdb.ch/?quest=423 ; S1/S2. Для 424 и 99 полный предметный текст перед импортом повторно проверить по оригинальной карточке; не переносить числа опыта из сторонних изменённых баз.

## 4. Янтарная Мельница: шесть этапов без пропущенных разговоров

| ID / название | Получение → сдача | Цель / место |
|---|---|---|
| 477 Border Crossings | Shadow Priest Allister → Dalaran Crate | Осмотреть ящик в даларанском лагере севернее Pyrewood; точку лагеря не путать с городом |
| 478 Maps and Runes | Ящик → Allister | Rune-inscribed Pendant |
| ? Dalar’s Analysis | Allister → Dalar Dawnweaver | Передать сведения для анализа |
| ? Dalaran’s Intentions | Dalar → Allister | Вернуть результаты анализа |
| 479 Ambermill Investigations | Allister → Allister | 8 Dalaran Pendants у магов, призывателей и защитников Ambermill |
| 480 The Weaver | Allister → Allister | Убить даларанского архимага и принести его посох |

Порядок строк — исходная цепочка S2; городской выдуманной лаборатории не добавлять. Источники: https://classicdb.ch/?quest=477 ; https://classicdb.ch/?quest=478 ; https://classicdb.ch/?quest=479 ; https://www.wowhead.com/classic/quest=480/the-weaver

## 5. Гнилошкуры, Фенрис и отдельное кольцо Делии

| ID / название | Получение → сдача | Цель / связь |
|---|---|---|
| 437 The Dead Fields | Hadrec → Hadrec | Посетить поле, сражаться с гноллами до появления Nightlash, принести Essence of Nightlash |
| 438 The Decrepit Ferry | Hadrec → Corpse Laden Boat | Осмотреть лодку у разрушенной переправы |
| 439 Rot Hide Clues | Лодка → Hadrec | Доставить найденные сведения |
| 443 Rot Hide Ichor | Hadrec → Renferrel | 8 Rot Hide Ichor с гноллов Фенриса |
| ? Rot Hide Origins | Renferrel → Bethor Iceshard, Подгород | Исследование происхождения; городской этап — адаптировать позже |
| 446 Thule Ravenclaw | Bethor → Renferrel | Передать выводы о Туле; это НЕ задание убить Тула |
| 448 Report to Hadrec | Renferrel → Hadrec | Отчёт, открывающий штурм |
| 442 Assault on Fenris Isle | Hadrec → Hadrec | Thule’s Head; оригинальное групповое задание |
| 440 The Engraved Ring | Hadrec → Magistrate Sevren, Брилл | Отдельное ответвление после Rot Hide Clues |
| ? Raleigh and the Undercity | Sevren → Raleigh Andrean, Подгород | Продолжение истории кольца Делии, городской этап |
| ? A Husband’s Revenge | Raleigh → Raleigh | Месть за Делию; точная цель и её предмет здесь ещё не сверены |

Сначала цепь расследования, затем штурм; кольцо не является обязательным звеном пути к Тулу. S1 даёт Assault уровень задания 24, S2 — 20; это расхождение помечено, не путать с минимальным уровнем получения и не назначать баланс по одной цифре. Источники: S1/S2; https://classicdb.ch/?quest=437 ; https://classicdb.ch/?quest=443 ; https://classicdb.ch/?quest=442

## 6. Говорящая голова Аларика — самостоятельная находка

| ID / название | Получение → сдача | Цель |
|---|---|---|
| 460 Resting in Pieces | A Talking Head с гноллов Фенриса → Shallow Grave | Отнести голову к могиле Аларика у конюшни Fenris Keep |
| 461 The Hidden Niche | Shallow Grave → Dusty Shelf | Перенести останки к тайнику за пыльной полкой в юго-западной башне |
| 491 Wand to Bethor | Dusty Shelf → Bethor Iceshard | Woven Wand в Подгород; городской этап — адаптировать позже |

Это не кольцо Делии и не обязательный маршрут убийства Тула. Источники: https://classicdb.ch/?quest=460 ; https://classicdb.ch/?quest=461 ; https://www.wowhead.com/classic/quest=491/wand-to-bethor

## 7. Аптекари и два самостоятельных открытых задания

| ID / название | Получение → сдача | Цель |
|---|---|---|
| 447 A Recipe For Death | Renferrel → Master Apothecary Faranell, Подгород | 6 Grizzled Bear Hearts и 6 Skittering Blood; пауки Skittering Dark, медведи леса |
| 450 A Recipe For Death | Faranell → Renferrel | Berard’s Journal из кабинета в таверне Pyrewood; оригинальная групповая стадия |
| 451 A Recipe For Death | Renferrel → Faranell | 6 Lake Creeper Moss, 6 Lake Skulker Moss и 1 Hardened Tumor; озеро Лордамер и Vile Fin мурлоки |
| 452 Pyrewood Ambush | Deathstalker Faerleia → Faerleia | Помочь убить Pyrewood Council; оригинальное групповое событие, не обычная зачистка |
| 516 Beren’s Peril | Allister → Allister | 6 Ravenclaw Drudgers и 6 Ravenclaw Guardians в районе пещеры южнее Ambermill |

447 → 450 → 451. Подгородские получения/сдачи сохраняются в оригинале с пометкой адаптации. Для засады точное число волн, состав совета и условия провала ещё не выгружены; не придумывать. Beren’s Peril самостоятельно, не назначать финалом линии The Weaver. Источники: https://classicdb.ch/?quest=447 ; https://classicdb.ch/?quest=450 ; https://classicdb.ch/?quest=451 ; https://classicdb.ch/?quest=452 ; https://www.wowhead.com/classic/quest=516/berens-peril

Открытые Group по S1: 99, 450, 452, 442 — четыре. Это счёт оригинальной категории в проверенном каталоге, НЕ число наших будущих отрядных встреч. Подземелья отдельно. Новые отрядные адаптации этим документом не утверждаются.

## 8. Доставки и внешние связи — не потерять из-за категории

- 445 Delivery to Silverpine Forest: Johaan в Брилле → Renferrel. Поля исходной посылки и prerequisite ещё проверить; не дублировать тирисфальскую карточку.
- Supplying the Sepulcher (6321): Deathguard Podrig → Karos Razok с Podrig’s Order. Ride to the Undercity: Karos → Gordon Wendham в Подгороде. Michael Garrett (6322): Gordon → Michael с Gordon’s Crate. Return to Podrig: Michael → Podrig. Все четыре стадии сохранять. Минимум первого этапа 10; Wowhead указывает расовое ограничение Undead, проверить флаги всей серии перед выдачей остальной Орде. Источники: https://www.wowhead.com/classic/quest=6321/supplying-the-sepulcher ; https://www.wowhead.com/classic/quest=6322/michael-garrett
- Journey to Hillsbrad Foothills: Renferrel → Apothecary Lydon в Мельнице Таррен; исходную посылку и ID сверить. Это выход в соседнюю зону, не обязательное закрытие Серебряного бора.
- 3301 Mura Runetotem: Tonga Runetotem, Перекрёсток → Mura Runetotem в Серебряном бору; внешнее продолжение Altered Beings по S2. Точные ограничения проверить.
- 264 Until Death Do Us Part: Clarice Foster в Громовом Утёсе → Yuriv’s Tombstone в Гробнице. Положить Clarice’s Pendant на могилу; минимум 12. Это не кольцо Делии и не история головы Аларика. Источник: https://classicdb.ch/?quest=264

## 9. Классовые и поздние связи

Шаман: Call of Water, минимум 20 для рассматриваемых стадий. 63 — от Islen Waterseer к святилищу западного берега: победить Corrupt Manifestation и положить браслеты с Remaining Drops of Purest Water на Brazier of Everfount. 100 — от жаровни поговорить с Minor Manifestation of Water. 96 — от духа вернуть Shard of Water к Islen в Степи, получить Water Totem и Healing Stream Totem. Предыдущие сборы воды в других зонах не удалять; их полная цепочка здесь не выгружена. 1103 от Tiev Mordune — необязательное восстановительное событие при пропущенном разговоре с духом, требует Water Sapta; не делать обязательным четвёртым этапом. Источники: https://www.wowhead.com/classic/quest=63/call-of-water ; https://www.wowhead.com/classic/quest=100/call-of-water ; https://www.wowhead.com/classic/quest=96/call-of-water ; https://classicdb.ch/?quest=1103

Разбойник: 1886 The Deathstalkers, Mennet Carkad в Подгороде → получить Astor’s Letter of Introduction у путешествующего Astor Hadren → Mennet. Минимум 10. Классовая история с последующими городскими этапами, не общий квест зоны и не отчёт Эрланда. Точный расовый флаг Classic пока НЕ закрыт: указатели изменённых версий пишут Undead, но переносить их флаг без проверки оригинального RequiredRaces нельзя. Источник текста: https://classicdb.ch/?quest=1886

Поздняя нейтральная история AQ у стены Седогрива: Stewvul, Ex-B.F.F. → Scrying Goggles? No Problem! из Inconspicuous Crate. Сохранить отдельным резервом цепочки скипетра, не стартовым заданием зоны; точные ID и условия не выгружены. S2.

Исключения: Delivery to the Sepulcher от Ambassador Sunsorrow — не включать в Vanilla как доставку приказов эльфов крови. A Token of Gratitude (78277) после Wand to Bethor — SoD, не оригинальный финал Аларика: https://warcraft.wiki.gg/wiki/A_Token_of_Gratitude . The Horn of Xelthos / The Eye of Bhossca / One Last Drop / Biding Our Time из смешанных современных таблиц НЕ подтверждены для Vanilla; не включать без оригинальных карточек. Внешние классовые задания крепости — ниже.

## 10. Крепость Тёмного Клыка — отдельный полноценный инстанс

Вход над Pyrewood Village. Не сокращать до Аругала; открытая карта показывает только подход и вход. Восемь основных боссов: Rethilgore, Razorclaw the Butcher, Baron Silverlaine, Commander Springvale, Odo the Blindwatcher, Fenrus the Devourer, Wolf Master Nandos, Archmage Arugal. Deathsworn Captain — редкая дополнительная встреча, не гарантированный девятый основной босс. Sever — отдельный резерв Scourge Invasion, не постоянный босс обычного прохождения. S4/S5.

Маршрут и важные взаимодействия: тюрьма после Rethilgore → освобождённый Deathstalker Adamant либо Sorcerer Ashcrombe открывает проход → двор с Vincent и конюшнями → кухня/Мясник → пиршественный зал/барон → Спрингвейл и дальнейшие проходы → Одо и стены с возможным Captain → библиотека Фенруса с книгой Ура и событием появления Аругала/призыва → Нандос → покои Аругала. Не превращать взаимодействие с пленником, книгу и молот в новые авторские квесты. Подробную схему дверей и ветвлений перепроверить перед сборкой инстанса.

Сохранить особенности боёв как справку, не готовые цифры баланса: Soul Drain у Rethilgore; Veil of Shadow у барона; защита Springvale и опасное молчание его окружения; усиление Одо и летучие мыши; волки Нандоса; Void Bolt, перемещения и Arugal’s Curse у Аругала. Точные тайминги, численность призывов и коэффициенты ещё не назначены. S4.

### Три обычных задания Орды

| Название | Получение / сдача | Цель и минимум |
|---|---|---|
| Deathstalkers in Shadowfang | Hadrec → Deathstalker Vincent внутри | Найти пропавших; завершение разговором с телом Vincent во дворе. Минимум 18, не возвращать сдачу Hadrec |
| The Book of Ur | Keeper Bel’dugur, Подгород → он же | Книга с полки в комнате Фенруса. Минимум 16; городские шаги адаптировать позже |
| Arugal Must Die | Dalar Dawnweaver → он же | Head of Arugal с последнего босса. Минимум 18, без prerequisite всей цепочки Folly |

S3. ID этих трёх заданий нужно отдельно сверить перед созданием импортируемых карточек. Награды оригинала: Ghostly Mantle; выбор Grizzled Boots / Steel-clasped Bracers; Seal of Sylvanas соответственно. Это НЕ назначение наград проекта. Обычного общего задания Альянса здесь не добавлять.

### Классовые связи двух фракций

Паладин, Альянс: 1654 The Test of Righteousness, минимум 20, Jordan Stilwell. Сбор четырёх компонентов: Whitestone Oak Lumber, Jordan’s Refined Ore Shipment, Jordan’s Smithing Hammer, Purified Kor Gem. Молот — в конюшне крепости; древесина — Мёртвые копи; руда и очищенный самоцвет имеют внешние поручения. Предысторию через Duthorian Rall и помощь Daphne Stilwell не удалять. Полные карточки внешних стадий и финальной ковки Verigan’s Fist пока не выгружены. Согласованная адаптация: доступ через точку Штормграда на карте Элвинна, только паладину, без превращения в общее задание Альянса. Источник: https://www.wowhead.com/classic/quest=1654/the-test-of-righteousness ; S4.

Чернокнижник: 1740 The Orb of Soran’ruk, Doan Karhan в Степях → он же. 3 Soran’ruk Fragments и 1 Large Soran’ruk Fragment. Большой — с Shadowfang Darksoul в крепости, малые связаны с Twilight Acolytes у Непроглядной Пучины. Только чернокнижнику; не заменять сбор убийством Аругала и не исключать из-за паладинской истории. Источник: https://www.wowhead.com/classic/quest=1740/the-orb-of-soranruk

## 11. Требования к общей карте и промпт

География — только карта Silverpine Forest Vanilla. Обязательные различимые области: северный вход из Тирисфаля; Malden’s Orchard и The Ivar Patch; мост и ферма Remedy; Dead Fields; Skittering Dark; Гробница с кладбищем и точкой летучих мышей; западный берег со святилищем; Decrepit Ferry; озеро Лордамер и Fenris Isle с крепостью, конюшней и юго-западной башней; Deep Elem Mine; Ambermill и отдельный даларанский лагерь; Beren’s Peril; Pyrewood Village; вход в Shadowfang Keep; южная стена Седогрива и выход к Хилсбраду по исходной географии. Координаты и положения мелких объектов сверять перед рисованием; не выдавать этот перечень за готовую расстановку.

Промпт: «Нарисуй одну цельную игровую карту-диораму Серебряного бора World of Warcraft Vanilla / Classic Era для браузерной RPG „Азерот“. Референс стиля и камеры — утверждённый Элвинн проекта; референс географии — оригинальная карта Silverpine Forest Vanilla. Вид сверху под углом, живописная матовая фактура, объёмные миниатюрные постройки, тёмный хвойный лес с читаемыми дорогами и берегами, север сверху. Сохрани все перечисленные в техническом задании канонические области и их взаимное положение по географическому референсу. Гробница — основной ордынский узел, а не новый город Альянса. Fenris Isle — отдельный остров с крепостью; Pyrewood и расположенный выше вход в Shadowfang Keep различимы, но интерьер подземелья на открытую карту не выносить. Стена Седогрива цела и закрыта; не показывай разрушения, военные лагеря и сюжет Cataclysm. Не переноси Подгород, Степи или Мельницу Таррен внутрь зоны. Не придумывай новые поселения, боссов и обязательную арену финала. Без текста, букв, цифр, стрелок, квестовых знаков, интерфейса, логотипов и рамки. Естественное продолжение местности по краям под существующую общую рамку отдельным слоем».

Это текстовое ТЗ; изображение не генерировалось, референсы не приложены и географическая раскладка арта ещё не утверждена.

## 12. Что завершено и что ещё требуется

Сведены все названия из базового S1, с отдельными строками одноимённых стадий; дополнительные внешние и классовые связи вынесены за пределы зональной категории. Источники S1/S2 не являются гарантией отсутствия квестов, категоризированных по классу или другой зоне; полную внешнюю матрицу ещё проверить.

Перед статусом «полностью проверено»: заполнить все ID с «?» и ID инстанса; проверить расу разбойничьей ветки и всю серию Подрига; точную цель мести Raleigh; предметы курьерских стадий; полный внешний паладинский граф и предыдущие стадии шамана; условия Pyrewood Ambush; все минимальные уровни, скрытые prerequisites, награды, объекты и маршруты. Устранить расхождение уровня Assault. Затем сопоставить с текущими данными проекта. Не смешивать готовность карты, полноту справочника и внедрение.
