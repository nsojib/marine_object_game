import {depthProgress} from './expedition.js';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export function evolvingWeather(time,z,score,preset='Auto',seaPreset='Auto'){
 const offshore=Math.max(depthProgress(z),clamp(score/100)*.85);
 const arrival=smooth(time/25);
 const front=(Math.sin(time/24-1.6)+1)/2;
 const fogBank=(Math.sin(time/19-1.2)+1)/2;
 let rain=arrival*smooth((front-.4+offshore*.22)/.5);
 let fog=arrival*smooth((fogBank-.35)/.6)*(.38+offshore*.42);
 let cloud=clamp(.12+rain*.7+fog*.18);
 if(preset!=='Auto'){
  rain=preset==='Rain'?.6+.35*front:0;
  fog=preset==='Fog'?.55+.35*fogBank:preset==='Rain'?.12+.15*fogBank:0;
  cloud=preset==='Clear'?.1+.14*front:preset==='Fog'?.75:.8+rain*.15;
 }
 const swell=seaPreset==='Auto'?clamp(.12+offshore*.45+rain*.33+arrival*(Math.sin(time/13)+1)*.07):seaPreset==='Rough'?.9:seaPreset==='Moderate'?.45:.08;
 const glare=clamp((1-cloud)*( .5+.5*Math.sin(time/17+.7)))*.55;
 return {rain,fog,cloud,swell,glare,visibility:Math.round(780-fog*380-rain*140),weather:rain>.48?'Rain':fog>.28?'Fog':'Clear',sea:swell>.66?'Rough':swell>.28?'Moderate':'Calm',waveHeight:.18+swell*1.5};
}
