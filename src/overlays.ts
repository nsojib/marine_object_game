export function setupOverlays(){
 document.body.classList.add('landing');
 const viewport=document.getElementById('viewport')!;
 const aside=document.querySelector('aside')!;
 const map=aside.querySelector<HTMLElement>('.map-section')!;map.id='map-overlay';map.classList.add('hud-panel');
 const recognition=aside.querySelector<HTMLElement>('.recognition')!;recognition.id='recognition-overlay';recognition.classList.add('hud-panel');
 const scoreRow=document.createElement('div');scoreRow.className='recognition-score';const scoreLabel=document.createElement('span');scoreLabel.textContent='SCORE';scoreRow.append(scoreLabel,aside.querySelector('#score')!);recognition.prepend(scoreRow);
 const controls=document.querySelector('footer')!;controls.id='controls-overlay';controls.classList.add('hud-panel');
 viewport.append(map,recognition,controls);aside.remove();
 const toolbar=document.createElement('nav');toolbar.className='hud-toolbar';toolbar.setAttribute('aria-label','Overlay visibility');
 const panels=[{id:'map-overlay',key:'m',label:'Map'},{id:'recognition-overlay',key:'r',label:'Objects'},{id:'controls-overlay',key:'c',label:'Controls'}];
 toolbar.innerHTML=panels.map(p=>`<button type="button" data-panel="${p.id}" aria-controls="${p.id}" aria-pressed="true" title="Toggle ${p.label} (${p.key.toUpperCase()})"><kbd>${p.key.toUpperCase()}</kbd>${p.label}</button>`).join('')+'<button type="button" id="toggle-hud" aria-pressed="true" title="Show or hide all instruments (H)"><kbd>H</kbd><span>Hide HUD</span></button>';
 viewport.append(toolbar);
 let hudVisible=true;
 const hidden=new Set<string>(['controls-overlay']);
 const menu=document.createElement('button');menu.type='button';menu.className='panel-menu';menu.textContent='Panels Â· P';menu.setAttribute('aria-label','Show panel controls (P)');menu.setAttribute('aria-expanded','false');viewport.append(menu);
 let menuTimer=0,controlsTimer=0;
 function revealMenu(){viewport.classList.add('menu-open');menu.setAttribute('aria-expanded','true');clearTimeout(menuTimer);menuTimer=window.setTimeout(()=>{viewport.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');},4000);}
 function scheduleControls(){clearTimeout(controlsTimer);controlsTimer=window.setTimeout(()=>{if(controls.matches(':hover')||controls.contains(document.activeElement)){scheduleControls();return;}hidden.add('controls-overlay');update();},5000);}
 menu.onclick=revealMenu;toolbar.addEventListener('pointermove',revealMenu);controls.addEventListener('pointerleave',scheduleControls);
 window.addEventListener('expedition-start',()=>{hidden.add('controls-overlay');viewport.classList.remove('menu-open');update();});
 function update(){
  viewport.classList.toggle('hud-hidden',!hudVisible);
  for(const p of panels){const shown=hudVisible&&!hidden.has(p.id);document.getElementById(p.id)!.hidden=!shown;toolbar.querySelector(`[data-panel="${p.id}"]`)!.setAttribute('aria-pressed',String(shown));}
  const toggle=document.getElementById('toggle-hud')!;toggle.setAttribute('aria-pressed',String(hudVisible));toggle.querySelector('span')!.textContent=hudVisible?'Hide HUD':'Show HUD';
  document.querySelectorAll<HTMLInputElement>('[data-start-panel]').forEach(input=>{input.checked=!hidden.has(input.dataset.startPanel!);});
 }
 function togglePanel(id:string){if(!hudVisible){hudVisible=true;hidden.delete(id);}else if(hidden.has(id))hidden.delete(id);else hidden.add(id);update();if(id==='controls-overlay'&&!hidden.has(id))scheduleControls();}
 toolbar.addEventListener('click',event=>{const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');if(!button)return;if(button.dataset.panel)togglePanel(button.dataset.panel);else{hudVisible=!hudVisible;update();}});
 document.querySelectorAll<HTMLInputElement>('[data-start-panel]').forEach(input=>input.addEventListener('change',()=>{if(input.checked)hidden.delete(input.dataset.startPanel!);else hidden.add(input.dataset.startPanel!);update();}));
 window.addEventListener('keydown',event=>{
  if(document.body.classList.contains('landing')||event.repeat||event.ctrlKey||event.altKey||event.metaKey||(event.target as HTMLElement).closest('input,select,textarea,[contenteditable="true"]')||document.querySelector('dialog[open]'))return;
  const key=event.key.toLowerCase();const panel=panels.find(p=>p.key===key);
  if(key==='p'){event.preventDefault();revealMenu();return;}
  if(key==='f1'){event.preventDefault();document.getElementById('help')!.click();return;}
  if(panel){event.preventDefault();togglePanel(panel.id);}else if(key==='h'){event.preventDefault();hudVisible=!hudVisible;update();}
 });
 update();
}
