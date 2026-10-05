import {angleDifference} from './rules.js';
export function createWeatherEffects(parent:HTMLElement){
 const canvas=document.createElement('canvas');canvas.className='weather-effects';canvas.setAttribute('aria-hidden','true');parent.append(canvas);
 const ctx=canvas.getContext('2d')!;let w=1,h=1;
 new ResizeObserver(()=>{w=parent.clientWidth;h=parent.clientHeight;canvas.width=w;canvas.height=h;}).observe(parent);
 return {update(time:number,heading:number,speed:number,state:{glare:number;swell:number;rain:number}){
  ctx.clearRect(0,0,w,h);
  const bearing=angleDifference(-.62+Math.sin(time/90)*.18,heading);
  if(Math.abs(bearing)<1.1&&state.glare>.01){
   const x=w*(.5+Math.sin(bearing)*.6),y=h*.28,r=w*.5;
   const glow=ctx.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,`rgba(255,240,209,${state.glare*.65})`);glow.addColorStop(.12,`rgba(243,227,198,${state.glare*.18})`);glow.addColorStop(1,'rgba(243,227,198,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  }
  const motion=Math.min(1,Math.abs(speed)/35);
  const strength=Math.min(1,motion*(.15+state.swell*.85));
  const burst=(time%9)/9;
  const spray=Math.max(0,1-burst*4)*strength;
  if(spray>.01){const wash=ctx.createLinearGradient(0,h*.5,0,h);wash.addColorStop(0,'rgba(180,205,226,0)');wash.addColorStop(1,`rgba(194,218,236,${spray*.3})`);ctx.fillStyle=wash;ctx.fillRect(0,h*.5,w,h*.5);}
  for(let i=0;i<38;i++){
   const life=(time*(state.rain>.2?.19:.13)+i*.618)%1;
   const opacity=Math.sin(life*Math.PI)*(strength*.45+state.rain*.18);
   if(opacity<.015)continue;
   const x=((Math.sin(i*127.1)*437.58)%1+1)%1*w;
   const y=(((Math.sin(i*83.7)*213.7)%1+1)%1*.85+life*.12)*h;
   const radius=2+(i%5)*1.4+spray*4;
   ctx.beginPath();ctx.ellipse(x,y,radius,radius*1.6,0,0,Math.PI*2);ctx.fillStyle=`rgba(110,157,191,${opacity*.25})`;ctx.fill();ctx.strokeStyle=`rgba(218,236,249,${opacity})`;ctx.lineWidth=.7;ctx.stroke();
  }
 }};
}
