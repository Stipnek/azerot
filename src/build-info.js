(()=>{'use strict';
function mount(){
 const root=document.getElementById('w-more'),meta=document.getElementById('az-build-metadata');
 if(!meta)return;
 const info=JSON.parse(meta.textContent);document.title='Азерот · '+info.version;
 if(!root||document.getElementById('az-build-info'))return;
 const box=document.createElement('section');box.id='az-build-info';box.className='box';
 const heading=document.createElement('h3');heading.textContent='Версия игры';box.append(heading);
 for(const text of ['Открытая сборка: '+info.version,'Коммит: '+info.sourceCommit,'Дата исходников: '+info.sourceDate]){const p=document.createElement('p');p.textContent=text;p.style.overflowWrap='anywhere';box.append(p);}
 const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='Проверить обновление';button.style.minHeight='44px';
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 button.onclick=async()=>{button.disabled=true;status.textContent='Проверяем…';const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);try{const response=await fetch(new URL('version.json',document.baseURI),{cache:'no-store',signal:abort.signal});if(!response.ok)throw Error('HTTP '+response.status);const latest=await response.json();if(!/^[a-f0-9]{40}$/.test(latest.sourceCommit||''))throw Error('Неизвестный формат версии');status.textContent=latest.sourceCommit===info.sourceCommit?'Открыта актуальная опубликованная сборка.':'На сервере опубликована другая сборка: '+latest.sourceCommit.slice(0,7)+'. Эта проверка не перезагружает игру и не меняет сохранение.';}catch(_){status.textContent='Не удалось проверить обновление. Можно продолжать играть.';}finally{clearTimeout(timer);button.disabled=false;}};
 box.append(button,status);root.append(box);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
