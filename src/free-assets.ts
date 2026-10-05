import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { footprints } from './collision.js';

const assets=[{kind:0,file:'ship-cargo-a',height:15},{kind:2,file:'boat-tug-a',height:8},{kind:5,file:'boat-fishing-small',height:8},{kind:6,file:'boat-speed-a',height:4},{kind:7,file:'boat-sail-a',height:22}];
const templates=new Map<number,THREE.Group>();
let loading:Promise<void>|undefined;

export function loadFreeAssets(){
 if(loading)return loading;
 const loader=new GLTFLoader();
 loading=Promise.all(assets.map(async asset=>{
  try{
   const gltf=await loader.loadAsync(`${import.meta.env.BASE_URL}models/kenney/${asset.file}.glb`);
   const model=gltf.scene;
   const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   const [width,length]=footprints[asset.kind];
   model.scale.set(width/size.x,asset.height/size.y,length/size.z);
   model.position.set(-center.x*model.scale.x,-bounds.min.y*model.scale.y-.35,-center.z*model.scale.z);
   const normalized=new THREE.Group();normalized.add(model);
   model.traverse(object=>{if(object instanceof THREE.Mesh){object.userData.sharedAsset=true;const mats=Array.isArray(object.material)?object.material:[object.material];for(const mat of mats){if(mat instanceof THREE.MeshStandardMaterial){mat.roughness=.65;mat.metalness=.05;mat.envMapIntensity=.35;}}}});
   templates.set(asset.kind,normalized);
  }catch(error){console.warn(`Optional model ${asset.file} unavailable; keeping procedural vessel.`,error);}
 })).then(()=>{});
 return loading;
}

export function applyFreeAsset(group:THREE.Group,kind:number){
 const template=templates.get(kind);if(!template)return false;
 group.traverse(object=>{if(object instanceof THREE.Mesh&&!object.userData.sharedAsset)object.geometry.dispose();});
 group.clear();group.add(template.clone(true));group.userData.assetSource='Kenney Watercraft Kit 2.1 (CC0)';return true;
}
