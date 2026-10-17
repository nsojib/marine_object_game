import * as THREE from 'three';
import {trafficStep} from './traffic-motion.js';
import {overlaps,footprints} from './collision.js';
import {WORLD} from './expedition.js';
type Contact={kind:number;model:THREE.Group;identified:boolean};
type Footprint={x:number;z:number;yaw:number;width:number;length:number};
type Route={contact:Contact;points:THREE.Vector2[];next:number;speed:number;wake:THREE.Mesh;moving:boolean};
export class BoatTraffic{
 private routes:Route[]=[];
 private wakeGeometry=new THREE.PlaneGeometry(1,1);
 private wakeMaterial=new THREE.MeshBasicMaterial({color:'#bfdbef',transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide});
 constructor(private scene:THREE.Scene){}
 reset(contacts:Contact[]){
  for(const route of this.routes)this.scene.remove(route.wake);
  this.routes=[];
  const speeds:Record<number,number>={0:2.5,1:4,2:1.8,5:2.2,6:5,7:2,8:4,13:4};
  for(const contact of contacts){
   const speed=speeds[contact.kind];if(!speed)continue;
   const p=contact.model.position;
   const points=[[190,-170],[-140,-260],[-180,120],[120,160]].map(([x,z])=>new THREE.Vector2(THREE.MathUtils.clamp(p.x+x,WORLD.minX+110,WORLD.maxX-110),THREE.MathUtils.clamp(p.z+z,WORLD.minZ+110,WORLD.maxZ-110)));
   const wake=new THREE.Mesh(this.wakeGeometry,this.wakeMaterial);wake.visible=false;this.scene.add(wake);
   this.routes.push({contact,points,next:0,speed,wake,moving:false});
  }
 }
 update(dt:number,active:boolean,contacts:Contact[],player:Footprint,islands:{x:number;z:number;r:number}[],structures:Footprint[]){
  for(const route of this.routes){
   const c=route.contact,p=c.model.position;
   if(c.identified){route.wake.visible=false;continue;}
   if(active){
    const goal=route.points[route.next];if(Math.hypot(goal.x-p.x,goal.y-p.z)<25)route.next=(route.next+1)%route.points.length;
    const target=route.points[route.next];
    const proposed=trafficStep(p.x,p.z,c.model.rotation.y,target.x,target.y,route.speed,dt);
    const [width,length]=footprints[c.kind],body={...proposed,width:width+1,length:length+1};
    const blocked=proposed.x<WORLD.minX+width||proposed.x>WORLD.maxX-width||proposed.z<WORLD.minZ+length||proposed.z>WORLD.maxZ-length||islands.some(i=>Math.hypot(proposed.x-i.x,proposed.z-i.z)<i.r+length/2)||structures.some(s=>overlaps(body,s))||overlaps(body,{...player,width:player.width+3,length:player.length+3})||contacts.some(other=>{if(other===c||other.identified||other.model.userData.birdContact)return false;const [w,l]=footprints[other.kind];return overlaps(body,{x:other.model.position.x,z:other.model.position.z,yaw:other.model.rotation.y,width:w,length:l});});
    route.moving=!blocked;
    if(!blocked){p.x=proposed.x;p.z=proposed.z;c.model.rotation.y=proposed.yaw;}
    else{route.next=(route.next+1)%route.points.length;}
   }
  }
 }
 updateWakes(){
  for(const route of this.routes){const c=route.contact;route.wake.visible=!c.identified&&c.model.visible&&route.moving;
   const [width,length]=footprints[c.kind],yaw=c.model.rotation.y;
   route.wake.position.set(c.model.position.x+Math.sin(yaw)*(length/2+7),.08,c.model.position.z+Math.cos(yaw)*(length/2+7));
   route.wake.rotation.set(-Math.PI/2,0,-yaw);route.wake.scale.set(width*.7,14,1);
  }
 }
}
