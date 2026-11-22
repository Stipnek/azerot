(()=>{'use strict';
function mount(){
 const root=document.getElementById('pa-entry');if(!root)return;
 const $=id=>document.getElementById(id),enter=$('pa-enter'),settings=$('pa-settings'),open=$('pa-settings-open');
 const blocked=Array.from(document.querySelectorAll('body>main,body>nav,body>#fsb,body>.rot')).map(el=>[el,el.inert]);
 blocked.forEach(([el])=>{el.inert=true;});
 const start=performance.now();root.dataset.startedAt=String(start);
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 let home=null,panel=null;
 function restore(){if(home&&panel){home.replaceWith(panel);home=null;panel=null;}if(!root.hidden)open.focus({preventScroll:true});}
 settings.addEventListener('close',restore);
 $('pa-settings-close').onclick=()=>settings.close();
 open.onclick=()=>{
  panel=$('az-settings');if(!panel){$('pa-feedback').textContent='Настройки звука пока недоступны.';return;}
  home=document.createComment('Pocket Azeroth settings home');panel.before(home);$('pa-settings-host').append(panel);
  try{settings.showModal();}catch(_){restore();$('pa-feedback').textContent='Не удалось открыть настройки.';}
 };
 enter.onclick=()=>{
  if(root.dataset.state!=='ready'||settings.open)return;
  root.hidden=true;document.documentElement.removeAttribute('data-pa-entry');
  blocked.forEach(([el,inert])=>{el.inert=inert;});
  const target=document.querySelector('#select:not([hidden]) #sel-enter, #create:not([hidden]) #cr-go');
  if(target)target.focus({preventScroll:true});
 };
 $('pa-retry').onclick=()=>location.reload();
 function gameReady(){return new Promise((resolve,reject)=>{
  const deadline=performance.now()+15000;
  function check(){
   const visible=Array.from(document.querySelectorAll('#create,#select,#world')).some(el=>!el.hidden&&getComputedStyle(el).display!=='none');
   if(visible&&window.AzerothAudio){resolve();return;}
   if(performance.now()>=deadline){reject(new Error('Game startup timeout'));return;}
   setTimeout(check,50);
  }check();
 });}
 const artwork=Promise.race([$('pa-art').decode(),delay(5000).then(()=>{throw new Error('Artwork timeout');})]).catch(()=>root.classList.add('pa-no-art'));
 Promise.all([delay(1000),gameReady(),artwork]).then(async()=>{
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  root.dataset.state='transition';$('pa-loading').classList.add('pa-leave');
  if(!reduced)await delay(160);
  $('pa-loading').hidden=true;$('pa-actions').hidden=false;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  $('pa-actions').classList.add('pa-arrive');
  if(!reduced)await delay(220);
  root.dataset.readyAt=String(performance.now());root.dataset.state='ready';document.documentElement.dataset.paEntry='ready';
  enter.disabled=false;open.disabled=false;
 }).catch(()=>{root.dataset.state='error';$('pa-loading').hidden=true;$('pa-failure').hidden=false;$('pa-retry').focus({preventScroll:true});});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
