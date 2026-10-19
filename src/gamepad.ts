import {sampleGamepad,rumble} from './gamepad-input.js';
export function createController(actions:{pause:()=>void;disconnect:()=>void;identify:(index:number)=>void;view:()=>void;next:()=>void;active:()=>boolean}){
 let previous:boolean[]=[],index=-1;
 const state={connected:false,steer:0,throttle:0,brake:0};
 const hint=document.createElement('div');hint.className='controller-hint';hint.textContent='Xbox: left stick steer/speed | RT/LT speed | A/B/X/Y identify | Menu pause';hint.hidden=true;document.body.append(hint);
 function reset(){state.steer=state.throttle=state.brake=0;}
 return {state,feedback(cause:'wrong'|'crash'){if(state.connected&&!document.hidden)void rumble(navigator.getGamepads?.()[index],cause);},update(){
  const pads=navigator.getGamepads?.()??[];
  const pad=Array.from(pads).find(p=>p?.connected&&p.mapping==='standard');
  if(!pad){if(state.connected)actions.disconnect();state.connected=false;hint.hidden=true;previous=[];index=-1;reset();return;}
  state.connected=true;hint.hidden=false;
  const sample=sampleGamepad(pad,previous);
  if(index!==pad.index){index=pad.index;previous=sample.buttons;reset();return;}
  previous=sample.buttons;reset();
  if(document.hidden||!document.hasFocus())return;
  const pressed=sample.pressed;
  const dialogs=Array.from(document.querySelectorAll<HTMLDialogElement>('dialog[open]'));
  const dialog=(document.activeElement?.closest('dialog[open]') as HTMLDialogElement|null)??dialogs.at(-1);
  if(dialog&&Math.abs(pad.axes[3]??0)>.2)dialog.scrollBy(0,(pad.axes[3]??0)*12);
  if(dialog?.id==='departure-reminder'&&(pressed[1]||pressed[9])){dialog.querySelector<HTMLButtonElement>('#departure-continue')?.click();return;}
  if(dialog?.id==='chocolate-reward'&&(pressed[1]||pressed[9])){dialog.querySelector<HTMLButtonElement>('#chocolate-continue')?.click();return;}
  if(dialog||!actions.active()){
   const root=dialog??document.querySelector('.landing-actions');
   if(!root)return;
   const items=Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled),input')).filter(e=>e.getClientRects().length>0);
   if(pressed[12]||pressed[13]||pressed[14]||pressed[15]){
    const step=pressed[12]||pressed[14]?-1:1,current=items.indexOf(document.activeElement as HTMLElement);
    items[(current<0?0:(current+step+items.length)%items.length)]?.focus();
   }
   if(pressed[0]){const focused=document.activeElement as HTMLElement;const button=items.includes(focused)&&focused.tagName==='BUTTON'?focused:items.find(e=>e.tagName==='BUTTON');button?.click();}
   else if(pressed[1]&&dialog){if(dialog.id==='pause-menu')actions.pause();else dialog.querySelector<HTMLButtonElement>('.close')?.click();}
   else if(pressed[9]&&dialog?.id==='pause-menu')actions.pause();
   return;
  }
  if(pressed[9]){actions.pause();return;}
  state.steer=sample.steer;state.throttle=sample.throttle;state.brake=sample.brake;
  if(pressed[4])actions.view();
  if(pressed[5])actions.next();
  const answer=pressed.slice(0,4).findIndex(Boolean);if(answer>=0)actions.identify(answer);
 }};
}
