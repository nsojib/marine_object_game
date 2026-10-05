import { CLASSES } from './rules.js';
import './reference-photos.css';
import crops from './photo-crops.json';
import {photoCrop,photoResolution} from './photo-detail.js';
type Photo={file:string;title:string;author:string;license:string;licenseUrl:string;source:string};
type Group={className:string;slug:string;photos:Photo[]};
export function createReferenceInset(parent:HTMLElement){
 const inset=document.createElement('section');inset.className='reference-inset';inset.hidden=true;inset.setAttribute('aria-label','Real object reference photographs');
 inset.innerHTML='<div class="reference-heading"><span>PHOTO INSET</span><div><button type="button" class="photo-prev" aria-label="Previous reference photo">‹</button><span class="photo-count"></span><button type="button" class="photo-next" aria-label="Next reference photo">›</button></div></div><div class="reference-frame"></div>';
 parent.insertBefore(inset,parent.querySelector('#target-hint'));
 const frame=inset.querySelector<HTMLElement>('.reference-frame')!,count=inset.querySelector<HTMLElement>('.photo-count')!;
 const prev=inset.querySelector<HTMLButtonElement>('.photo-prev')!,next=inset.querySelector<HTMLButtonElement>('.photo-next')!;
 let groups:Group[]=[],contactId:number|undefined,kind=-1,index=0,failed=false,sessionOffset=Math.floor(Math.random()*5);
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
  frame.replaceChildren();count.textContent='';
  const group=groups.find(g=>g.className===CLASSES[kind]),photos=group?.photos??[];
  prev.disabled=next.disabled=photos.length<2;
  if(!photos.length){frame.textContent=failed?'Photos unavailable':groups.length?'No reference photo available':'Loading photo…';return;}
  const photo=photos[index%photos.length];count.textContent=`${index%photos.length+1} / ${photos.length}`;
  bounds=(crops as Record<string,number[][]>)[group!.slug]?.[index%photos.length]??[0,0,1,1];
  frame.textContent='Loading crop...';
  const img=new Image();img.decoding='async';
  img.onload=()=>{if(version!==generation)return;loaded=img;canvas=document.createElement('canvas');canvas.width=0;canvas.height=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Cropped object reference; detail increases as you approach');frame.replaceChildren(canvas);draw();};
  img.onerror=()=>{if(version===generation)frame.textContent='Photo unavailable';};
  img.src=import.meta.env.BASE_URL+photo.file;

 }
 prev.onclick=()=>{index=(index+4)%5;render();};next.onclick=()=>{index=(index+1)%5;render();};
 void fetch(import.meta.env.BASE_URL+'reference-photos/manifest.json').then(r=>{if(!r.ok)throw new Error('Photo manifest unavailable');return r.json();}).then((data:Group[])=>{groups=data;if(contactId!==undefined)render();}).catch(()=>{failed=true;if(contactId!==undefined)render();});
 return {
  update(contact?:{id:number;kind:number;distance:number}){inset.hidden=!contact;if(!contact){contactId=undefined;return;}distance=contact.distance;if(contact.id!==contactId||contact.kind!==kind){contactId=contact.id;kind=contact.kind;index=(contact.id+sessionOffset)%5;render();}else{draw();}},
  reset(){generation++;loaded=undefined;canvas=undefined;sessionOffset=Math.floor(Math.random()*5);contactId=undefined;inset.hidden=true;}
 };
}
