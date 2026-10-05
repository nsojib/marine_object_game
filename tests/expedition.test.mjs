import {test} from 'node:test';
import assert from 'node:assert/strict';
import {depthProgress,expeditionConditions,recognitionScore,applyScore} from '../src/expedition.js';
test('shore to deep sea spans the long map',()=>{assert.equal(depthProgress(900),0);assert.equal(depthProgress(-4500),1);assert.equal(expeditionConditions(900,0).weather,'Clear');assert.equal(expeditionConditions(-4500,0).sea,'Rough');assert.equal(expeditionConditions(900,100).weather,'Rain');});
test('perfect expedition totals 100 with scaled novelty bonus',()=>{assert.equal(10*recognitionScore(600,-4500)+2*recognitionScore(600,-4500,true),100);assert.ok(recognitionScore(600,-4500)>recognitionScore(600,900));assert.ok(recognitionScore(600,900)>recognitionScore(100,900));});
test('score remains between 0 and 100 including penalties',()=>{assert.equal(applyScore(99,8),100);assert.equal(applyScore(0,-1),0);assert.equal(applyScore(5,-1),4);});
