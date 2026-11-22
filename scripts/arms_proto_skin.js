/* Visual layer only. Original validation, persistence and combat remain authoritative. */
(function () {
  'use strict';
  const P = window.Battle.armsProto, tree = document.getElementById('tree');
  const catalog = [
    [/heroic/i, 1, 'ability_rogue_ambush'], [/deflection/i, 2, 'ability_parry'], [/rend/i, 3, 'ability_gouge'],
    [/charge/i, 1, 'ability_warrior_charge'], [/tactical/i, 2, 'spell_nature_enchantarmor'], [/thunder/i, 4, 'ability_thunderclap'],
    [/overpower/i, 1, 'inv_sword_05'], [/anger/i, 2, 'spell_holy_blessingofstamina'], [/deep/i, 3, 'ability_backstab'],
    [/two.hand/i, 2, 'inv_axe_09'], [/impale/i, 3, 'ability_searingarrow'],
    [/axe/i, 1, 'inv_axe_06'], [/sweeping/i, 2, 'ability_rogue_slicedice'], [/mace/i, 3, 'inv_mace_01'], [/sword/i, 4, 'inv_sword_27'],
    [/hamstring/i, 1, 'ability_shockwave'], [/polearm/i, 3, 'inv_weapon_halbard_01'], [/mortal/i, 2, 'ability_warrior_savageblow']
  ];
  const effects = {
    ihs: 'Стоимость Удара героя: −1/−2/−3 ярости.',
    deflection: 'Парирование: +1% за ранг.',
    imprend: 'Урон Кровопускания: +15/25/35%.',
    impthunder: 'Стоимость Удара грома: −1/−2/−4 ярости.',
    deepwounds: 'Прототип: 20/40/60% атаки за 4 тика после подходящего крита. Баланс не согласован.',
    twohand: 'Двуручное оружие: +1% за ранг к подходящим оружейным ударам. Адаптация автобоя.',
    impale: 'Бонус критического урона способностей: +10/20% к критической прибавке.',
    sweeping: 'Прототип: 5 дополнительных ударов по второй цели; 30 ярости. Временные параметры адаптированы, баланс не согласован.'
  };
  const style = document.createElement('style');
  style.textContent = `
  :root{color-scheme:dark;--bg:#100e0b;--ink:#e6d6b8;--muted:#a79577;--line:#655139;--un:#827769}
  body{max-width:1000px;margin:auto;background:radial-gradient(ellipse at top,#302819,#100e0b 65%);color:var(--ink)}
  h1,h2{font-family:Georgia,serif;color:#f5cf76;text-shadow:0 2px 2px #000}h2{font-size:19px;border-bottom:1px solid #655139;padding-bottom:6px}
  button,select,input{background:#201b15;color:#e9d9bb;border:1px solid #8c7047;border-radius:3px}button{cursor:pointer}button:disabled{cursor:default;opacity:.45}
  button:focus-visible,.node:focus-visible{outline:2px solid #f4d486;outline-offset:3px}.warn{font-size:12px;background:#1b1711}
  #tree{position:relative;isolation:isolate;box-sizing:border-box;width:360px;max-width:100%;padding:24px 12px;border:3px ridge #8f7951;background:radial-gradient(ellipse at 50% 20%,#383728aa,transparent 65%),linear-gradient(135deg,#171d17,#302719 60%,#101713);box-shadow:0 12px 35px #0008,inset 0 0 50px #000}
  #tree .row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;overflow:visible;margin:0;height:88px;position:relative;z-index:1}
  #tree .tier{display:none}#tree .node{box-sizing:border-box;position:relative;justify-self:center;align-self:start;display:block;min-width:0;max-width:none;width:54px;height:63px;padding:0;border:0;border-radius:0;background:none;opacity:1}
  #tree .node b,#tree .node small,#tree .node em{display:none}#tree .node>span{position:absolute;right:-5px;top:38px;z-index:2;background:#080808;border:1px solid #675e43;border-radius:2px;padding:0 3px;color:#ddd;font:12px/16px Arial}
  .talent-icon{display:block;box-sizing:border-box;width:48px;height:48px;border:2px solid #666;box-shadow:0 0 0 1px #000, inset 0 0 5px #000;filter:grayscale(1) brightness(.55);background:#252019;object-fit:cover}
  .node.available .talent-icon{border-color:#3fbc46;filter:none;box-shadow:0 0 6px #48bd3844}.node.on .talent-icon{filter:none;border-color:#3fbc46}.node.maxed .talent-icon{border-color:#f2ce57;box-shadow:0 0 7px #d6ad4744}.node.maxed>span{color:#ffdc67}.node.un .talent-icon{filter:grayscale(1) brightness(.3)}
  #tree .node button{position:absolute;top:62px;min-width:24px;min-height:20px;width:24px;height:20px;padding:0;line-height:18px;font-size:14px}#tree .node button[data-d='-1']{left:0}#tree .node button[data-d='1']{left:26px}
  #tree svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}.talent-purchased .talent-icon{animation:talent-flash .5s ease-out}@keyframes talent-flash{50%{box-shadow:0 0 22px 6px #ffe5a0;transform:scale(1.08)}}
  #talent-tip{position:fixed;z-index:10000;box-sizing:border-box;width:290px;max-width:calc(100vw - 16px);padding:12px;border:2px solid #9e8a62;border-radius:5px;background:#080d20f5;color:#eee;font:13px/1.5 Arial;box-shadow:0 5px 20px #000b;pointer-events:none;white-space:pre-line}#talent-tip[hidden]{display:none}
  @media(prefers-reduced-motion:reduce){.talent-purchased .talent-icon{animation:none}}`;
  document.head.appendChild(style);
  const tip = document.createElement('div');
  tip.id = 'talent-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.appendChild(tip);
  let ranks = new Map();
  function arrows() {
    const old = tree.querySelector('svg'); if (old) old.remove();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('aria-hidden', 'true');
    const rect = tree.getBoundingClientRect();
    for (const n of P.TREE.filter(n => n.req)) {
      const a = tree.querySelector('[data-talent="' + n.req + '"]'), b = tree.querySelector('[data-talent="' + n.id + '"]');
      if (!a || !b) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x1 = ra.left - rect.left + 24, y1 = ra.top - rect.top + 48, x2 = rb.left - rect.left + 24, y2 = rb.top - rect.top - 3;
      const path = document.createElementNS(svg.namespaceURI, 'path');
      path.setAttribute('d', 'M'+x1+' '+y1+' V'+((y1+y2)/2)+' H'+x2+' V'+y2+' m-4 -5 l4 5 4 -5');
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', a.classList.contains('maxed') ? '#e4bd52' : '#716343'); path.setAttribute('stroke-width', '2'); svg.appendChild(path);
    }
    tree.appendChild(svg);
  }
  function decorate() {
    tip.hidden = true;
    const current = P.load(localStorage).state, next = new Map();
    for (const node of tree.querySelectorAll('.node')) {
      const plus = node.querySelector('[data-d="1"]'), n = P.TREE.find(n => n.id === plus.dataset.n);
      const entry = catalog.find(([pattern]) => pattern.test(n.en));
      const rank = current.main.talents[n.id] || 0;
      node.dataset.talent = n.id; node.tabIndex = 0;
      node.style.gridColumn = String(entry ? entry[1] : 1);
      node.classList.toggle('available', !plus.disabled); node.classList.toggle('maxed', rank === n.max);
      if (ranks.has(n.id) && rank > ranks.get(n.id)) node.classList.add('talent-purchased');
      next.set(n.id, rank);
      node.setAttribute('aria-label', n.ru + ', ранг ' + rank + ' из ' + n.max);
      node.setAttribute('aria-describedby', 'talent-tip');
      plus.setAttribute('aria-label', 'Добавить ранг: ' + n.ru);
      node.querySelector('[data-d="-1"]').setAttribute('aria-label', 'Убрать ранг: ' + n.ru);
      if (entry) {
        const image = document.createElement('img'); image.className = 'talent-icon'; image.alt = n.ru; image.width = 48; image.height = 48;
        image.src = 'https://wow.zamimg.com/images/wow/icons/large/' + entry[2] + '.jpg';
        image.addEventListener('error', () => { image.removeAttribute('src'); node.dataset.assetMissing = 'true'; }, {once:true});
        node.prepend(image);
      }
      const text = n.ru + '\n' + n.en + '\nРанг ' + rank + '/' + n.max + '\n' + (effects[n.id] || (node.classList.contains('un') ? 'Эффект не реализован в прототипе.' : 'Описание эффекта уточняется.')) + '\n' + (n.req ? 'Требуется полный ранг: ' + P.TREE.find(x => x.id === n.req).ru + '.\n' : '') + 'Нужно очков в предыдущих рядах: ' + 5*(n.tier-1) + '.\n' + node.title;
      node.removeAttribute('title');
      function show() {
        tip.textContent = text; tip.hidden = false;
        const r = node.getBoundingClientRect();
        tip.style.left = Math.max(8, Math.min(innerWidth-tip.offsetWidth-8, r.right+12)) + 'px';
        tip.style.top = Math.max(8, Math.min(innerHeight-tip.offsetHeight-8, r.top)) + 'px';
      }
      node.addEventListener('mouseenter', show); node.addEventListener('focusin', show);
      node.addEventListener('mouseleave', () => { tip.hidden = true; }); node.addEventListener('focusout', () => { tip.hidden = true; });
    }
    ranks = next; requestAnimationFrame(arrows);
  }
  new MutationObserver(records => { if (records.some(r => Array.from(r.addedNodes).some(n => n.nodeType === 1 && n.classList.contains('row')))) decorate(); }).observe(tree, {childList:true});
  addEventListener('resize', () => { tip.hidden = true; arrows(); });
  addEventListener('scroll', () => { tip.hidden = true; }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tip.hidden = true; });
  decorate();
})();
