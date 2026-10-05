import * as THREE from 'three';
export function addStructures(scene:THREE.Scene){
 const targets:{model:THREE.Group;kind:number}[]=[];
 const obstacles:{x:number;z:number;width:number;length:number;yaw:number}[]=[];
 const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.75});
 const concrete=material('#737e8d'),steel=material('#48596f'),white=material('#e4e6e8'),ochre=material('#b49054'),red=material('#a65948');
 function block(g:THREE.Group,w:number,h:number,d:number,mat:THREE.Material,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);g.add(m);return m;}
 function cylinder(g:THREE.Group,r:number,h:number,mat:THREE.Material,x:number,y:number,z:number){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),mat);m.position.set(x,y,z);g.add(m);return m;}
 function site(x:number,z:number,width:number,length:number,kind?:number){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);if(kind===undefined)obstacles.push({x,z,width,length,yaw:0});else{g.userData.fixedContact=true;targets.push({model:g,kind});}return g;}
 const harbor=site(-440,430,200,360);block(harbor,200,6,360,concrete,0,1);
 for(let i=0;i<3;i++){block(harbor,48,22,85,i%2?white:steel,-40,15,-105+i*110);block(harbor,52,3,89,steel,-40,27,-105+i*110);for(let k=0;k<4;k++)block(harbor,7,8,.2,steel,-57+k*11,10,-148+i*110);}
 for(let i=0;i<12;i++)block(harbor,12,6,27,i%3===0?red:i%3===1?steel:ochre,35+(i%2)*16,7+Math.floor(i/6)*6,-100+Math.floor(i/2)%3*37);
 for(const z of [-100,80]){block(harbor,3,60,3,ochre,73,33,z);block(harbor,3,60,3,ochre,40,33,z);block(harbor,90,3,3,ochre,65,63,z);block(harbor,.3,32,.3,steel,104,46,z);block(harbor,4,2,4,steel,104,30,z);}
 const light=site(330,80,48,48,11);block(light,48,5,48,concrete,0,1);cylinder(light,6,34,white,0,20,0);cylinder(light,6.1,4,red,0,27,0);cylinder(light,8,2,steel,0,38,0);cylinder(light,5,6,material('#8da6bd'),0,42,0);cylinder(light,7,2,steel,0,46,0);
 const rig=site(540,-1750,100,90);for(const x of [-40,40])for(const z of [-35,35])cylinder(rig,3,30,steel,x,8,z);block(rig,100,5,90,ochre,0,24);block(rig,35,15,28,white,-22,34,18);for(let y=0;y<5;y++)block(rig,15-y*2,1,15-y*2,red,20,31+y*9,-15);for(const x of [13,27])block(rig,1,43,1,red,x,49,-15);block(rig,65,2,2,ochre,10,42,25);
 const rotors:THREE.Group[]=[];
 for(let i=0;i<4;i++){const g=site(-640,-900-i*570,16,16,12);cylinder(g,7,8,concrete,0,1,0);cylinder(g,2,75,white,0,40,0);block(g,4,4,9,white,0,78,0);const rotor=new THREE.Group();rotor.position.set(0,78,-5);g.add(rotor);for(let k=0;k<3;k++){const arm=new THREE.Group();arm.rotation.z=k*Math.PI*2/3;block(arm,1.5,27,.7,white,0,14,0);rotor.add(arm);}rotors.push(rotor);}
 return {obstacles,targets,update(t:number){rotors.forEach((r,i)=>r.rotation.z=t*.3+i);}};
}
