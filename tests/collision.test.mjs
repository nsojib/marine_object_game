import {test} from 'node:test';
import assert from 'node:assert/strict';
import {overlaps} from '../src/collision.js';
const boat={x:0,z:0,yaw:0,width:4.3,length:7};
test('vessel footprints block overlapping hulls and allow separation',()=>{assert.ok(overlaps(boat,{...boat,z:6}));assert.ok(!overlaps(boat,{...boat,z:8}));});
test('rotated long ships collide across the bow but not beyond their beam',()=>{const ship={x:10,z:0,yaw:Math.PI/2,width:4,length:30};assert.ok(overlaps(boat,ship));assert.ok(!overlaps({...boat,z:7},ship));});
test('collision is symmetric for arbitrary headings',()=>{const b={x:3,z:2,yaw:.73,width:6,length:13};assert.equal(overlaps(boat,b),overlaps(b,boat));});
