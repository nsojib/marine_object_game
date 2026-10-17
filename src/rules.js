import {SELECTED_CLASSES} from './selected-classes.js';
export const CLASSES = ['Merchant ship','Ferry','Tug','Barge','Dredger','Commercial fishing boat','Pleasure craft','Sailboat','Personal watercraft','Kayak / canoe','Buoy','Lighthouse','Wind turbine','Law enforcement','Bird','Regulatory mark','Channel marker','Safe-water marker'];
// Keep historical IDs stable for geometry, collision footprints, and saved logs.
export const ACTIVE_CLASSES=CLASSES.map((name,kind)=>({name,kind})).filter(c=>SELECTED_CLASSES.includes(c.name));
export const VESSEL_KINDS=ACTIVE_CLASSES.filter(c=>c.kind<10||c.name==='Law enforcement').map(c=>c.kind);
export const MIN_CRUISE_SPEED=2/1.94384;
export function updateSpeed(speed, forward, brake, _stop, dt) {
 const acceleration=brake?-22:forward?12:-1.2;
 return Math.max(MIN_CRUISE_SPEED,Math.min(42,speed+acceleration*dt));
}
export function angleDifference(a,b) { return Math.atan2(Math.sin(a-b),Math.cos(a-b)); }
export function predict(kind,distance,id,visibility=780) {
 if(!ACTIVE_CLASSES.length)return [];
 const certainty=Math.max(0,Math.min(1,1-distance/visibility));
 // Stable contact-specific confusion avoids rerolling confidence every frame.
 const ambiguous=id%3===0;
 const alternatives=ACTIVE_CLASSES.filter(c=>c.kind!==kind);
 const distractor=alternatives[id%alternatives.length]?.kind??kind;
 const weights=ACTIVE_CLASSES.map(({name,kind:i})=>({name,weight:
  .15+((Math.sin(id*17+i*31)+1)/2)*.7+
  (i===kind?.9+certainty*1.8:0)+
  (kind<CLASSES.length&&i===distractor?(ambiguous?3.6:1.1)*(1.2-certainty*.2):0)
 }));
 weights.sort((a,b)=>b.weight-a.weight);
 const top=weights.slice(0,4),sum=top.reduce((s,x)=>s+x.weight,0);
 return top.map(x=>({name:x.name,probability:x.weight/sum}));
}
