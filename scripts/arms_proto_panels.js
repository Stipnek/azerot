/* Layout-only extension. Fury and Protection never allocate or save points.
Reference: wowsims/classic, warrior.json @7779ebbf79dc7f1341e6ab939b28a3402c9a730a.
Rows and columns below are zero-based. Artwork and final tooltip fidelity still need review. */
(function () {
'use strict';
const definitions = [
['fury','Неистовство',164,[
[0,1,5,'Зычный голос','spell_nature_purge'],[0,2,5,'Безжалостность','ability_rogue_eviscerate'],
[1,1,5,'Улучшенный деморализующий крик','ability_warrior_warcry'],[1,2,5,'Необузданный гнев','spell_nature_stoneclawtotem'],
[2,0,3,'Улучшенный рассекающий удар','ability_warrior_cleave'],[2,1,1,'Пронзительный вой','spell_shadow_deathscream'],[2,2,3,'Мания крови','spell_shadow_summonimp'],[2,3,5,'Улучшенный боевой крик','ability_warrior_battleshout'],
[3,0,5,'Специализация на бое двумя оружиями','ability_dualwield'],[3,1,2,'Улучшенная казнь','inv_sword_48'],[3,2,5,'Исступление','spell_shadow_unholyfrenzy'],
[4,0,5,'Улучшенный мощный удар','ability_warrior_decisivestrike'],[4,1,1,'Жажда смерти','spell_shadow_deathpact'],[4,3,2,'Улучшенный перехват','ability_rogue_sprint'],
[5,0,2,'Улучшенная ярость берсерка','spell_nature_ancestralguardian'],[5,2,5,'Шквал','ability_ghoulfrenzy',3,2],
[6,1,1,'Кровожадность','spell_nature_bloodlust',4,1]
]],
['protection','Защита',163,[
[0,1,5,'Специализация на щитах','inv_shield_06'],[0,2,5,'Предчувствие','spell_nature_mirrorimage'],
[1,0,2,'Улучшенная кровавая ярость','ability_racial_bloodrage'],[1,2,5,'Крепость','spell_holy_devotion'],[1,3,5,'Железная воля','spell_magic_magearmor'],
[2,0,1,'Ни шагу назад','spell_holy_ashestoashes',1,0],[2,1,3,'Улучшенный блок щитом','ability_defend',0,1],[2,2,3,'Улучшенный реванш','ability_warrior_revenge'],[2,3,5,'Непокорность','ability_warrior_innerrage'],
[3,0,3,'Улучшенный раскол брони','ability_warrior_sunder'],[3,1,3,'Улучшенное разоружение','ability_warrior_disarm'],[3,2,2,'Улучшенная провокация','spell_nature_reincarnation'],
[4,0,2,'Улучшенная глухая оборона','ability_warrior_shieldwall'],[4,1,1,'Оглушающий удар','ability_thunderbolt'],[4,2,2,'Улучшенный удар щитом','ability_warrior_shieldbash'],
[5,2,5,'Специализация на одноручном оружии','inv_sword_20'],[6,1,1,'Мощный удар щитом','inv_shield_05',4,1]
]]
];
const css = document.createElement('style');
css.textContent = `
#talent-navigation{display:flex;gap:6px;margin:12px 0}#talent-navigation button{flex:1;padding:8px 4px;font-size:12px}#talent-navigation button[aria-pressed=true]{color:#ffdb7c;border-color:#d3b464;background:#3a2f1e}
#talent-panels{display:flex;gap:12px;width:100%;align-items:flex-start;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:#8e754d #191713}
.talent-panel{box-sizing:border-box;flex:0 0 calc((100% - 24px)/3);min-width:0;scroll-snap-align:start;scroll-snap-stop:always}
.talent-panel h2{font:17px Georgia,serif;text-align:center;color:#e9c477;margin:0;padding:9px 4px;border:2px ridge #887451;background:#211c15}
.talent-panel .panel-status{min-height:30px;box-sizing:border-box;text-align:center;color:#b6a98d;font:11px/1.4 Arial;margin:0;padding:7px 3px;background:#181610}
#talent-panels #tree{width:100%;max-width:none}.locked-board{position:relative;box-sizing:border-box;border:3px ridge #988665;padding:20px 14px;background-color:#171610;background-position:center;background-size:100% 100%;box-shadow:inset 0 0 12px #0008}
.locked-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));height:64px;position:relative;z-index:1}
.locked-node{box-sizing:border-box;position:relative;justify-self:center;width:40px;min-width:0;height:48px;min-height:0;padding:0;background:none;border:0;color:#999;cursor:help}
.locked-node img{position:absolute;top:0;left:0;box-sizing:border-box;width:36px;height:36px;border:2px solid #686258;filter:grayscale(1) brightness(.6);background:#252019}
.locked-node span{position:absolute;right:0;top:25px;padding:0 3px;border:1px solid #675e43;background:#080808;font:11px/14px Arial;z-index:2}
.locked-node:focus-visible{outline:2px solid #e7c675;outline-offset:3px}.locked-board>svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0}
@media(max-width:759px){#talent-panels{gap:0}.talent-panel{flex-basis:100%}.locked-row,#talent-panels #tree .row{max-width:330px;margin-left:auto;margin-right:auto}.talent-panel .panel-status{font-size:12px}}
@media(min-width:760px){#talent-navigation{max-width:600px;margin-left:auto;margin-right:auto}}
`;
document.head.appendChild(css);
const tree=document.getElementById('tree');
const navigation=document.createElement('nav');navigation.id='talent-navigation';navigation.setAttribute('aria-label','Ветки талантов');
const panels=document.createElement('div');panels.id='talent-panels';panels.setAttribute('aria-label','Три ветки воина');
tree.before(navigation,panels);
function section(id,name,status){
 const s=document.createElement('section');s.className='talent-panel';s.id='talent-panel-'+id;s.setAttribute('aria-label',name);
 const h=document.createElement('h2');h.textContent=name;const label=document.createElement('p');label.className='panel-status';label.textContent=status;s.append(h,label);panels.append(s);
 const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-controls',s.id);b.setAttribute('aria-pressed',id==='arms'?'true':'false');
 b.addEventListener('click',()=>{panels.scrollTo({left:s.offsetLeft-panels.firstElementChild.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});navigation.append(b);return s;
}
section('arms','Оружие','Работают подготовленные таланты прототипа').append(tree);
const boards=[];
for(const [id,name,background,nodes] of definitions){
 const sectionElement=section(id,name,'Скоро · вложение очков отключено');
 const board=document.createElement('div');board.className='locked-board';board.dataset.readonly='true';board.style.backgroundImage='url(https://wow.zamimg.com/images/wow/talents/backgrounds/classic/'+background+'.jpg)';
 const buttons=new Map();
 for(let row=0;row<7;row++){
  const line=document.createElement('div');line.className='locked-row';
  for(const item of nodes.filter(n=>n[0]===row)){
   const [r,c,max,label,icon]=item;const button=document.createElement('button');button.type='button';button.className='locked-node';button.style.gridColumn=String(c+1);button.setAttribute('aria-disabled','true');button.setAttribute('aria-label',label+', 0 из '+max+'. Пока недоступно.');
   button.title=label+'\nРанг 0/'+max+'\nВетка пока только для просмотра. Эффект в игре не реализован.\nДля ряда нужно очков: '+5*r+'.';
   const img=document.createElement('img');img.alt='';img.width=36;img.height=36;img.src='https://wow.zamimg.com/images/wow/icons/large/'+icon+'.jpg';
   img.addEventListener('error',()=>{img.removeAttribute('src');img.alt=label;button.dataset.assetMissing='true';},{once:true});
   const rank=document.createElement('span');rank.textContent='0/'+max;button.append(img,rank);button.addEventListener('click',e=>e.preventDefault());line.append(button);buttons.set(r+','+c,button);
  }
  board.append(line);
 }
 sectionElement.append(board);boards.push({board,nodes,buttons});
}
function links(){
 for(const {board,nodes,buttons} of boards){
  const old=board.querySelector('svg');if(old)old.remove();const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('aria-hidden','true');const rect=board.getBoundingClientRect();
  for(const n of nodes.filter(n=>n.length===7)){
   const a=buttons.get(n[5]+','+n[6]).querySelector('img').getBoundingClientRect(),b=buttons.get(n[0]+','+n[1]).querySelector('img').getBoundingClientRect();
   const x=a.left-rect.left-board.clientLeft+18,y=a.bottom-rect.top-board.clientTop,tx=b.left-rect.left-board.clientLeft+18,ty=b.top-rect.top-board.clientTop-2;
   const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M'+x+' '+y+' V'+((y+ty)/2)+' H'+tx+' V'+ty+' m-4 -5 l4 5 4 -5');path.setAttribute('fill','none');path.setAttribute('stroke','#716343');path.setAttribute('stroke-width','2');svg.append(path);
  }
  board.append(svg);
 }
}
function active(){const index=innerWidth<=759?Math.min(2,Math.max(0,Math.round(panels.scrollLeft/panels.clientWidth))):0;Array.from(navigation.children).forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
panels.addEventListener('scroll',active,{passive:true});
addEventListener('resize',()=>{links();active();});
requestAnimationFrame(()=>{links();dispatchEvent(new Event('resize'));});
})();
