import {ACTIVE_CLASSES} from './rules.js';
import {photoCrop} from './photo-detail.js';
type Photo={file:string;crop?:number[]};
type Group={className:string;photos:Photo[]};
export function addObjectGuide(menu:HTMLElement){
 const button=document.createElement('button');button.type='button';button.className='object-guide-open';button.textContent='See Example';menu.append(button);
 const dialog=document.createElement('dialog');dialog.id='object-guide';dialog.setAttribute('aria-labelledby','object-guide-title');dialog.innerHTML='<button class="close" aria-label="Close See Example">×</button><h2 id="object-guide-title">See Example</h2><p>Look at these photos to learn the names. In the game, move closer for a clearer photo. Choose with 1–4 on the keyboard, or the matching A/B/X/Y controller button. You can skip any you are unsure about.</p><div class="guide-scroll"><button class="subtle" data-scroll="up">↑ Back to top</button><button class="subtle" data-scroll="down">↓ More examples</button></div><div class="guide-content"></div>';
 document.body.append(dialog);dialog.querySelector<HTMLButtonElement>('.close')!.onclick=()=>dialog.close();
 dialog.querySelector<HTMLButtonElement>('[data-scroll=up]')!.onclick=()=>dialog.scrollTo({top:0,behavior:'smooth'});
 dialog.querySelector<HTMLButtonElement>('[data-scroll=down]')!.onclick=()=>dialog.scrollBy({top:350,behavior:'smooth'});
 const content=dialog.querySelector<HTMLElement>('.guide-content')!;let loaded=false,loading=false;
 async function load(){
  if(loaded||loading)return;loading=true;content.textContent='Loading examples…';
  try{
   const response=await fetch(import.meta.env.BASE_URL+'nomad-inset/manifest.json');if(!response.ok)throw new Error();
   const groups=await response.json() as Group[];content.replaceChildren();
   for(const category of ACTIVE_CLASSES){
    const photos=groups.find(g=>g.className===category.name)?.photos.slice(0,2)??[];
    if(!photos.length)continue;
    const section=document.createElement('section'),heading=document.createElement('h3'),examples=document.createElement('div');heading.textContent=category.name;examples.className='guide-examples';section.append(heading,examples);
    for(const [index,photo] of photos.entries()){
     const figure=document.createElement('figure'),canvas=document.createElement('canvas'),caption=document.createElement('figcaption');caption.textContent=`Example ${index+1}`;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',category.name+' example '+(index+1));figure.append(canvas,caption);examples.append(figure);
     const image=new Image();image.decoding='async';image.onload=()=>{const crop=photoCrop(image.naturalWidth,image.naturalHeight,photo.crop??[0,0,1,1]);const scale=Math.min(1,600/Math.max(crop.width,crop.height));canvas.width=Math.max(1,Math.round(crop.width*scale));canvas.height=Math.max(1,Math.round(crop.height*scale));canvas.getContext('2d')?.drawImage(image,crop.x,crop.y,crop.width,crop.height,0,0,canvas.width,canvas.height);};image.onerror=()=>{caption.textContent='Image unavailable';};image.src=import.meta.env.BASE_URL+photo.file;
    }
    if(photos.length===1){const note=document.createElement('small');note.textContent='One selected example available.';section.append(note);}
    content.append(section);
   }
   loaded=true;
  }catch{content.textContent='Could not load examples. Close and reopen to retry.';}finally{loading=false;}
 }
 button.onclick=()=>{dialog.showModal();void load();};
}
