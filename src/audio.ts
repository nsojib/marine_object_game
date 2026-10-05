export class GameAudio {
 private context?:AudioContext;
 private master?:GainNode;
 private motor?:OscillatorNode;
 private motorGain?:GainNode;
 private waterGain?:GainNode;
 private clips:Partial<Record<'correct'|'wrong'|'collision',AudioBuffer>>={};
 private loading?:Promise<void>;
 private cueSource?:AudioBufferSourceNode;
 private cueRequest=0;
 muted=false;
 private loadClips(){
  if(!this.context)return Promise.resolve();
  const ctx=this.context;
  return this.loading??=Promise.all((['correct','wrong','collision'] as const).map(async type=>{
   const file={correct:'ready-short.wav',wrong:'error.wav',collision:'wilhelm.wav'}[type];
   try{
    const response=await fetch(import.meta.env.BASE_URL+'audio/'+file);
    if(!response.ok)throw new Error('Audio fetch failed');
    this.clips[type]=await ctx.decodeAudioData(await response.arrayBuffer());
   }catch(error){console.warn('Could not load game sound: '+file,error);}
  })).then(()=>{});
 }
 start(){
  try {
   if(!this.context){
    const ctx=this.context=new AudioContext();this.master=ctx.createGain();this.master.gain.value=.85;this.master.connect(ctx.destination);
    this.motor=ctx.createOscillator();this.motor.type='triangle';this.motor.frequency.value=40;
    this.motorGain=ctx.createGain();this.motorGain.gain.value=0;this.motor.connect(this.motorGain).connect(this.master);this.motor.start();
    const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
    for(let i=0;i<data.length;i++){last=(last+Math.random()*.08-.04)*.98;data[i]=last;}
    const water=ctx.createBufferSource();water.buffer=buffer;water.loop=true;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;
    this.waterGain=ctx.createGain();this.waterGain.gain.value=0;water.connect(filter).connect(this.waterGain).connect(this.master);water.start();
   }
   void this.context.resume().catch(()=>{});
   void this.loadClips();
  }catch{/* Gameplay remains available when browser audio is unavailable. */}
 }
 update(speed:number,active:boolean){if(!this.context)return;if(this.muted&&this.cueSource){this.cueSource.stop();this.cueSource=undefined;this.cueRequest++;}const t=this.context.currentTime;this.master!.gain.setTargetAtTime(this.muted?0:.85,t,.05);this.motor!.frequency.setTargetAtTime(38+Math.abs(speed)*2.8,t,.15);this.motorGain!.gain.setTargetAtTime(active?.035+Math.abs(speed)/42*.11:0,t,.08);this.waterGain!.gain.setTargetAtTime(active?.22+Math.abs(speed)/42*.45:0,t,.1);}
 cue(type:'correct'|'wrong'|'collision'){
  if(!this.context||this.muted)return;
  const request=++this.cueRequest;
  const play=()=>{
   const buffer=this.clips[type];
   if(!buffer||!this.context||this.muted||request!==this.cueRequest)return;
   this.cueSource?.stop();
   const source=this.context.createBufferSource();source.buffer=buffer;
   source.connect(this.master!);this.cueSource=source;
   source.onended=()=>{source.disconnect();if(this.cueSource===source)this.cueSource=undefined;};
   source.start();
  };
  if(this.clips[type])play();else void this.loadClips().then(play);
 }
}
