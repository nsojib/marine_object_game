export const CLASSES = ['Merchant ship','Ferry','Tug','Barge','Dredger','Commercial fishing boat','Pleasure craft','Sailboat','Personal watercraft','Kayak / canoe','Buoy','Lighthouse','Wind turbine'];
export function updateSpeed(speed, forward, reverse, stop, dt) {
 if (stop) return 0;
 const direction = Number(forward) - Number(reverse);
 if (direction) return Math.max(-18, Math.min(42, speed + direction * (direction > 0 ? 12 : 22) * dt));
 return Math.sign(speed) * Math.max(0, Math.abs(speed) - 1.2 * dt);
}
export function angleDifference(a,b) { return Math.atan2(Math.sin(a-b),Math.cos(a-b)); }
export function predict(kind,distance,id,visibility=780) {
 const certainty=Math.max(0,Math.min(1,1-distance/visibility));
 // Stable contact-specific confusion avoids rerolling confidence every frame.
 const ambiguous=id%3===0;
 const distractor=(kind+1+id%(CLASSES.length-1))%CLASSES.length;
 const weights=CLASSES.map((name,i)=>({name,weight:
  .15+((Math.sin(id*17+i*31)+1)/2)*.7+
  (i===kind?.9+certainty*1.8:0)+
  (kind<CLASSES.length&&i===distractor?(ambiguous?3.6:1.1)*(1.2-certainty*.2):0)
 }));
 weights.sort((a,b)=>b.weight-a.weight);
 const top=weights.slice(0,5),sum=top.reduce((s,x)=>s+x.weight,0);
 return top.map(x=>({name:x.name,probability:x.weight/sum}));
}
