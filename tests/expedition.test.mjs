import {readFileSync} from 'node:fs';
import {configureScoring} from '../src/expedition.js';
configureScoring(JSON.parse(readFileSync(new URL('../backend/game_config.json',import.meta.url),'utf8')));
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {depthProgress,expeditionConditions,recognitionScore,applyScore} from '../src/expedition.js';
test('shore to deep sea spans the long map',()=>{assert.equal(depthProgress(900),0);assert.equal(depthProgress(-4500),1);assert.equal(expeditionConditions(900,0).weather,'Clear');assert.equal(expeditionConditions(-4500,0).sea,'Rough');assert.equal(expeditionConditions(900,250).weather,'Rain');});
test('identification rewards increase with distance and depth',()=>{assert.equal(recognitionScore(0,900),10);assert.equal(recognitionScore(600,-4500),20);assert.ok(recognitionScore(600,-4500)>recognitionScore(600,900));assert.ok(recognitionScore(600,900)>recognitionScore(100,900));});
test('scores have no upper cap and penalties stop at zero',()=>{assert.equal(applyScore(990,400),1390);assert.equal(applyScore(0,-50),0);assert.equal(applyScore(500,-100),400);});

test('distance and depth bonuses increase gradually and clamp at their limits',()=>{
 assert.equal(recognitionScore(0,900),10);
 assert.equal(recognitionScore(100,900),11);
 assert.equal(recognitionScore(350,900),13.5);
 assert.equal(recognitionScore(600,900),16);
 assert.equal(recognitionScore(1200,900),16);
 assert.equal(recognitionScore(-100,900),10);
 assert.equal(recognitionScore(0,-1800),12);
 assert.equal(recognitionScore(0,-4500),14);
 assert.equal(recognitionScore(0,-6000),14);
 assert.equal(recognitionScore(0,1200),10);
});
test('speed bonus is gradual, capped, and included in the rounded reward',()=>{
 const reward=knots=>recognitionScore(0,900,false,knots/1.94384);
 assert.equal(reward(2),10.4);assert.equal(reward(5),11);
 assert.equal(reward(12),12.4);assert.equal(reward(15),13);
 assert.equal(reward(80),13);assert.equal(reward(-5),10);
 assert.equal(recognitionScore(350,-1800,false,12/1.94384),17.9);
 assert.equal(recognitionScore(600,-4500,false,20),23);
 assert.equal(recognitionScore(123,900),11.2);
});
test('score accumulation retains tenths without floating point artifacts',()=>{
 assert.equal(applyScore(17.9,10.4),28.3);
 assert.equal(applyScore(17.9,-3),14.9);
 assert.equal(applyScore(2.4,-5),0);
});
