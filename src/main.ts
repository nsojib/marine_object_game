import * as THREE from 'three';
import { CLASSES, angleDifference, predict, updateSpeed } from './rules.js';
import './style.css';
import { BoatTraffic } from './traffic';
import { evolvingWeather } from './weather.js';
import { createWeatherEffects } from './weather-effects';
import { addStructures } from './structures';
import { loadFreeAssets, applyFreeAsset } from './free-assets';
import { WORLD, depthProgress, expeditionConditions, recognitionScore, applyScore } from './expedition.js';
import { addWildlife } from './wildlife';
import './overlays.css';
import './landing.css';
import './navy.css';
import { setupOverlays } from './overlays';
import { GameAudio } from './audio';
import { overlaps, footprints } from './collision.js';
const sound=new GameAudio();
import { createVessel, createASV } from './vessels';
import { addSky, addIsland } from './scenery';

const $ = <T extends HTMLElement = HTMLElement>(id:string)=>document.getElementById(id) as T;
document.querySelector('#app')!.innerHTML=`
<header><a class="brand" href="./"><span class="brand-icon">≈</span> NOMaD <span class="brand-sub">EXPLORER</span></a><div class="mission"><span class="live-dot"></span> FIELD EXPEDITION <span class="muted">/</span> NORTH ATLANTIC</div><button id="help" class="subtle">How to play <span>?</span></button></header>
<main><section class="viewport" id="viewport"><div id="scene"></div><div class="view-top"><span><i class="live-dot"></i> ASV–01 <span class="muted"> / <span id="camera-view">THIRD PERSON</span></span></span><span id="conditions">CLEAR · CALM</span></div><div class="compass"><span>NW</span><span>315</span><b id="heading">000° N</b><span>045</span><span>NE</span></div><div class="reticle"><i></i><i></i></div><div id="target-box"><span id="target-label"></span></div><div class="coordinates" id="coordinates">41° 24′ N<br>070° 32′ W</div><div class="view-bottom"><span><i class="live-dot"></i> LIVE FEED <b id="camera-fov">70° FOV</b></span><span>RECOGNITION BEAM <b>12°</b></span></div><div id="toast" role="status"></div><div class="intro" id="intro">
<div class="landing-title"><p class="landing-kicker">OCEAN EXPLORATION GAME</p><h1>NOMaD <span>Explorer</span></h1></div><div class="landing-actions"><button class="primary" id="start"><span aria-hidden="true">▶</span> Play</button><p>WASD to sail · 1–5 to identify</p></div></div><div class="pause-banner" id="pause-banner" hidden>EXPEDITION PAUSED</div></section>
<aside><div class="panel-title"><span>EXPEDITION 001</span><span class="tag">EXPLORATION</span></div><div class="stats"><div><label>MISSION TIME</label><strong id="timer">08:00</strong></div><div><label>TOTAL SCORE</label><strong id="score">0<span> / 100</span></strong></div></div><section class="map-section"><div class="section-label">NAVIGATION <span id="explored">0% explored</span></div><canvas id="map" width="560" height="400" aria-label="Navigation map showing your vessel, islands and discovered contacts"></canvas><div class="map-legend"><span><i class="dot mint"></i> ASV</span><span><i class="dot"></i> Contact</span><span>1.8 × 6.0 km</span></div></section><section class="recognition"><div class="section-label">OBJECT RECOGNITION <span class="tag">SIMULATED ML</span></div><div class="target-title"><h2 id="contact">Scanning horizon</h2><span id="range">— m</span></div><p id="target-hint">Steer toward a contact to begin recognition.</p><div id="predictions"></div><label class="input-label" for="classification">YOUR IDENTIFICATION</label><select id="classification"><option value="">Select an object class…</option>${CLASSES.map((x,i)=>`<option value="${i}">${x}</option>`).join('')}<option value="${CLASSES.length}">Unknown / label it</option></select><input id="unknown-label" maxlength="80" placeholder="Describe this unknown object" aria-label="Unknown object label" hidden><button id="identify" class="primary" disabled>Confirm identification <span>↗</span></button><div class="reward" id="reward">Identify farther away. Earn more points.</div></section><div class="contacts"><span>CONTACTS IDENTIFIED</span><b id="identified">00 <span>/ 35</span></b></div></aside></main>
<footer><div class="speed"><span id="speed">0.0</span><small>KNOTS</small><div class="speed-track"><i id="speed-fill"></i></div></div><div class="controls"><span><kbd>W</kbd><kbd>S</kbd> Throttle</span><span><kbd>A</kbd><kbd>D</kbd> Steer</span><span><kbd>Space</kbd> Stop</span><span><kbd>Tab</kbd> Next target</span></div><div class="environment"><label>WEATHER <select id="weather"><option>Auto</option><option>Clear</option><option>Rain</option><option>Fog</option></select></label><label>SEA <select id="sea"><option>Auto</option><option>Calm</option><option>Moderate</option><option>Rough</option></select></label><button id="view-toggle" class="subtle" title="Switch camera (V)" aria-label="Switch to first-person view" aria-pressed="false">View: TPS [V]</button><button id="sound" class="subtle" aria-pressed="false">Sound on</button><button id="pause" class="subtle" disabled>Pause Ⅱ</button></div></footer>
<dialog id="help-dialog"><button id="close-help" class="close">×</button><span class="eyebrow">FIELD GUIDE</span><h2>Read the horizon.</h2><p>Hold W / ↑ to accelerate, S / ↓ to brake and reverse, and A / D or ← / → to steer. Your vessel coasts when you release the throttle. Press Space to stop immediately. Press V to switch between third-person chase view and first-person onboard view, or use the View button in Controls (C).</p><p>Center a contact in the recognition beam, click a visible vessel, or press Tab to cycle visible contacts. Compare its silhouette with the simulated top-five predictions, numbered 1–5. Press the matching number key or double-click a predicted class to identify it immediately. You can also choose from the full list and confirm.</p><p>The expedition score is capped at 100. Distance earns up to 6 points, deep-sea recognition adds up to 2, and correctly labeled unknown objects add 2. Mistakes cost 1 point. Buoys, lighthouses, and wind turbines are scored contacts. Wildlife remains scenery. A wrong guess leaves the contact available to retry.</p><p>Weather fronts, rolling fog, and sun glare evolve over time. Speed and rough seas add camera spray. Fog reduces visibility; rough seas rock the camera. The mission lasts eight active minutes. Escape pauses. Hidden tabs pause automatically. Toggle overlays with M (map), R (objects), I (mission), C (controls), or H (all instruments). Press P to reveal the panel menu, or F1 for help. Controls hide automatically when unused.</p><button id="help-done" class="primary">Ready to explore ↗</button></dialog>
<dialog id="summary"><span class="eyebrow">EXPEDITION COMPLETE</span><h2>A little more<br>ocean, understood.</h2><div id="summary-stats"></div><div class="summary-actions"><button id="download" class="subtle">↓ Download log</button><button id="restart" class="primary">Explore again ↗</button></div></dialog>`;

