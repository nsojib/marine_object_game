// World Z decreases from the starting shore (900 m) toward deep sea.
export function vesselSpawnPosition(kind,random=Math.random){
 if([0,1,3,4].includes(kind))return {x:(random()-.5)*900,z:-1200-random()*1600};
 if([8,9].includes(kind))return {x:(random()-.5)*360,z:350+random()*300};
 return {x:(random()-.5)*1300,z:-400-random()*3500};
}

export let VESSEL_COUNTS={};
export function configureDistribution(objects){
 const kinds={merchant_ship:0,ferry:1,tug:2,commercial_fishing_boat:5,sailboat:7,personal_watercraft:8,kayak:9,law_enforcement:13};
 VESSEL_COUNTS=Object.fromEntries(Object.entries(kinds).map(([name,kind])=>[kind,objects[name]]));
}
export function vesselRoster(activeKinds){return activeKinds.flatMap(kind=>Array(VESSEL_COUNTS[kind]??0).fill(kind));}
