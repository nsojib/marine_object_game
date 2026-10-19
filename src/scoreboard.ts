import {dispenserMessage} from './dispenser-status';
import {scoring as scoreConfig,recognitionScore} from './expedition.js';
import {addObjectGuide} from './object-guide';
import {MAX_LIFE,LIFE_LOSS} from './life.js';
import './scoreboard.css';
type Result={run_id:string;player_name:string;score:number;duration_seconds:number;correct_identifications:number};
type Entry={rank:number;player_name:string;score:number};
const pendingKey='nomad-pending-scores';
export function setupScoreboard(onOpen:()=>void){
 const actions=document.querySelector<HTMLElement>('.landing-actions')!;
 const label=document.createElement('label');label.className='player-name-label';label.htmlFor='player-name';label.textContent='Your name (optional)';
 const input=document.createElement('input');input.id='player-name';input.maxLength=32;input.required=false;input.setAttribute('autocomplete','off');input.placeholder='Name (optional)';
 input.value='';try{localStorage.removeItem('nomad-player-name');}catch{}
 window.addEventListener('pageshow',()=>{input.value='';input.setCustomValidity('');});
 actions.prepend(label,input);
 const instructions=document.createElement('div');instructions.className='play-instructions';instructions.innerHTML='<strong>Explore the sea. Match the photo.</strong>';
 actions.append(instructions);
 const dialog=document.createElement('dialog');dialog.id='leaderboard-dialog';dialog.innerHTML='<button type="button" class="close" aria-label="Close leaderboard">×</button><h2>Leaderboard</h2><p class="board-caption">Top 10 expeditions · total points</p><p class="board-status" role="status"></p><ol class="board-list"></ol><button type="button" class="board-refresh">Refresh</button>';
 document.body.append(dialog);
 const status=dialog.querySelector<HTMLElement>('.board-status')!,list=dialog.querySelector<HTMLOListElement>('.board-list')!;
 dialog.querySelector<HTMLButtonElement>('.close')!.onclick=()=>dialog.close();
 let loading=false;
 async function refresh(){
  if(loading)return;loading=true;status.textContent='Loading scores…';list.replaceChildren();
  try{
   const response=await fetch('/api/leaderboard?limit=10',{signal:AbortSignal.timeout(22000)});if(!response.ok)throw new Error();
   const data=await response.json() as {entries:Entry[]};
   for(const entry of data.entries){const row=document.createElement('li');for(const value of [String(entry.rank),entry.player_name,entry.score.toFixed(1)]){const cell=document.createElement('span');cell.textContent=value;row.append(cell);}list.append(row);}
   status.textContent=data.entries.length?'':'No saved expeditions yet. Be the first!';
  }catch{status.textContent='Scores are temporarily unavailable. You can still play. Try Refresh later.';}finally{loading=false;}
 }
 dialog.querySelector<HTMLButtonElement>('.board-refresh')!.onclick=()=>void refresh();
 function open(){onOpen();dialog.showModal();void refresh();}
 function button(parent:Element,className=''){const b=document.createElement('button');b.type='button';b.className=className;b.textContent='Leaderboard';b.onclick=open;parent.append(b);}
 button(actions,'landing-leaderboard');button(document.getElementById('viewport')!,'leaderboard-open');
 const rubric=document.createElement('dialog');rubric.id='rubric-dialog';rubric.innerHTML=`<button class="close" aria-label="Close scoring rubric">×</button><h2>Scoring</h2><div class="score-equation">New score = max(0, current score + reward − penalty)</div><p>Apply this after every answer or crash. Your final score is the score when the game ends.</p><h3>Correct answer</h3><div class="score-equation">Reward = ${scoreConfig.base_reward} + distance bonus + depth bonus + speed bonus</div><table><thead><tr><th>Bonus</th><th>Equation</th></tr></thead><tbody><tr><td>Distance</td><td>min(${scoreConfig.distance_bonus_max}, distance in meters / ${scoreConfig.distance_meters_per_point})</td></tr><tr><td>Depth</td><td>${scoreConfig.depth_bonus_max} × ocean progress</td></tr><tr><td>Speed</td><td>min(${scoreConfig.speed_bonus_max}, speed in knots / ${scoreConfig.speed_knots_per_point})</td></tr></tbody></table><p>min means use the smaller value. Ocean progress runs from 0 at shore to 1 in deep sea (5,400 m forward from the start). Rewards are rounded to one decimal place.</p><p><strong>Example:</strong> At 350 m, halfway to deep sea, at 12 knots: <strong>${recognitionScore(350,-1800,false,12/1.94384)} points.</strong></p><h3>Mistakes</h3><div class="score-penalties"><p>Wrong answer<strong>−${scoreConfig.wrong_penalty} points · −${LIFE_LOSS.wrong} life</strong></p><p>Crash<strong>−${scoreConfig.crash_penalty} points · −${LIFE_LOSS.collision} life</strong></p></div><p class="score-footer">Start at 0 points and ${MAX_LIFE} life. Score cannot fall below 0 and has no upper limit. At 0 life, the game ends.</p>`;
 document.body.append(rubric);rubric.querySelector<HTMLButtonElement>('.close')!.onclick=()=>rubric.close();
 const scoring=document.createElement('button');scoring.className='rubric-open';scoring.type='button';scoring.textContent='Scoring';scoring.onclick=()=>rubric.showModal();const menuButtons=document.createElement('div');menuButtons.className='landing-menu-buttons';menuButtons.append(actions.querySelector('.landing-leaderboard')!,scoring);actions.append(menuButtons);addObjectGuide(menuButtons);

 button(document.querySelector('#summary .summary-actions')!);
 const saveStatus=document.createElement('p');saveStatus.id='score-save-status';saveStatus.setAttribute('role','status');document.querySelector('#summary .summary-actions')!.before(saveStatus);
 const retry=document.createElement('button');retry.type='button';retry.textContent='Retry saving';retry.hidden=true;saveStatus.after(retry);

 const speed=document.createElement('div');speed.className='speed-hud';speed.setAttribute('aria-label','Vehicle speed');speed.innerHTML='<strong>0.0</strong><span>knots</span><small>0.0 km/h</small>';document.getElementById('viewport')!.append(speed);
 const life=document.createElement('div');life.className='life-hud';life.innerHTML=`<label for="life-meter">LIFE <strong>${MAX_LIFE} / ${MAX_LIFE}</strong></label><progress id="life-meter" max="${MAX_LIFE}" value="${MAX_LIFE}"></progress>`;document.getElementById('viewport')!.append(life);
 let name='',runId='',pending:Result[]=[];
 try{const parsed=JSON.parse(localStorage.getItem(pendingKey)??'[]');if(Array.isArray(parsed))pending=parsed;}catch{}
 function persist(){try{localStorage.setItem(pendingKey,JSON.stringify(pending));}catch{}}
 let saving=false;
 async function flush(){
  if(saving||!pending.length)return;saving=true;retry.hidden=true;saveStatus.textContent='Saving score and checking chocolate reward…';
  try{
   while(pending.length){
    const result=pending[0];
    const response=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result),signal:AbortSignal.timeout(22000)});
    if(!response.ok)throw new Error();
    const saved=await response.json();saveStatus.textContent=`Score saved as ${saved.player_name}.`;
    // Threshold outcomes were already shown during play; do not replay stale machine errors.
    if(saved.record_chocolate_status&&saved.record_chocolate_status!=='not_eligible')saveStatus.textContent+=' New record bonus: '+dispenserMessage(saved.record_chocolate_status);
    pending=pending.filter(p=>p.run_id!==result.run_id);persist();
   }

  }catch{saveStatus.textContent='Your score is waiting to save. You can keep playing; ask a helper or try again.';retry.hidden=false;}finally{saving=false;}
 }
 retry.onclick=()=>void flush();window.addEventListener('online',()=>void flush());void flush();
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('start')!.click();}});
 return {
  begin(){const animals=['Dolphin','Orca','Sea Turtle','Manta Ray','Blue Whale','Sea Otter','Seahorse','Octopus','Seal','Narwhal','Beluga','Clownfish'];name=input.value.trim().replace(/\s+/g,' ')||animals[Math.floor(Math.random()*animals.length)];input.setCustomValidity('');input.blur();runId=crypto.randomUUID();saveStatus.textContent='';return true;},
  async chocolate(score:number,duration:number,correct:number,retry=false){
   const response=await fetch('/api/chocolate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({run_id:runId,player_name:name,score,duration_seconds:Math.min(480,duration),correct_identifications:correct,retry}),signal:AbortSignal.timeout(22000)});
   if(!response.ok)throw new Error('Chocolate request failed');
   return (await response.json()).chocolate_status as string;
  },
  finish(score:number,duration:number,correct:number){if(!runId)return;pending.push({run_id:runId,player_name:name,score,duration_seconds:Math.min(480,duration),correct_identifications:correct});runId='';input.value='';input.setCustomValidity('');persist();void flush();},
  updateLife(value:number){life.querySelector('strong')!.textContent=`${value} / ${MAX_LIFE}`;life.querySelector('progress')!.value=value;life.classList.toggle('low-life',value<=2);},
  updateSpeed(mps:number){speed.querySelector('strong')!.textContent=(Math.abs(mps)*1.94384).toFixed(1);speed.querySelector('small')!.textContent=`${(Math.abs(mps)*3.6).toFixed(1)} km/h${mps<-.05?' · REVERSE':''}`;}
 };
}
