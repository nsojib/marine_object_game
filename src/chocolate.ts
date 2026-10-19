import {dispenserMessage} from './dispenser-status';
import './chocolate.css';
export async function celebrateChocolate(request:(retry?:boolean)=>Promise<string>){
 const dialog=document.createElement('dialog');dialog.id='chocolate-reward';
 dialog.setAttribute('aria-labelledby','chocolate-title');
 dialog.innerHTML=`<div class="chocolate-stars" aria-hidden="true">✦ · ✧ · ✦</div><div class="milestone-medal" aria-hidden="true"><span>★</span></div><div class="chocolate-gift" hidden aria-hidden="true"><div class="chocolate-bar">${'<i></i>'.repeat(6)}</div><div class="chocolate-wrap"><span>NOMaD</span><b>CHOCOLATE</b></div></div><p class="chocolate-kicker">OCEAN EXPLORER</p><h2 id="chocolate-title">Milestone reached!</h2><p class="chocolate-status" role="status">Great navigation and sharp eyes. Keep exploring!</p><div class="chocolate-loading"></div><button class="subtle" id="chocolate-retry" hidden>Refilled? Try again</button><button class="subtle" id="chocolate-continue" autofocus style="margin-top:18px">Continue to pause menu</button>`;
 document.body.append(dialog);dialog.showModal();
 let message='Milestone reached! Great navigation and sharp eyes. Keep exploring!';
 let exit:()=>void=()=>{};
 const dismissed=new Promise<void>(resolve=>{exit=resolve;});
 dialog.addEventListener('cancel',e=>{e.preventDefault();exit();});
 dialog.querySelector<HTMLButtonElement>('#chocolate-continue')!.onclick=()=>exit();
 let waiting=false;
 const retryButton=dialog.querySelector<HTMLButtonElement>('#chocolate-retry')!;
 async function attempt(retry=false){
  if(waiting)return;waiting=true;
  retryButton.hidden=true;
  dialog.querySelector('.milestone-machine-note')?.remove();
  dialog.querySelector<HTMLElement>('.chocolate-loading')!.hidden=false;
  let status='unavailable';
  try{status=await request(retry);}catch{}
  if(status==='dispensed'){
   message=dispenserMessage(status);
   dialog.querySelector<HTMLElement>('.milestone-medal')!.hidden=true;
   dialog.querySelector<HTMLElement>('.chocolate-gift')!.hidden=false;
   dialog.querySelector('#chocolate-title')!.textContent='A sweet reward for your skills!';
   dialog.querySelector('.chocolate-kicker')!.textContent='CHOCOLATE READY';
  }else{
   message='Milestone reached! Great navigation and sharp eyes. Keep exploring!';
   if(status!=='not_eligible'){
    const note=document.createElement('p');note.className='milestone-machine-note';note.textContent=status==='unavailable'?'Chocolate reward unavailable right now.':dispenserMessage(status);dialog.querySelector('.chocolate-status')!.after(note);
   }
  }
  if(dialog.isConnected)dialog.querySelector('.chocolate-status')!.textContent=message;
  else window.dispatchEvent(new CustomEvent('dispenser-result',{detail:message}));
  dialog.querySelector<HTMLElement>('.chocolate-loading')!.hidden=true;
  waiting=false;
  retryButton.hidden=!['timeout','blocked','busy','hardware','invalid_command','command_too_long'].includes(status);
 }
 retryButton.onclick=()=>void attempt(true);
 void attempt();
 await dismissed;
 dialog.close();dialog.remove();return message;
}
