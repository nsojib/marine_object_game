import {test} from 'node:test';
import assert from 'node:assert/strict';
import {angleDifference,predict,CLASSES,ACTIVE_CLASSES,VESSEL_KINDS,MIN_CRUISE_SPEED,updateSpeed} from '../src/rules.js';
test('braking, coasting, and Space cannot stop or reverse the boat',()=>{
 for(const speed of [-18,0,MIN_CRUISE_SPEED,30])for(const keys of [[false,true,false],[false,false,false],[false,false,true]])assert.ok(updateSpeed(speed,...keys,.5)>=MIN_CRUISE_SPEED);
 assert.ok(updateSpeed(10,false,true,false,.1)<10);
});
test('target bearing wraps around north',()=>assert.ok(Math.abs(angleDifference(0.01,Math.PI*2-0.01)-0.02)<1e-9));
test('predictions include four unique normalized candidates with the known class available',()=>{for(const {kind:i} of ACTIVE_CLASSES){for(const distance of [20,400,770]){const p=predict(i,distance,i+1);assert.equal(new Set(p.map(x=>x.name)).size,4);assert.ok(p.some(x=>x.name===CLASSES[i]));assert.ok(Math.abs(p.reduce((s,x)=>s+x.probability,0)-1)<1e-9);assert.ok(p.every((x,j)=>x.probability>0&&(j===0||x.probability<=p[j-1].probability)));}}});
test('some close contacts are confidently misclassified while others rank correctly',()=>{const results=CLASSES.map((name,i)=>predict(i,20,i+1)[0].name===name);assert.ok(results.some(Boolean));assert.ok(results.some(x=>!x));assert.deepEqual(predict(2,300,3),predict(2,300,3));assert.notEqual(predict(2,20,3)[0].name,CLASSES[2]);});
test('unknown objects only get known model predictions',()=>assert.ok(predict(CLASSES.length,100,42).every(x=>CLASSES.includes(x.name))));

test('retired Pleasure craft is absent from spawn kinds and predictions',()=>{
 assert.ok(!VESSEL_KINDS.includes(6));
 assert.ok(!ACTIVE_CLASSES.some(c=>c.name==='Pleasure craft'));
 for(const {kind} of ACTIVE_CLASSES)for(let id=1;id<=35;id++)assert.ok(predict(kind,300,id).every(p=>p.name!=='Pleasure craft'));
});

test('law enforcement participates in spawning and identification',()=>{
 const kind=CLASSES.indexOf('Law enforcement');
 assert.ok(kind>=0&&VESSEL_KINDS.includes(kind));
 assert.ok(ACTIVE_CLASSES.some(c=>c.kind===kind));
 assert.ok(predict(kind,30,1).some(p=>p.name==='Law enforcement'));
});

test('birds are identifiable but do not spawn as vessels',()=>{
 const kind=CLASSES.indexOf('Bird');
 assert.ok(ACTIVE_CLASSES.some(c=>c.kind===kind));assert.ok(!VESSEL_KINDS.includes(kind));
 assert.ok(predict(kind,30,1).some(p=>p.name==='Bird'));
});

test('minimum cruising speed is two knots',()=>{assert.ok(Math.abs(MIN_CRUISE_SPEED*1.94384-2)<1e-10);assert.equal(updateSpeed(0,false,false,true,1),MIN_CRUISE_SPEED);});
