export function deadzone(value,zone=.18){return Math.abs(value)<=zone?0:Math.sign(value)*(Math.abs(value)-zone)/(1-zone);}
export function sampleGamepad(pad,previous=[]){
 const buttons=pad.buttons.map(b=>b.pressed||b.value>.5);
 const vertical=deadzone(pad.axes[1]??0);
 return {buttons,pressed:buttons.map((down,i)=>down&&!previous[i]),steer:deadzone(pad.axes[0]??0),throttle:Math.max(0,-vertical,pad.buttons[7]?.value??0),brake:Math.max(0,vertical,pad.buttons[6]?.value??0)};
}

export async function rumble(pad,cause){
 const actuator=pad?.vibrationActuator;
 if(!actuator?.playEffect)return;
 const effect=cause==='crash'?{duration:450,strongMagnitude:.9,weakMagnitude:.65}:{duration:180,strongMagnitude:.25,weakMagnitude:.55};
 try{await actuator.playEffect('dual-rumble',{startDelay:0,...effect});}catch{/* Unsupported or disconnected controllers must not interrupt gameplay. */}
}
