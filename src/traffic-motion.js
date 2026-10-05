import {angleDifference} from './rules.js';
export function trafficStep(x,z,yaw,targetX,targetZ,speed,dt){
 const desired=Math.atan2(-(targetX-x),-(targetZ-z));
 const turn=Math.max(-.3*dt,Math.min(.3*dt,angleDifference(desired,yaw)));
 const nextYaw=yaw+turn;
 const alignment=Math.max(.15,Math.cos(angleDifference(desired,nextYaw)));
 return {x:x-Math.sin(nextYaw)*speed*dt*alignment,z:z-Math.cos(nextYaw)*speed*dt*alignment,yaw:nextYaw};
}
