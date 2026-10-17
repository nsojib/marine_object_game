// Oriented footprints use world yaw, matching Three.js rotation about Y.
export function overlaps(a,b){
 const axes=box=>[[Math.cos(box.yaw),-Math.sin(box.yaw)],[Math.sin(box.yaw),Math.cos(box.yaw)]];
 const aa=axes(a),bb=axes(b),dx=b.x-a.x,dz=b.z-a.z;
 for(const axis of [...aa,...bb]){
  const dot=v=>Math.abs(axis[0]*v[0]+axis[1]*v[1]);
  const ra=a.width/2*dot(aa[0])+a.length/2*dot(aa[1]);
  const rb=b.width/2*dot(bb[0])+b.length/2*dot(bb[1]);
  if(Math.abs(dx*axis[0]+dz*axis[1])>=ra+rb)return false;
 }
 return true;
}
export const footprints=[[15,85],[12,52],[8,22],[13,45],[12,38],[7,25],[4.8,17],[4.2,15],[1.25,3.3],[.85,5.4],[2.7,2.7],[48,48],[16,16],[4.8,17],[3.6,1.3],[2.7,2.7],[2.7,2.7],[2.7,2.7],[8,8]];
