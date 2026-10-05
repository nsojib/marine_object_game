export class GameAudio {
 private context?:AudioContext;
 private master?:GainNode;
 private motor?:OscillatorNode;
 private motorGain?:GainNode;
 private waterGain?:GainNode;
 muted=false;
 start(){
  try {
   if(!this.context){
    const ctx=this.context=new AudioContext();this.master=ctx.createGain();this.master.gain.value=.35;this.master.connect(ctx.destination);
    this.motor=ctx.createOscillator();this.motor.type='triangle';this.motor.frequency.value=40;
    this.motorGain=ctx.createGain();this.motorGain.gain.value=0;this.motor.connect(this.motorGain).connect(this.master);this.motor.start();
    const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;
    for(let i=0;i<data.length;i++){last=(last+Math.random()*.08-.04)*.98;data[i]=last;}
    const water=ctx.createBufferSource();water.buffer=buffer;water.loop=true;
    const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=650;
    this.waterGain=ctx.createGain();this.waterGain.gain.value=0;water.connect(filter).connect(this.waterGain).connect(this.master);water.start();
   }
   void this.context.resume().catch(()=>{});
  }catch{/* Gameplay remains available when browser audio is unavailable. */}
 }
 update(speed:number,active:boolean){if(!this.context)return;const t=this.context.currentTime;this.master!.gain.setTargetAtTime(this.muted?0:.35,t,.05);this.motor!.frequency.setTargetAtTime(38+Math.abs(speed)*2.8,t,.15);this.motorGain!.gain.setTargetAtTime(active?.035+Math.abs(speed)/42*.11:0,t,.08);this.waterGain!.gain.setTargetAtTime(active?.22+Math.abs(speed)/42*.45:0,t,.1);}
 cue(type:'correct'|'wrong'|'collision'){
  if(!this.context||this.muted)return;
  const ctx=this.context,osc=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime;
  osc.type=type==='collision'?'triangle':'sine';osc.frequency.setValueAtTime(type==='correct'?520:type==='wrong'?180:90,t);osc.frequency.exponentialRampToValueAtTime(type==='correct'?880:45,t+.22);
  gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.2,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+.3);
  osc.connect(gain).connect(this.master!);osc.start();osc.stop(t+.32);osc.onended=()=>{osc.disconnect();gain.disconnect();};
 }
}
