import { CLASSES, ACTIVE_CLASSES } from './rules.js';
import './reference-photos.css';
import {photoCrop,photoResolution} from './photo-detail.js';
type Photo={crop?:number[];file:string;title:string;author:string;license:string;licenseUrl:string;source:string};
type Group={className:string;slug:string;photos:Photo[]};
export function createReferenceInset(parent:HTMLElement){
 const inset=document.createElement('section');inset.className='reference-inset';inset.hidden=true;inset.setAttribute('aria-label','Real object reference photographs');
 inset.innerHTML='<div class="reference-frame"></div>';
 parent.insertBefore(inset,parent.querySelector('#target-hint'));
 const frame=inset.querySelector<HTMLElement>('.reference-frame')!;
 const selections=new Map<string,number>();
 let groups:Group[]=[],contactId:number|undefined,kind=-1,failed=false;
 let distance=1200,loaded:HTMLImageElement|undefined,canvas:HTMLCanvasElement|undefined,bounds=[0,0,1,1],generation=0;
 function draw(){
  if(!loaded||!canvas)return;
  const crop=photoCrop(loaded.naturalWidth,loaded.naturalHeight,bounds),size=photoResolution(distance,crop.width,crop.height);
  if(canvas.width===size.width&&canvas.height===size.height)return;
  canvas.width=size.width;canvas.height=size.height;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(loaded,crop.x,crop.y,crop.width,crop.height,0,0,size.width,size.height);
 }
 function render(){
  const version=++generation;loaded=undefined;canvas=undefined;
  frame.replaceChildren();
  const group=groups.find(g=>g.className===CLASSES[kind]),photos=group?.photos??[];

  if(!photos.length){frame.textContent=failed?'Photos unavailable':groups.length?'No reference photo available':'Loading photo…';return;}
  const key=`${contactId}:${kind}`;
  if(!selections.has(key))selections.set(key,Math.floor(Math.random()*photos.length));
  const photo=photos[selections.get(key)!];
  bounds=photo.crop??[0,0,1,1];
  frame.textContent='Loading crop...';
  const img=new Image();img.decoding='async';
  img.onload=()=>{if(version!==generation)return;loaded=img;canvas=document.createElement('canvas');canvas.width=0;canvas.height=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Cropped object reference; detail increases as you approach');frame.replaceChildren(canvas);draw();};
  img.onerror=()=>{if(version===generation)frame.textContent='Photo unavailable';};
  img.src=import.meta.env.BASE_URL+photo.file;

 }
 const readManifest=async(path:string):Promise<Group[]>=>{const r=await fetch(import.meta.env.BASE_URL+path);if(!r.ok)throw new Error('Photo manifest unavailable');return r.json();};
 void readManifest('nomad-inset/manifest.json').then(nomad=>{groups=nomad.filter(g=>ACTIVE_CLASSES.some(c=>c.name===g.className));if(contactId!==undefined)render();}).catch(()=>{failed=true;if(contactId!==undefined)render();});
 return {
  update(contact?:{id:number;kind:number;distance:number}){inset.hidden=!contact;if(!contact){contactId=undefined;return;}distance=contact.distance;if(contact.id!==contactId||contact.kind!==kind){contactId=contact.id;kind=contact.kind;render();}else{draw();}},
  reset(){generation++;loaded=undefined;canvas=undefined;selections.clear();contactId=undefined;inset.hidden=true;}
 };
}
