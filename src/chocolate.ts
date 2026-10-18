import {dispenserMessage} from './dispenser-status';
import './chocolate.css';
export async function celebrateChocolate(request:()=>Promise<string>){
 const dialog=document.createElement('dialog');dialog.id='chocolate-reward';
 dialog.setAttribute('aria-labelledby','chocolate-title');
 dialog.innerHTML=`<div class="chocolate-stars" aria-hidden="true">✦ · ✧ · ✦</div><div class="chocolate-gift" aria-hidden="true"><div class="chocolate-bar">${'<i></i>'.repeat(6)}</div><div class="chocolate-wrap"><span>NOMaD</span><b>CHOCOLATE</b></div></div><p class="chocolate-kicker">A SWEET ACHIEVEMENT</p><h2 id="chocolate-title">You earned a chocolate!</h2><p class="chocolate-status" role="status">Preparing your treat…</p><div class="chocolate-loading"></div><button class="subtle" id="chocolate-continue" style="margin-top:18px">Continue to pause menu</button>`;
 document.body.append(dialog);dialog.showModal();
 let message='Dispensing is in progress. You can keep playing; please check the machine.';
 let exit:()=>void=()=>{};
 const dismissed=new Promise<void>(resolve=>{exit=resolve;});
 dialog.addEventListener('cancel',e=>{e.preventDefault();exit();});
 dialog.querySelector<HTMLButtonElement>('#chocolate-continue')!.onclick=()=>exit();
 const started=Date.now();
 const operation=(async()=>{
  try{message=dispenserMessage(await request());}catch{message='Could not confirm dispensing. You can keep playing; please check the machine.';}
  if(dialog.isConnected)dialog.querySelector('.chocolate-status')!.textContent=message;
  else window.dispatchEvent(new CustomEvent('dispenser-result',{detail:message}));
  await new Promise(resolve=>setTimeout(resolve,Math.max(1200,4500-(Date.now()-started))));
 })();
 let timer:ReturnType<typeof setTimeout>;
 const watchdog=new Promise<void>(resolve=>{timer=setTimeout(resolve,22000);});
 await Promise.race([operation,dismissed,watchdog]);clearTimeout(timer!);
 dialog.close();dialog.remove();return message;
}
