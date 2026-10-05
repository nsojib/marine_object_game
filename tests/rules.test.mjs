import {test} from 'node:test';
import assert from 'node:assert/strict';
import {angleDifference,predict,CLASSES,updateSpeed} from '../src/rules.js';
test('reverse moves backward from rest and brakes forward motion',()=>{
 assert.ok(updateSpeed(0,false,true,false,.05)<0);
 assert.ok(updateSpeed(10,false,true,false,.05)<10);
 assert.equal(updateSpeed(-18,false,true,false,1),-18);
});
test('released throttle coasts toward zero in either direction',()=>{
 assert.equal(updateSpeed(.1,false,false,false,1),0);
 assert.equal(Math.abs(updateSpeed(-.1,false,false,false,1)),0);
 assert.ok(updateSpeed(-10,false,false,false,1)>-10);
});
test('Space stops forward or reverse motion even with throttle held',()=>{
 assert.equal(updateSpeed(30,true,false,true,.05),0);
 assert.equal(updateSpeed(-15,false,true,true,.05),0);
});
test('target bearing wraps around north',()=>assert.ok(Math.abs(angleDifference(0.01,Math.PI*2-0.01)-0.02)<1e-9));
test('predictions include five unique normalized candidates with the known class available',()=>{for(let i=0;i<CLASSES.length;i++){for(const distance of [20,400,770]){const p=predict(i,distance,i+1);assert.equal(new Set(p.map(x=>x.name)).size,5);assert.ok(p.some(x=>x.name===CLASSES[i]));assert.ok(Math.abs(p.reduce((s,x)=>s+x.probability,0)-1)<1e-9);assert.ok(p.every((x,j)=>x.probability>0&&(j===0||x.probability<=p[j-1].probability)));}}});
test('some close contacts are confidently misclassified while others rank correctly',()=>{const results=CLASSES.map((name,i)=>predict(i,20,i+1)[0].name===name);assert.ok(results.some(Boolean));assert.ok(results.some(x=>!x));assert.deepEqual(predict(2,300,3),predict(2,300,3));assert.notEqual(predict(2,20,3)[0].name,CLASSES[2]);});
test('unknown objects only get known model predictions',()=>assert.ok(predict(CLASSES.length,100,42).every(x=>CLASSES.includes(x.name))));
