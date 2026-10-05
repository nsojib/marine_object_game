import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evolvingWeather} from '../src/weather.js';
test('automatic weather evolves even while stationary',()=>{const a=evolvingWeather(0,900,0),b=evolvingWeather(70,900,0);assert.equal(a.weather,'Clear');assert.notEqual(a.rain,b.rain);assert.notEqual(a.visibility,b.visibility);});
test('weather effects remain bounded throughout a full expedition',()=>{for(let t=0;t<=480;t+=3){const w=evolvingWeather(t,-4500,100);for(const key of ['rain','fog','cloud','swell','glare'])assert.ok(w[key]>=0&&w[key]<=1);assert.ok(w.visibility>=260&&w.visibility<=780);}});
test('manual clear and calm override storm fronts',()=>{const w=evolvingWeather(70,-4500,100,'Clear','Calm');assert.equal(w.rain,0);assert.equal(w.fog,0);assert.equal(w.sea,'Calm');});
test('weather is deterministic so paused time freezes effects',()=>assert.deepEqual(evolvingWeather(85,-1200,20),evolvingWeather(85,-1200,20)));
