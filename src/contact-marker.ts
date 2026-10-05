import * as THREE from 'three';
// Replace materials on target meshes only; keep their geometry and transforms.
const neutralMaterial=new THREE.MeshStandardMaterial({color:0x9da3ac,roughness:1,metalness:0,side:THREE.DoubleSide});
export function simplifyContact(model:THREE.Group){
 model.traverse(object=>{
  if(object instanceof THREE.Mesh)object.material=neutralMaterial;
 });
}
