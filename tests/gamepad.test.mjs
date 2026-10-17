import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deadzone,sampleGamepad,rumble} from '../src/gamepad-input.js';
test('stick deadzone removes drift and preserves full travel',()=>{assert.equal(deadzone(.1),0);assert.equal(deadzone(-.18),0);assert.equal(deadzone(1),1);assert.equal(deadzone(-1),-1);assert.ok(deadzone(.5)>0&&deadzone(.5)<.5);});
test('buttons fire once per press and triggers retain analog values',()=>{
 const pad={axes:[.5],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};pad.buttons[0]={pressed:true,value:1};pad.buttons[7]={pressed:false,value:.3};
 const first=sampleGamepad(pad);assert.equal(first.pressed[0],true);assert.equal(first.throttle,.3);assert.equal(sampleGamepad(pad,first.buttons).pressed[0],false);
 pad.buttons[0]={pressed:false,value:0};const released=sampleGamepad(pad,first.buttons);pad.buttons[0]={pressed:true,value:1};assert.equal(sampleGamepad(pad,released.buttons).pressed[0],true);
});

test('wrong and crash haptics differ and unsupported hardware is harmless',async()=>{
 const effects=[];const pad={vibrationActuator:{playEffect:async(type,effect)=>effects.push({type,...effect})}};
 await rumble(pad,'wrong');await rumble(pad,'crash');
 assert.equal(effects[0].type,'dual-rumble');assert.ok(effects[1].duration>effects[0].duration);assert.ok(effects[1].strongMagnitude>effects[0].strongMagnitude);
 await rumble(null,'wrong');await rumble({vibrationActuator:{playEffect:async()=>{throw Error('disconnected')}}},'crash');
});

test('left stick vertical axis controls analog speed with deadzone and triggers',()=>{
 const pad={axes:[.5,-1],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
 let input=sampleGamepad(pad);assert.equal(input.throttle,1);assert.equal(input.brake,0);assert.ok(input.steer>0);
 pad.axes[1]=1;input=sampleGamepad(pad);assert.equal(input.brake,1);assert.equal(input.throttle,0);
 pad.axes[1]=.1;input=sampleGamepad(pad);assert.equal(input.brake,0);assert.equal(input.throttle,0);
 pad.axes[1]=-.5;input=sampleGamepad(pad);assert.ok(input.throttle>0&&input.throttle<1);
 pad.buttons[7].value=.9;assert.equal(sampleGamepad(pad).throttle,.9);
});
