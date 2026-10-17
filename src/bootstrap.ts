import {configureLife} from './life.js';
import {configureDistribution} from './spawn-zones.js';
import {configureScoring} from './expedition.js';
async function boot(){
 try{
  const response=await fetch('/api/config',{cache:'no-store'});
  if(!response.ok)throw new Error('Configuration unavailable');
  const config=await response.json();
  configureScoring(config);
  configureLife(config);
  configureDistribution(config.objects);
  await import('./main');
 }catch{
  const app=document.getElementById('app')!;
  app.innerHTML='<main style="font:16px system-ui;padding:32px;color:#eef4ff;background:#101e37"><h1>Unable to load game settings</h1><p>Check that the game server is running, then retry.</p><button id="retry-config">Retry</button></main>';
  document.getElementById('retry-config')!.onclick=()=>location.reload();
 }
}
void boot();
