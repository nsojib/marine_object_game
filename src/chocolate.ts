import './chocolate.css';
export async function celebrateChocolate(request:()=>Promise<string>){
 const dialog=document.createElement('dialog');dialog.id='chocolate-reward';
 dialog.setAttribute('aria-labelledby','chocolate-title');
 dialog.innerHTML=`<div class="chocolate-stars" aria-hidden="true">✦ · ✧ · ✦</div><div class="chocolate-gift" aria-hidden="true"><div class="chocolate-bar">${'<i></i>'.repeat(6)}</div><div class="chocolate-wrap"><span>NOMaD</span><b>CHOCOLATE</b></div></div><p class="chocolate-kicker">A SWEET ACHIEVEMENT</p><h2 id="chocolate-title">You earned a chocolate!</h2><p class="chocolate-status" role="status">Preparing your treat…</p><div class="chocolate-loading"></div>`;
 dialog.addEventListener('cancel',e=>e.preventDefault());document.body.append(dialog);dialog.showModal();
 let message='The machine needs attention. Your reward will not be retried automatically.';
 const started=Date.now();
 try{const status=await request();message=status==='dispensed'?'Your chocolate is ready. Enjoy!':status==='not_eligible'?'Chocolate reward is unavailable.':status==='attempted'?'Dispensing was already attempted. Please check the machine.':message;}catch{message='Could not confirm dispensing. Please check the machine.';}
 dialog.querySelector('.chocolate-status')!.textContent=message;
 await new Promise(resolve=>setTimeout(resolve,Math.max(1500,4500-(Date.now()-started))));
 dialog.close();dialog.remove();return message;
}
