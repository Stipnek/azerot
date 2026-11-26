  /* Uploaded artwork is presentation data, not original Blizzard cartography.
     Existing zone/place/save identifiers and all quest records are preserved. */
  const WORLD_MAP_ART = {
    westfall: { file: 'westfall.png', uri: '__AZEROT_WORLD_MAP_WESTFALL__', ratio: '__AZEROT_WORLD_RATIO_WESTFALL__' },
    wetlands_route: { file: 'wetlands.png', uri: '__AZEROT_WORLD_MAP_WETLANDS__', ratio: '__AZEROT_WORLD_RATIO_WETLANDS__' },
    duskwood: { file: 'duskwood.png', uri: '__AZEROT_WORLD_MAP_DUSKWOOD__', ratio: '__AZEROT_WORLD_RATIO_DUSKWOOD__' },
    tirisfal: { file: 'tirisfal-glades.png', uri: '__AZEROT_WORLD_MAP_TIRISFAL__', ratio: '__AZEROT_WORLD_RATIO_TIRISFAL__' }
  };
  ZONES.wetlands_route.name = 'Болотина';
  ZONES.wetlands_route.short = 'Болотина';
  ZONES.wetlands_route.lv = '20–30';
  ZONES.tirisfal = { name: 'Тирисфальские леса', short: 'Тирисфальские леса', entry: 'tg_brill', lv: '1–10', icon: '✦', wm: [30, 12] };
  PLACES.tg_brill = { x: 61, y: 52, name: 'Брилл', label: 'Брилл', lx: 0, ly: 5, z: 'tirisfal' };
  if (!ZONE_KEYS.includes('tirisfal')) ZONE_KEYS.push('tirisfal');
  for (let i = WM_ZONES.length - 1; i >= 0; i--) {
    if (Object.keys(ZONES).some(function (key) { return ZONES[key].name === WM_ZONES[i][0]; })) WM_ZONES.splice(i, 1);
  }
  ZONE_INTRO.wetlands_route = ['✦', 'Болотина. Существующий маршрут за светосталью остаётся частью заданий этой локации.'];
  ZONE_INTRO.tirisfal = ['✦', 'Тирисфальские леса. Новые задания пока не добавлены.'];
  const worldMapArtStyle = document.createElement('style');
  worldMapArtStyle.id = 'az-world-map-art';
  worldMapArtStyle.textContent = Object.keys(WORLD_MAP_ART).map(function (zone) {
    const art = WORLD_MAP_ART[zone];
    return '#map[data-zone="' + zone + '"]{background-image:url("' + art.uri + '")!important;background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important;aspect-ratio:' + art.ratio + '!important;height:auto!important;min-height:0!important;}';
  }).join('');
  document.head.appendChild(worldMapArtStyle);