setupOverlays();
const weatherEffects=createWeatherEffects($('viewport'));

const scene=new THREE.Scene(); scene.background=new THREE.Color('#adc7cd'); scene.fog=new THREE.Fog('#adc7cd',650,1600);
const camera=new THREE.PerspectiveCamera(70,1,0.3,3500);
let renderer:THREE.WebGLRenderer;
try { renderer=new THREE.WebGLRenderer({antialias:true}); } catch { $('intro').innerHTML='<h1>WebGL unavailable</h1><p>This game needs a browser with WebGL 2 and hardware acceleration enabled.</p>'; throw new Error('WebGL 2 is required'); }
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; $('scene').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xe6efff,0x26344d,1.5)); const sun=new THREE.DirectionalLight(0xffe4ba,2.5);sun.position.set(-350,500,-500);scene.add(sun);
const atmosphere=addSky(scene,renderer);
renderer.toneMappingExposure=.9;
function mesh(g:THREE.BufferGeometry,c:THREE.ColorRepresentation,parent:THREE.Object3D,x=0,y=0,z=0){const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:c,roughness:.8}));m.position.set(x,y,z);parent.add(m);return m;}
function box(parent:THREE.Object3D,w:number,h:number,d:number,c:THREE.ColorRepresentation,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),c,parent,x,y,z);}
const oceanGeo=new THREE.PlaneGeometry(14000,14000,180,180);oceanGeo.rotateX(-Math.PI/2);const ocean=mesh(oceanGeo,0x082447,scene);(ocean.material as THREE.MeshStandardMaterial).roughness=.48;(ocean.material as THREE.MeshStandardMaterial).metalness=.12;
const waterTime={value:0};
(ocean.material as THREE.MeshStandardMaterial).onBeforeCompile=shader=>{
 shader.uniforms.waterTime=waterTime;
 shader.vertexShader='varying vec3 waterPosition;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwaterPosition = position;');
 shader.fragmentShader='uniform float waterTime; varying vec3 waterPosition;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
 vec3 rippleNormal=vec3(cos(waterPosition.x*.19+waterTime)*.14+sin(waterPosition.z*.43-waterTime)*.08,1.,sin(waterPosition.z*.23+waterTime*.8)*.15);
 normal=normalize(mat3(viewMatrix)*rippleNormal);
 `);
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float ripple = sin(waterPosition.x * 0.7 + sin(waterPosition.z * 0.31 + waterTime) * 2.0 + waterTime * 1.6) * sin(waterPosition.z * 0.9 - waterTime);
 float glint = pow(max(0.0, ripple), 12.0);
 float fade = 1.0 - smoothstep(50.0, 1100.0, vViewPosition.z);
 diffuseColor.rgb *= 0.92 + ripple * 0.1 * fade;
 diffuseColor.rgb += vec3(0.10, 0.18, 0.28) * glint * fade * 0.12;`);
};
const islands=[{x:0,z:1570,r:560}];
const structures=addStructures(scene);
islands.forEach((island,index)=>addIsland(scene,island,index*3.1));
const wildlife=addWildlife(scene);
// Departure pier at the sheltered southern end of the channel.
box(scene,13,2,95,0x736b5b,-28,1,935);for(let i=0;i<7;i++)box(scene,1,5,1,0x484e48,-34,0,900+i*12);
const traffic=new BoatTraffic(scene);
const asv=createASV();scene.add(asv);
type Contact={id:number;kind:number;model:THREE.Group;discovered:boolean;identified:boolean;distance:number;bearing:number;firstSeen:number};
let cameraHeading=0,lastCollision=-10;let firstPerson=false;
const cameraOffset=new THREE.Vector3(),cameraAim=new THREE.Vector3();
function toggleView(){
 firstPerson=!firstPerson;cameraHeading=heading;
 camera.fov=firstPerson?50:70;camera.updateProjectionMatrix();
 $('camera-fov').textContent=`${camera.fov}\u00b0 FOV`;
 $('view-toggle').textContent=firstPerson?'View: FPS [V]':'View: TPS [V]';
 $('view-toggle').setAttribute('aria-pressed',String(firstPerson));
 $('view-toggle').setAttribute('aria-label',firstPerson?'Switch to third-person view':'Switch to first-person view');
 $('camera-view').textContent=firstPerson?'ONBOARD CAMERA':'THIRD PERSON';
 if(started&&!ended)toast(firstPerson?'First-person view - V to switch':'Third-person view - V to switch');
}
$('view-toggle').onclick=toggleView;
let contacts:Contact[]=[],selected:Contact|undefined;let started=false,paused=false,ended=false,elapsed=0,score=0,speed=0,heading=0,targetSince=0;const player=new THREE.Vector3(0,0,WORLD.startZ),keys=new Set<string>(),explored=new Set<string>();let events:Record<string,unknown>[]=[];let weather='Clear',sea='Calm';let weatherState=evolvingWeather(0,WORLD.startZ,0);const visibility=()=>weatherState.visibility;
function spawn(){contacts.forEach(c=>{scene.remove(c.model);c.model.traverse(o=>{if(!c.model.userData.buoy&&!c.model.userData.fixedContact&&o instanceof THREE.Mesh&&!o.userData.sharedAsset)o.geometry.dispose();});});contacts=[];for(let i=0;i<12;i++){const kind=i<10?i:CLASSES.length,g=createVessel(kind===CLASSES.length?10:kind);let x=0,z=0;do{x=(Math.random()-.5)*1500;z=550-i*420+(Math.random()-.5)*180;}while(structures.obstacles.some(a=>Math.abs(x-a.x)<a.width/2+50&&Math.abs(z-a.z)<a.length/2+50)||islands.some(a=>Math.hypot(x-a.x,z-a.z)<a.r+45)||Math.hypot(x,z-WORLD.startZ)<100);if(i===0){x=-75+Math.random()*70;z=400;}if(i===7){x=170;z=-2200;}g.position.set(x,0,z);g.rotation.y=Math.random()*Math.PI;scene.add(g);contacts.push({id:i+1,kind,model:g,discovered:false,identified:false,distance:0,bearing:0,firstSeen:0});}for(const model of wildlife.buoys){model.visible=true;scene.add(model);contacts.push({id:contacts.length+1,kind:10,model,discovered:false,identified:false,distance:0,bearing:0,firstSeen:0});}for(const {model,kind} of structures.targets){model.visible=true;scene.add(model);contacts.push({id:contacts.length+1,kind,model,discovered:false,identified:false,distance:0,bearing:0,firstSeen:0});}traffic.reset(contacts);}
spawn();
void loadFreeAssets().then(()=>{for(const contact of contacts){if(!contact.identified)applyFreeAsset(contact.model,contact.kind);}});
function toast(message:string){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>$('toast').classList.remove('show'),3500);}let toastTimer=0;
function select(c:Contact|undefined){if(c!==selected){selected=c;targetSince=elapsed;$<HTMLSelectElement>('classification').value='';$('unknown-label').hidden=true;}updatePanel();}
function visible(){return contacts.filter(c=>!c.identified&&c.distance<visibility()&&Math.abs(c.bearing)<THREE.MathUtils.degToRad(35)&&!occluded(c));}
function occluded(c:Contact){const dx=c.model.position.x-player.x,dz=c.model.position.z-player.z;return islands.some(a=>{const t=Math.max(0,Math.min(1,((a.x-player.x)*dx+(a.z-player.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(player.x+dx*t-a.x,player.z+dz*t-a.z)<a.r*.85;});}
function updatePanel(){
 const active=!!selected&&started&&!paused&&!ended;
 const choice=$<HTMLSelectElement>('classification').value;
 $<HTMLButtonElement>('identify').disabled=!active||!choice;
 $('contact').textContent=selected?`Object ${String(selected.id).padStart(2,'0')}`:'Scanning horizon';
 $('range').textContent=selected?`${Math.round(selected.distance)} m`:'— m';
 $('target-hint').textContent=selected?'Press 1–5 or double-click a prediction to identify it.':'Steer toward a contact to begin recognition.';
 const predictions=selected?predict(selected.kind,selected.distance,selected.id,visibility()):[];
 const panel=$('predictions');
 panel.dataset.contact=selected?String(selected.id):'';
 if(!predictions.length){
  if(!panel.querySelector('.empty-prediction'))panel.innerHTML='<div class="empty-prediction"><span>⌁</span> No contact in view<br><small>The ocean rewards the curious.</small></div>';
 }else{
  if(panel.querySelector('.empty-prediction'))panel.replaceChildren();
  const present=new Set(predictions.map(p=>String(CLASSES.indexOf(p.name))));
  panel.querySelectorAll<HTMLButtonElement>('button').forEach(button=>{if(!present.has(button.dataset.class!))button.remove();});
  predictions.forEach((prediction,index)=>{
   const value=String(CLASSES.indexOf(prediction.name));
   let button=panel.querySelector<HTMLButtonElement>(`button[data-class="${value}"]`);
   if(!button){
    button=document.createElement('button');button.type='button';button.className='prediction';button.dataset.class=value;
    button.innerHTML='<div><span></span><b></b></div><div class="bar"><i></i></div>';
   }
   button.disabled=!active;
   button.setAttribute('aria-pressed',String(choice===value));
   button.setAttribute('aria-label',`${index+1}: ${prediction.name}. Press ${index+1} or double-click to identify.`);
   button.setAttribute('aria-keyshortcuts',String(index+1));
   button.querySelector('span')!.textContent=`${index+1}.  ${prediction.name}`;
   button.querySelector('b')!.textContent=`${Math.round(prediction.probability*100)}%`;
   button.querySelector('i')!.style.width=`${prediction.probability*100}%`;
   if(panel.children[index]!==button)panel.insertBefore(button,panel.children[index]??null);
  });
 }
 $('reward').textContent=selected?`+${recognitionScore(selected.distance,player.z,selected.kind===CLASSES.length)} pts for a correct identification`:'Identify farther away. Earn more points.';
}
let predictionClickContact:number|undefined;
$('predictions').onclick=event=>{
 const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-class]');
 if(!button||button.disabled||!selected||!started||paused||ended)return;
 if(event.detail<=1)predictionClickContact=selected.id;
 $<HTMLSelectElement>('classification').value=button.dataset.class!;
 $('unknown-label').hidden=true;
 updatePanel();
};
$('predictions').ondblclick=event=>{
 const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-class]');
 if(!button||button.disabled||!selected||selected.id!==predictionClickContact||!started||paused||ended)return;
 $<HTMLSelectElement>('classification').value=button.dataset.class!;
 $('unknown-label').hidden=true;
 submitIdentification();
 predictionClickContact=undefined;
};
window.addEventListener('keydown',event=>{
 if(!/^[1-5]$/.test(event.key)||event.repeat||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
 if((event.target as HTMLElement).closest('input,select,textarea,[contenteditable]')||document.querySelector('dialog[open]'))return;
 if(!started||paused||ended||!selected||selected.identified||Math.abs(selected.bearing)>.105||!visible().includes(selected))return;
 const panel=$('predictions');
 if(panel.dataset.contact!==String(selected.id))return;
 // Use the displayed ranking, which can differ from a freshly calculated prediction.
 const button=panel.querySelectorAll<HTMLButtonElement>('button[data-class]')[Number(event.key)-1];
 if(!button||button.disabled)return;
 event.preventDefault();
 predictionClickContact=undefined;
 $<HTMLSelectElement>('classification').value=button.dataset.class!;
 $('unknown-label').hidden=true;
 submitIdentification();
 updatePanel();
});
$('classification').onchange=()=>{$('unknown-label').hidden=$<HTMLSelectElement>('classification').value!==String(CLASSES.length);updatePanel();};
$('identify').onclick=submitIdentification;
function submitIdentification(){if(!selected||paused||ended||!started)return;const input=$<HTMLSelectElement>('classification').value;if(!input)return;const label=$<HTMLInputElement>('unknown-label').value.trim();if(input===String(CLASSES.length)&&!label){toast('Add a short label for this unknown contact.');$('unknown-label').focus();return;}const guess=Number(input),correct=guess===selected.kind,points=correct?recognitionScore(selected.distance,player.z,selected.kind===CLASSES.length):-1;score=applyScore(score,points);sound.cue(correct?'correct':'wrong');events.push({object_id:selected.id,true_class:CLASSES[selected.kind]??'unknown',distance_m:Math.round(selected.distance),depth_progress:depthProgress(player.z),weather:weather.toLowerCase(),sea_state:sea.toLowerCase(),weather_effects:{...weatherState},model_top5:predict(selected.kind,selected.distance,selected.id,visibility()).map(p=>[p.name,p.probability]),human_prediction:CLASSES[guess]??'unknown',label:guess===CLASSES.length?label:null,correct,points,time_to_decision_s:+(elapsed-targetSince).toFixed(2),session_time_s:+elapsed.toFixed(2)});toast(correct?`+${points} pts · ${guess===CLASSES.length?'Unknown labeled':CLASSES[guess]+' identified'}`:'−1 pt · Look closer and try again.');if(correct){selected.identified=true;selected.model.visible=false;scene.remove(selected.model);select(undefined);}else{targetSince=elapsed;}updateStats();if(contacts.every(c=>c.identified))finish();};
function updateStats(){$('score').innerHTML=`${score.toLocaleString()}<span> / 100</span>`;$('identified').innerHTML=`${String(contacts.filter(c=>c.identified).length).padStart(2,'0')} <span>/ 35</span>`;}
function start(){document.body.classList.remove('landing');window.dispatchEvent(new Event('expedition-start'));sound.start();started=true;ended=false;paused=false;$('intro').hidden=true;$<HTMLButtonElement>('pause').disabled=false;toast('Expedition underway · Hold W to get moving');}
$('start').onclick=start;
function pause(value:boolean){if(!started||ended)return;paused=value;keys.clear();$('pause-banner').hidden=!value;$('pause').textContent=value?'Resume ▷':'Pause Ⅱ';updatePanel();}
$('pause').onclick=()=>{sound.start();pause(!paused);};
$('sound').onclick=()=>{sound.start();sound.muted=!sound.muted;$('sound').textContent=sound.muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(sound.muted));};
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause(true);});
$('help').onclick=()=>{pause(true);$<HTMLDialogElement>('help-dialog').showModal();};const closeHelp=()=>$<HTMLDialogElement>('help-dialog').close();$('close-help').onclick=closeHelp;$('help-done').onclick=closeHelp;
function adaptConditions(){
 const automatic=expeditionConditions(player.z,score);
 const w=$<HTMLSelectElement>('weather').value,ss=$<HTMLSelectElement>('sea').value;
 weatherState=evolvingWeather(elapsed,player.z,score,w,ss);
 weather=weatherState.weather;sea=weatherState.sea;
 atmosphere.setHaze(Math.min(.95,weatherState.cloud*.75+weatherState.fog*.25));
 const fog=scene.fog as THREE.Fog;
 fog.color.copy(new THREE.Color('#adc7dd').lerp(new THREE.Color('#677c94'),weatherState.cloud));
 fog.near=350-weatherState.fog*270-weatherState.rain*130;
 fog.far=1650-weatherState.fog*900-weatherState.rain*450;
 sun.intensity=2.5-weatherState.cloud*1.7;
 renderer.toneMappingExposure=.9-weatherState.cloud*.13;
 $('conditions').textContent=`${automatic.zone} | ${weather.toUpperCase()} | ${sea.toUpperCase()}`;
 const color=new THREE.Color('#0c3053').lerp(new THREE.Color('#04132f'),depthProgress(player.z));
 (ocean.material as THREE.MeshStandardMaterial).color.copy(color);
}
$('weather').onchange=adaptConditions;$('sea').onchange=adaptConditions;
function exploredPercent(){return Math.round(explored.size/3000*100);}
function finish(){ended=true;keys.clear();speed=0;$<HTMLButtonElement>('pause').disabled=true;const correct=events.filter(e=>e.correct);const avg=correct.length?Math.round(correct.reduce((s,e)=>s+Number(e.distance_m),0)/correct.length):0;$('summary-stats').innerHTML=[['Final score',score.toLocaleString()],['Contacts discovered',contacts.filter(c=>c.discovered).length+'/'+contacts.length],['Correct identifications',correct.length],['Unknowns labeled',correct.filter(e=>e.true_class==='unknown').length],['Average recognition',avg+' m'],['Ocean explored',exploredPercent()+'%']].map(([a,b])=>`<div><span>${a}</span><strong>${b}</strong></div>`).join('');$<HTMLDialogElement>('summary').showModal();updatePanel();}
$('summary').addEventListener('cancel',e=>e.preventDefault());
$('download').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,created_at:new Date().toISOString(),score,duration_s:elapsed,map_explored_percent:exploredPercent(),objects_discovered:contacts.filter(c=>c.discovered).length,events},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='nomad-expedition.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
$('restart').onclick=()=>{$<HTMLDialogElement>('summary').close();elapsed=score=speed=heading=cameraHeading=0;lastCollision=-10;player.set(0,0,WORLD.startZ);events=[];explored.clear();spawn();select(undefined);updateStats();start();};
window.addEventListener('keydown',e=>{if((e.target as HTMLElement).matches('input,select')||$<HTMLDialogElement>('help-dialog').open||$<HTMLDialogElement>('summary').open)return;if(['Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key===' '&&started&&!paused&&!ended){speed=0;keys.delete('w');keys.delete('arrowup');$('speed').textContent='0.0';$('speed-fill').style.width='0%';}if(e.key.toLowerCase()==='v'){if(!e.repeat&&started&&!ended){e.preventDefault();toggleView();}return;}if(e.key==='Escape'){sound.start();pause(!paused);return;}if(e.key==='Tab'&&started&&!paused){const v=visible().filter(c=>Math.abs(c.bearing)<.105);select(v[(v.indexOf(selected!)+1)%v.length]);}keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
const raycaster=new THREE.Raycaster();renderer.domElement.addEventListener('click',e=>{if(!started||paused||ended)return;const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const candidates=visible().filter(c=>Math.abs(c.bearing)<.105);const hit=raycaster.intersectObjects(candidates.map(c=>c.model),true)[0];if(hit){let o:THREE.Object3D|null=hit.object;while(o&&!candidates.some(c=>c.model===o))o=o.parent;select(candidates.find(c=>c.model===o));}});
const map=$<HTMLCanvasElement>('map'),ctx=map.getContext('2d')!;
function drawMap(){const w=map.width,h=map.height,s=h/6000,px=(x:number)=>w/2+x*s,pz=(z:number)=>(z-WORLD.minZ)*s;ctx.fillStyle='#101e35';ctx.fillRect(0,0,w,h);ctx.fillStyle='#1a2e4c';for(const cell of explored){const [x,z]=cell.split(',').map(Number);ctx.fillRect(px(x*60-900),pz(z*60+WORLD.minZ),60*s+1,60*s+1);}ctx.strokeStyle='#26414a';ctx.lineWidth=1;for(let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}for(const a of islands){ctx.beginPath();ctx.ellipse(px(a.x),pz(a.z),a.r*s,a.r*s*.8,.3,0,Math.PI*2);ctx.fillStyle='#626f83';ctx.fill();ctx.strokeStyle='#819080';ctx.stroke();}for(const a of structures.obstacles){ctx.fillStyle='#8795a8';ctx.fillRect(px(a.x-a.width/2),pz(a.z-a.length/2),Math.max(2,a.width*s),Math.max(2,a.length*s));}ctx.save();ctx.translate(px(player.x),pz(player.z));ctx.rotate(heading);ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,visibility()*s,-Math.PI/2-.61,-Math.PI/2+.61);ctx.closePath();ctx.fillStyle='#7bd9bc15';ctx.fill();ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,visibility()*s,-Math.PI/2-.105,-Math.PI/2+.105);ctx.closePath();ctx.fillStyle='#7bd9bc25';ctx.fill();ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-5,6);ctx.lineTo(0,3);ctx.lineTo(5,6);ctx.closePath();ctx.fillStyle='#a1efd3';ctx.fill();ctx.restore();for(const c of contacts.filter(c=>c.discovered&&!c.identified)){ctx.fillStyle=c.identified?'#d8b379':c===selected?'#a1efd3':'#d1dcdf';ctx.beginPath();ctx.arc(px(c.model.position.x),pz(c.model.position.z),c===selected?5:3,0,7);ctx.fill();}ctx.fillStyle='#b5c9cb';ctx.font='18px monospace';ctx.fillText('N ↑',20,28);ctx.font='13px monospace';ctx.fillText('DEEP SEA',w-115,28);ctx.fillText('DEPARTURE SHORE',20,h-18);}
const bbox=new THREE.Box3(),v=new THREE.Vector3();
function targetBox(){
 const el=$('target-box');
 const hide=()=>{el.style.display='none';};
 if(!selected||!started||paused||ended||selected.identified||Math.abs(selected.bearing)>.105||!selected.model.visible){hide();return;}
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
 selected.model.updateWorldMatrix(true,true);
 // Project each component separately; a single world box expands when the ship rotates.
 selected.model.traverse(object=>{
  if(!(object instanceof THREE.Mesh))return;
  if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();
  bbox.copy(object.geometry.boundingBox!);
  for(let i=0;i<8;i++){
   v.set(i&1?bbox.max.x:bbox.min.x,i&2?bbox.max.y:bbox.min.y,i&4?bbox.max.z:bbox.min.z).applyMatrix4(object.matrixWorld).project(camera);
   if(v.z < -1 || v.z > 1)return;
   minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);
  }
 });
 if(!Number.isFinite(minX)||maxX < -1||minX > 1||maxY < -1||minY > 1){hide();return;}
 const r=$('scene').getBoundingClientRect(),pad=2;
 el.style.display='block';el.style.left=`${(minX+1)/2*r.width-pad}px`;el.style.top=`${(1-maxY)/2*r.height-pad}px`;
 el.style.width=`${(maxX-minX)/2*r.width+pad*2}px`;el.style.height=`${(maxY-minY)/2*r.height+pad*2}px`;
 $('target-label').textContent=`Object ${selected.id} · ${Math.round(selected.distance)} m`;
}
function blocked(x:number,z:number,yaw:number):string|undefined{
 if(x<WORLD.minX+8||x>WORLD.maxX-8||z<WORLD.minZ+8||z>WORLD.maxZ-8)return 'Survey boundary reached';
 if(islands.some(a=>Math.hypot(x-a.x,z-a.z)<a.r+8))return 'Shoreline blocks your path';
 const boat={x,z,yaw:-yaw,width:4.3,length:7};
 if(structures.obstacles.some(obstacle=>overlaps(boat,obstacle)))return 'Harbor structure blocks your path';
 const obstacle=contacts.find(c=>{if(c.identified)return false;const [width,length]=footprints[c.kind];return overlaps(boat,{x:c.model.position.x,z:c.model.position.z,yaw:c.model.rotation.y,width,length});});
 return obstacle?`Collision with object ${String(obstacle.id).padStart(2,'0')}`:undefined;
}
function moveBoat(dt:number,steer:number){
 // Substeps stop even small kayaks being skipped at maximum speed.
 const steps=Math.max(1,Math.ceil(Math.abs(speed)*dt/.5));
 for(let i=0;i<steps;i++){
  const nextHeading=heading+steer*dt/steps*.65*(.3+Math.abs(speed)/42);
  const nx=player.x+Math.sin(nextHeading)*speed*dt/steps,nz=player.z-Math.cos(nextHeading)*speed*dt/steps;
  const obstruction=blocked(nx,nz,nextHeading);
  if(obstruction){
   speed=0;
   if(elapsed-lastCollision>4){lastCollision=elapsed;sound.cue('collision');toast(`${obstruction}. Boat stopped - steer toward open water.`);}

   break;
  }
  heading=nextHeading;player.set(nx,0,nz);
 }
}
function resize(){const r=$('scene').getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe($('scene'));resize();
let last=performance.now(),uiTick=0;const pos=oceanGeo.attributes.position;const rainGeo=new THREE.BufferGeometry(),rainArray=new Float32Array(900);for(let i=0;i<900;i+=3){rainArray[i]=(Math.random()-.5)*160;rainArray[i+1]=Math.random()*90;rainArray[i+2]=(Math.random()-.5)*160;}rainGeo.setAttribute('position',new THREE.BufferAttribute(rainArray,3));const rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0xcce0e3,size:.35,transparent:true,opacity:.55}));scene.add(rain);
renderer.setAnimationLoop((now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;const active=started&&!paused&&!ended;if(active){elapsed=Math.min(WORLD.duration,elapsed+dt);const throttle=keys.has('w')||keys.has('arrowup'),brake=keys.has('s')||keys.has('arrowdown');speed=updateSpeed(speed,throttle,brake,keys.has(' '),dt);const steer=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));moveBoat(dt,steer);for(let x=0;x<30;x++)for(let z=0;z<100;z++){const dx=x*60-870-player.x,dz=z*60+WORLD.minZ+30-player.z;if(Math.hypot(dx,dz)<visibility()&&Math.abs(angleDifference(Math.atan2(dx,-dz),heading))<.61)explored.add(`${x},${z}`);}if(elapsed>=WORLD.duration)finish();}
traffic.update(dt,active,contacts,{x:player.x,z:player.z,yaw:-heading,width:4.3,length:7},islands,structures.obstacles);
structures.update(elapsed);adaptConditions();wildlife.update(elapsed,player,visibility());ocean.position.set(player.x,0,player.z);
const t=started?elapsed:now/1000,amp=weatherState.waveHeight;waterTime.value=t;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,Math.sin(x*.025+t*1.4)*amp+Math.cos(z*.04+t)*amp*.6);}pos.needsUpdate=true;
asv.position.copy(player);asv.position.y=Math.sin(t*2)*amp*.25;asv.rotation.set(Math.sin(t)*amp*.02,-heading,Math.cos(t*1.7)*amp*.035);
if(!started){ const distance=camera.aspect<.8?1.4:1; camera.position.set(player.x+11*distance,8*distance,player.z+14*distance); camera.up.set(0,1,0); camera.lookAt(player.x,1,player.z); }else if(firstPerson){
 cameraHeading=heading;
 cameraOffset.set(0,2.8,-1.6).applyQuaternion(asv.quaternion).add(asv.position);
 camera.position.copy(cameraOffset);
 cameraAim.set(0,2.8,-150).applyQuaternion(asv.quaternion).add(asv.position);
 camera.up.set(0,1,0).applyQuaternion(asv.quaternion);
 camera.lookAt(cameraAim);
}else{
 cameraHeading+=angleDifference(heading,cameraHeading)*(1-Math.exp(-2.5*dt));
 camera.up.set(0,1,0);
 camera.position.set(player.x-Math.sin(cameraHeading)*11,6.4+Math.sin(t*1.6)*amp,player.z+Math.cos(cameraHeading)*11);
 camera.lookAt(player.x+Math.sin(cameraHeading)*150,5.5+Math.sin(t)*amp,player.z-Math.cos(cameraHeading)*150);
}
 atmosphere.follow(player);

