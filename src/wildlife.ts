import {scoring as config} from './expedition.js';
import * as THREE from 'three';

// Environmental wildlife is separate from scored vessel contacts.
export function addWildlife(scene:THREE.Scene){
 const animals:{g:THREE.Group;x:number;z:number;phase:number;kind:number;wings:THREE.Mesh[]}[]=[];
 const buoys:THREE.Group[]=[];
 const dark=new THREE.MeshStandardMaterial({color:'#334854',roughness:.4}),belly=new THREE.MeshStandardMaterial({color:'#9caeb4',roughness:.65}),white=new THREE.MeshStandardMaterial({color:'#dbddd4'});
 function ellipsoid(g:THREE.Group,mat:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number){const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
 function fin(g:THREE.Group,points:number[],mat:THREE.Material){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat);g.add(m);return m;}
 const finMat=dark.clone();finMat.side=THREE.DoubleSide;
 const counts=config.wildlife,objects=config.objects;
 const birdStart=counts.whales+counts.dolphins+counts.sharks;
 for(let i=0;i<birdStart+objects.birds_flying+objects.birds_surface;i++){
  const kind=i<counts.whales?0:i<counts.whales+counts.dolphins?1:i<birdStart?2:3,g=new THREE.Group(),wings:THREE.Mesh[]=[];
  const x=(Math.random()-.5)*1300,z=650-Math.random()*5150,phase=Math.random()*Math.PI*2;
  if(kind===3){g.userData.surfaceBird=i<birdStart+objects.birds_surface;ellipsoid(g,white,0,0,0,.25,.2,.65);for(const side of [-1,1])wings.push(fin(g,[0,0,0,side*1.8,.1,.3,side*.5,0,-.45],new THREE.MeshStandardMaterial({color:'#c9d0cc',side:THREE.DoubleSide})));}
  else{
   const scale=kind===0?3:kind===1?1:.95;
   ellipsoid(g,dark,0,0,0,.75,.65,2.7);ellipsoid(g,belly,0,-.28,-.2,.61,.3,2.3);
   fin(g,[0,.4,.2,0,1.65,.7,0,.35,1.1],finMat);
   for(const side of [-1,1]){fin(g,[side*.5,0,-.8,side*1.8,-.35,.2,side*.5,-.1,.6],finMat);fin(g,[0,0,2.4,side*1.3,.1,3.1,0,.1,2.8],finMat);}
   if(kind===1)ellipsoid(g,dark,0,-.05,-2.6,.24,.23,.65);
   if(kind===2){fin(g,[0,0,2.3,0,1.2,3.4,0,-.6,3.1],finMat);}
   g.scale.setScalar(scale);
  }
  scene.add(g);animals.push({g,x,z,phase,kind,wings});
 }
 // Navigation markers guide the departure channel; others mark offshore instruments.
 const markers=[...Array(objects.buoys_channel+objects.buoys_offshore).fill(10),...Array(objects.regulatory_marker).fill(15),...Array(objects.channel_marker).fill(16),...Array(objects.safe_water_marker).fill(17)];
 for(let i=0;i<markers.length;i++){
  const g=new THREE.Group(),kind=markers[i],channel=i<objects.buoys_channel,side=i%2?-1:1;g.userData.contactKind=kind;
  g.position.set(channel?side*65:(Math.random()-.5)*1200,0,channel?850-Math.floor(i/2)*(390/Math.max(1,Math.ceil(objects.buoys_channel/2)-1)):-500-Math.random()*3800);
  const paint=new THREE.MeshStandardMaterial({color:channel?(side<0?'#a53c32':'#43795d'):'#c49c36'});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.35,1.4,16),paint);base.position.y=.45;g.add(base);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,3,8),paint);pole.position.y=2;g.add(pole);
  const top=new THREE.Mesh(kind===17?new THREE.SphereGeometry(.6,12,8):kind===15?new THREE.BoxGeometry(1.2,1.4,.18):new THREE.ConeGeometry(.6,1,12),paint);top.position.y=3.5;g.add(top);
  ellipsoid(g,new THREE.MeshStandardMaterial({color:'#f4d88e',emissive:'#d2a54a',emissiveIntensity:.6}),0,3.9,0,.12,.12,.12);g.userData.buoy=true;scene.add(g);buoys.push(g);
 }
 const birds=animals.filter(a=>a.kind===3).map(a=>{a.g.userData.birdContact=true;a.g.userData.airborne=!a.g.userData.surfaceBird;return a.g;});
 return {buoys,birds,update(t:number,player:THREE.Vector3,range:number){
  for(const a of animals){const floating=a.kind===3&&a.g.userData.surfaceBird;const angle=t*(floating?.012:a.kind===3?.09:.025)+a.phase,r=floating?10:a.kind===3?90:35;a.g.position.set(a.x+Math.cos(angle)*r,a.kind===3?(floating?.2+Math.sin(t*1.2+a.phase)*.12:22+Math.sin(angle)*8):-.6+Math.sin(t*.45+a.phase)*(a.kind===0?1.2:.65),a.z+Math.sin(angle)*r);a.g.rotation.y=-angle;a.g.visible=a.g.position.distanceTo(player)<range;for(let i=0;i<a.wings.length;i++)a.wings[i].rotation.z=floating?(i?1:-1)*1.35:Math.sin(t*5+a.phase)*.4*(i?1:-1);}
 }};
}
