import {test} from 'node:test';
import assert from 'node:assert/strict';
import {trafficStep} from '../src/traffic-motion.js';
test('boats advance in their bow direction',()=>{const p=trafficStep(0,0,0,0,-100,4,1);assert.equal(p.x,0);assert.equal(p.z,-4);});
test('traffic turns gradually and does not exceed its speed',()=>{const p=trafficStep(0,0,0,100,0,5,.1);assert.ok(p.yaw<0);assert.ok(Math.abs(p.yaw)<=.03);assert.ok(Math.hypot(p.x,p.z)<=.5);});
test('zero simulation time leaves traffic stationary',()=>{assert.deepEqual(trafficStep(3,4,.2,100,20,4,0),{x:3,z:4,yaw:.2});});