for(const c of contacts){const dx=c.model.position.x-player.x,dz=c.model.position.z-player.z;c.distance=Math.hypot(dx,dz);c.bearing=angleDifference(Math.atan2(dx,-dz),heading);if(!c.model.userData.fixedContact){c.model.position.y=Math.sin(t*1.2+c.id)*amp*.6;c.model.rotation.z=Math.sin(t+c.id)*amp*.025;}const inView=c.distance<visibility()&&Math.abs(c.bearing)<.61&&!occluded(c);c.model.visible=!c.identified&&c.distance<visibility()&&!occluded(c);if(active&&inView&&!c.discovered){c.discovered=true;c.firstSeen=elapsed;}}
if(active){const available=visible();if(selected&&(!available.includes(selected)||Math.abs(selected.bearing)>.105))select(undefined);if(!selected){const beam=available.filter(c=>Math.abs(c.bearing)<.105).sort((a,b)=>Math.abs(a.bearing)-Math.abs(b.bearing));if(beam.length)select(beam[0]);}}
rain.visible=weatherState.rain>.05;(rain.material as THREE.PointsMaterial).opacity=weatherState.rain*.6;rain.position.copy(player);if(active&&rain.visible){for(let i=1;i<900;i+=3){rainArray[i]-=dt*(30+weatherState.rain*40);if(rainArray[i]<0)rainArray[i]=90;}rainGeo.attributes.position.needsUpdate=true;}
traffic.updateWakes();weatherEffects.update(elapsed,cameraHeading,speed,started&&!ended?weatherState:{glare:0,swell:0,rain:0});sound.update(speed,active);renderer.render(scene,camera);targetBox();uiTick+=dt;if(uiTick>.15){uiTick=0;drawMap();updatePanel();const left=Math.ceil(WORLD.duration-elapsed);$('timer').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;$('speed').textContent=(speed*1.944).toFixed(1);$('speed-fill').style.width=`${Math.abs(speed)/42*100}%`;$('heading').textContent=`${String(Math.round((THREE.MathUtils.radToDeg(heading)%360+360)%360)).padStart(3,'0')}°`;$('explored').textContent=`${exploredPercent()}% explored`;$('coordinates').innerHTML=`N ${(41.4-player.z/111000).toFixed(4)}°<br>W ${(70.53-player.x/83000).toFixed(4)}°`;}});



