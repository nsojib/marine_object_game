// Arrow keys navigate menus; gameplay retains its steering controls.
window.addEventListener('keydown',event=>{
 if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey)return;
 const target=event.target as HTMLElement;
 const nameInput=target instanceof HTMLInputElement&&target.id==='player-name';
 if(target.closest('input,textarea,select,[contenteditable="true"]')&&!(nameInput&&(event.key==='ArrowUp'||event.key==='ArrowDown')))return;
 const dialogs=Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]'));
 const root=target.closest('dialog[open]')??dialogs.at(-1)??(document.body.classList.contains('landing')?document.querySelector('.landing-actions'):null);
 if(!root)return;
 const buttons=Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type="hidden"])')).filter(button=>button.getClientRects().length>0&&getComputedStyle(button).visibility!=='hidden');
 if(!buttons.length)return;
 event.preventDefault();event.stopImmediatePropagation();
 const current=buttons.indexOf(document.activeElement as HTMLElement),step=event.key==='ArrowUp'||event.key==='ArrowLeft'?-1:1;
 const next=current<0?(step>0?0:buttons.length-1):(current+step+buttons.length)%buttons.length;
 buttons[next].focus();buttons[next].scrollIntoView({block:'nearest',inline:'nearest'});
},true);
