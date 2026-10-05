import * as THREE from 'three';
import { applyFreeAsset } from './free-assets';

// Dimensions are metres. A shared material palette keeps the fleet inexpensive to render.
const palette = new Map<string, THREE.MeshStandardMaterial>();
function material(color: string, metalness = .15, roughness = .48) {
 const key = `${color}/${metalness}/${roughness}`;
 if (!palette.has(key)) palette.set(key, new THREE.MeshStandardMaterial({color, metalness, roughness}));
 return palette.get(key)!;
}
const white=material('#e7e4da'), steel=material('#77848a',.75,.3), glass=material('#244650',.65,.16), rubber=material('#20282c',0,.95), deck=material('#89928b'), wood=material('#8a7154',0,.9);
deck.side=THREE.DoubleSide;
function part(g:THREE.Group,geo:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;}
function box(g:THREE.Group,w:number,h:number,l:number,mat:THREE.Material,x=0,y=0,z=0){return part(g,new THREE.BoxGeometry(w,h,l),mat,x,y,z);}
function rod(g:THREE.Group,a:number[],b:number[],r=.07,mat:THREE.Material=steel){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=part(g,new THREE.CylinderGeometry(r,r,delta.length(),8),mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
function hull(g:THREE.Group,length:number,width:number,height:number,color:string){
 // Curved sections form a fine bow, flared topsides and a submerged keel.
 const sections=[[-.5,.02],[-.46,.37],[-.37,.76],[-.22,.97],[0,1],[.25,.98],[.43,.86],[.5,.72]];
 const rings=[[-.9,.46],[-.25,.77],[height*.48,.94],[height,1]];
 const vertices:number[]=[],indices:number[]=[];
 for(const [z,w] of sections)for(const [y,flare] of rings)for(const side of [-1,1])vertices.push(side*width*.5*w*flare,y,z*length);
 for(let s=0;s<sections.length-1;s++)for(let r=0;r<rings.length-1;r++)for(let side=0;side<2;side++){const a=s*8+r*2+side,b=a+8;indices.push(a,b,a+2,b,b+2,a+2);}
 for(let s=0;s<sections.length-1;s++){const a=s*8;indices.push(a,a+1,a+8,a+1,a+9,a+8);const t=a+6;indices.push(t,t+8,t+1,t+1,t+8,t+9);}
 for(const s of [0,sections.length-1])for(let r=0;r<3;r++){const a=s*8+r*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const mat=material(color);mat.side=THREE.DoubleSide;part(g,geo,mat);
 // A second, inset contour gives a visible deck lip without a rectangular bow.
 const outline=new THREE.Shape();sections.forEach(([z,w],i)=>i?outline.lineTo(w*width*.49,z*length):outline.moveTo(w*width*.49,z*length));[...sections].reverse().forEach(([z,w])=>outline.lineTo(-w*width*.49,z*length));outline.closePath();const top=part(g,new THREE.ShapeGeometry(outline),deck,0,height+.025);top.rotation.x=Math.PI/2;
}
function cabin(g:THREE.Group,w:number,h:number,l:number,y:number,z:number){
 box(g,w,h,l,white,0,y+h/2,z);box(g,w+ .35,.18,l+.4,white,0,y+h,z);
 // Individual window panels, with painted frames between them.
 for(const side of [-1,1])for(let i=0;i<Math.max(2,Math.floor(l/1.9));i++)box(g,.035,h*.36,1.15,glass,side*(w/2+.025),y+h*.64,z-l*.38+i*1.8);
 for(let i=0;i<Math.max(2,Math.floor(w/1.6));i++)box(g,1.05,h*.36,.035,glass,-w*.34+i*1.5,y+h*.64,z-l/2-.025);
}
function rails(g:THREE.Group,w:number,l:number,y:number,z=0){for(const side of [-1,1]){rod(g,[side*w/2,y+1,z-l/2],[side*w/2,y+1,z+l/2],.045);for(let i=0;i<=6;i++)rod(g,[side*w/2,y,z-l/2+i*l/6],[side*w/2,y+1,z-l/2+i*l/6],.045);}}
function mast(g:THREE.Group,y:number,z:number,h:number){rod(g,[0,y,z],[0,y+h,z],.11);rod(g,[-1.8,y+h*.7,z],[1.8,y+h*.7,z],.06);box(g,2.5,.16,.35,white,0,y+h*.85,z);part(g,new THREE.SphereGeometry(.22,10,8),white,0,y+h,z);}
function ring(g:THREE.Group,x:number,y:number,z:number,r=.55){part(g,new THREE.TorusGeometry(r,r*.23,8,20),rubber,x,y,z).rotation.y=Math.PI/2;}
function person(g:THREE.Group,x:number,y:number,z:number){part(g,new THREE.SphereGeometry(.18,10,8),material('#c6a185',0),x,y+1,z);box(g,.5,.65,.35,material('#e16e2c'),x,y+.5,z);rod(g,[x-.15,y+.2,z],[x-.15,y-.3,z+.2],.1,rubber);rod(g,[x+.15,y+.2,z],[x+.15,y-.3,z+.2],.1,rubber);}
function crane(g:THREE.Group,x:number,y:number,z:number){const yellow=material('#c69f49');rod(g,[x,y,z],[x,y+7,z],.3,yellow);rod(g,[x,y+7,z],[x,y+11,z-9],.22,yellow);rod(g,[x,y+11,z-9],[x,y+2,z-9],.035,rubber);}
function sail(g:THREE.Group,points:number[]){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();part(g,geo,new THREE.MeshStandardMaterial({color:'#f0ece0',side:THREE.DoubleSide,roughness:.95}));}

export function createVessel(kind:number){
 const g=new THREE.Group();g.name=`vessel-${kind}`;if(applyFreeAsset(g,kind))return g;
 if(kind===0){
  hull(g,85,15,4,'#294850');rails(g,13,65,4);
  cabin(g,12,4,10,4,28);cabin(g,11,3,9,8,28);cabin(g,13,2.7,8,11,27);mast(g,13.7,28,5);
  box(g,3,6,4,material('#bb613e'),3,12,33);box(g,3.2,.7,4.2,rubber,3,15.3,33);
  const colors=['#8d4e36','#496d73','#ad9b67','#656e52'];
  for(let row=0;row<5;row++)for(let col=0;col<3;col++)for(let level=0;level<2;level++){
   const x=(col-1)*4,z=-28+row*10,y=5.4+level*2.9,mat=material(colors[(row+col+level)%4]);box(g,3.8,2.7,9,mat,x,y,z);
   for(let k=0;k<7;k++)for(const side of [-1,1])box(g,.055,2.5,.08,mat,x+side*1.93,y,z-3.8+k*1.25);
  }
 }else if(kind===1){
  hull(g,52,12,3,'#e0e5dd');box(g,11.6,.6,37,material('#285f78'),0,2,2);
  cabin(g,10,3,36,3,2);cabin(g,9.4,2.8,30,6,3);cabin(g,10.5,2.4,7,8.8,-8);rails(g,9.5,30,8.8,3);
  for(const x of [-3,3]){box(g,1.8,4,3,material('#c18d3c'),x,11,12);box(g,2,.4,3.2,rubber,x,13,12);}
  mast(g,11.2,-8,4);for(const x of [-5.3,5.3]){const boat=part(g,new THREE.SphereGeometry(1,14,10),material('#d47a3b'),x,7,7);boat.scale.set(.8,.65,3);}
 }else if(kind===2){
  hull(g,22,8,2.5,'#243e48');box(g,7.7,.5,16,rubber,0,2,1);cabin(g,5.5,3.5,7,2.5,-2);cabin(g,6,2.3,5,6,-2);mast(g,8.3,-2,4);
  for(const side of [-1,1])for(let z=-7;z<9;z+=2.4)ring(g,side*3.95,1.3,z,.75);
  part(g,new THREE.CylinderGeometry(.9,.9,2,16),steel,0,3.5,6).rotation.z=Math.PI/2;rails(g,6.7,8,2.5,5);
 }else if(kind===3){
  hull(g,45,13,2,'#535c59');for(const side of [-1,1])box(g,.35,2,35,material('#695e50'),side*5.6,3,0);
  for(let i=0;i<7;i++){const mound=part(g,new THREE.SphereGeometry(1,12,8),material('#615e53',0,1),(i%2?2:-2),3,-13+i*4);mound.scale.set(3.5,1.7,5);}
  rails(g,12,38,2);for(const x of [-5,5])for(const z of [-18,18])part(g,new THREE.CylinderGeometry(.25,.35,1,10),steel,x,2.5,z);
 }else if(kind===4){
  hull(g,38,12,2.8,'#9b7337');cabin(g,6,4,9,2.8,10);mast(g,6.8,10,5);crane(g,3,3,0);rails(g,11,29,2.8);
  rod(g,[-4,4,0],[-4,5,-23],.65,material('#676e61'));rod(g,[-4,5,-23],[-4,-2,-27],.6,steel);
  box(g,6,1.5,12,material('#454e46'),0,3,-3);for(let i=0;i<5;i++)box(g,5,.15,.15,steel,0,4,-8+i*2.5);
 }else if(kind===5){
  hull(g,25,7,2.5,'#49777c');cabin(g,5,3,7,2.5,-5);mast(g,5.5,-4,8);rails(g,6,17,2.5);
  for(const side of [-1,1]){rod(g,[side*2,4,0],[side*7,12,4],.12);rod(g,[0,13,-4],[side*7,12,4],.035,rubber);}
  for(const z of [3,6])part(g,new THREE.CylinderGeometry(1,1,3,16),material('#616e65'),0,4,z).rotation.z=Math.PI/2;
  for(let i=0;i<6;i++)box(g,1.3,.8,1,material(i%2?'#6d8780':'#b8894a'),(i%3-1)*1.5,3,8+Math.floor(i/3)*1.1);person(g,1,2.7,0);
 }else if(kind===6){
  hull(g,17,4.8,1.7,'#efede4');cabin(g,3.5,1.8,6,1.7,0);box(g,3.8,.2,7,white,0,3.65,.3);rails(g,4,11,1.7);box(g,3,.5,3,wood,0,1.8,6);
  rod(g,[-1.5,3.8,2],[-1.5,5.2,2]);rod(g,[1.5,3.8,2],[1.5,5.2,2]);box(g,3.6,.15,3,white,0,5.2,2);mast(g,5.2,2,1.5);
 }else if(kind===7){
  hull(g,15,4.2,1.4,'#e7e4db');cabin(g,2.5,1.1,4,1.4,1);rails(g,3.5,10,1.4);rod(g,[0,1.4,-1],[0,21,-1],.1);rod(g,[0,3,-1],[0,3,5],.09);
  sail(g,[0,20,-1, 1.2,10,2, 0,3,5, 0,20,-1, 0,3,5, 0,3,-1]);sail(g,[0,18,-1, -.6,8,-5, 0,2,-6.8, 0,18,-1, 0,2,-6.8, 0,3,-1]);
  rod(g,[0,21,-1],[0,1.5,-7],.018);rod(g,[0,21,-1],[0,1.5,6],.018);person(g,.6,1.5,4);
 }else if(kind===8){
  hull(g,3.3,1.25,.48,'#b8bcb4');box(g,.8,.35,1.7,rubber,0,.65,.35);rod(g,[-.45,.9,-.5],[.45,.9,-.5],.055,rubber);person(g,0,.5,.3);
 }else if(kind===9){
  hull(g,5.4,.85,.35,'#d79a40');const seat=part(g,new THREE.SphereGeometry(1,16,10),rubber,0,.37,.3);seat.scale.set(.33,.08,.7);person(g,0,.25,.3);rod(g,[-1.5,.75,-.5],[1.5,.75,1],.035,steel);
  for(const side of [-1,1]){const paddle=part(g,new THREE.SphereGeometry(1,12,8),material('#c6b17b'),side*1.5,.75,.25+side*.75);paddle.scale.set(.38,.04,.16);}
 }else{
  for(const x of [-3,3])for(const z of [-3,3])part(g,new THREE.CylinderGeometry(.7,.7,2.6,16),material('#4d7371'),x,.25,z).rotation.z=Math.PI/2;
  for(let i=0;i<10;i++)box(g,7,.16,.68,wood,0,1.1,-3.3+i*.73);
  box(g,2,1.5,2,material('#7d8770'),1,1.9,0);rod(g,[-2,1,-2],[-2,4,-2],.08);box(g,.7,.5,.035,material('#d89c45'),-1.7,3.7,-2);
 }
 return g;
}

export function createASV(){
 const g=new THREE.Group();for(const x of [-1.65,1.65]){const pontoon=new THREE.Group();pontoon.position.x=x;hull(pontoon,7,1.05,.8,'#d5dedb');g.add(pontoon);}
 box(g,4.1,.25,3.8,steel,0,1.05,.2);box(g,2.6,.65,2.5,material('#c7913d'),0,1.5,.2);
 box(g,2.4,.05,2.2,material('#1e354a',.5,.22),0,1.86,.2);
 for(let x=-1;x<=1;x+=.4)box(g,.014,.012,2.1,steel,x,1.9,.2);for(let z=-.7;z<1.3;z+=.4)box(g,2.3,.012,.014,steel,0,1.9,z);
 mast(g,1.9,1.1,2.1);box(g,.55,.4,.4,white,0,3.65,1);part(g,new THREE.CylinderGeometry(.12,.12,.12,16),glass,0,3.65,.74).rotation.x=Math.PI/2;
 for(const side of [-1,1]){rod(g,[side*1.8,1,-1.4],[side*1.8,1.65,-1.4]);rod(g,[side*1.8,1.65,-1.4],[side*1.8,1.65,1.5]);part(g,new THREE.SphereGeometry(.1,8,8),material(side<0?'#ba493e':'#609c72'),side*1.8,1.7,-1.4);}
 return g;
}
