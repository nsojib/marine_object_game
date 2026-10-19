const indicator=document.createElement('div');
indicator.className='dispenser-indicator';
indicator.setAttribute('role','status');
indicator.innerHTML='<span aria-hidden="true">&#127851;</span><span class="dispenser-light"></span><span class="dispenser-label">Checking...</span>';
document.body.append(indicator);
let checking=false;
async function refresh(){
 if(checking||document.hidden)return;checking=true;
 try{
  const response=await fetch('/api/dispenser-status',{cache:'no-store',signal:AbortSignal.timeout(3000)});
  if(!response.ok)throw new Error();
  const status=await response.json();
  if(status.error)throw new Error();
  const state=!status.enabled?'off':status.connected?'connected':'disconnected';
  indicator.dataset.state=state;
  indicator.querySelector('.dispenser-label')!.textContent=state==='off'?'Rewards: medals':state==='connected'?(status.busy?'Dispensing...':'USB connected'):'USB disconnected';
  indicator.title='Chocolate dispenser USB connection. Chocolate availability is checked when dispensing; refill at any time.';
 }catch{
  indicator.dataset.state='disconnected';
  indicator.querySelector('.dispenser-label')!.textContent='Dispenser unavailable';
 }finally{checking=false;}
}
void refresh();
setInterval(()=>void refresh(),5000);
document.addEventListener('visibilitychange',()=>void refresh());
