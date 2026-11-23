(function abilityProgressionCore(CLASSES, SKILLS) {
  function makeAbilityProgression(rules) {
    if (!rules || typeof rules !== 'object' || Array.isArray(rules)) throw new TypeError('Ability rules must be an object');
    const catalog = Object.create(null);
    Object.keys(rules).forEach(function (key) {
      const parts = key.split(':');
      if (parts.length !== 2 || !Object.prototype.hasOwnProperty.call(CLASSES, parts[0]) || !Object.prototype.hasOwnProperty.call(CLASSES[parts[0]].specs, parts[1])) throw new Error('Unknown ability profile: ' + key);
    });
    Object.keys(CLASSES).forEach(function (cls) {
      Object.keys(CLASSES[cls].specs).forEach(function (spec) {
        const key = cls + ':' + spec, ids = CLASSES[cls].specs[spec].skills;
        const configured = Object.prototype.hasOwnProperty.call(rules, key), plan = configured ? rules[key] : null;
        if (configured) {
          if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new TypeError('Invalid ability profile: ' + key);
          const keys = Object.keys(plan);
          if (keys.length !== ids.length || keys.some(function (id) { return ids.indexOf(id) === -1; })) throw new Error('Ability profile must cover exactly the current kit: ' + key);
          ids.forEach(function (id) { if (!Object.prototype.hasOwnProperty.call(plan, id) || !Number.isInteger(plan[id]) || plan[id] < 1 || plan[id] > 60) throw new Error('Invalid ability unlock: ' + key + ':' + id); });
        }
        catalog[key] = Object.freeze(ids.map(function (id) {
          const skill = SKILLS[id];
          if (!skill) throw new Error('Missing skill definition: ' + id);
          return Object.freeze({ id: id, name: skill.name, icon: skill.icon, description: skill.text, unlockLevel: configured ? plan[id] : null, source: configured ? 'level' : 'legacy' });
        }));
      });
    });
    function slots(cls, spec, level) {
      if (!Object.prototype.hasOwnProperty.call(CLASSES, cls)) throw new Error('Unknown ability class: ' + cls);
      const selected = Object.prototype.hasOwnProperty.call(CLASSES[cls].specs, spec) ? spec : CLASSES[cls].def;
      if (!Number.isInteger(level) || level < 1 || level > 60) throw new RangeError('Ability level must be an integer from 1 to 60');
      return catalog[cls + ':' + selected].map(function (entry) { return Object.freeze({ id: entry.id, name: entry.name, icon: entry.icon, description: entry.description, unlockLevel: entry.unlockLevel, source: entry.source, available: entry.unlockLevel === null || level >= entry.unlockLevel }); });
    }
    function active(cls, spec, level) { return slots(cls, spec, level).filter(function (entry) { return entry.available; }).map(function (entry) { return entry.id; }); }
    return Object.freeze({ slots: slots, active: active, create: makeAbilityProgression, configuredProfiles: Object.freeze(Object.keys(rules)) });
  }
  return makeAbilityProgression;
})
