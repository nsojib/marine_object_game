import {readFileSync} from 'node:fs';
import {configureDistribution} from '../src/spawn-zones.js';
const config=JSON.parse(readFileSync(new URL('../backend/game_config.json',import.meta.url),'utf8'));
configureDistribution(config.objects);
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vesselSpawnPosition,vesselRoster} from '../src/spawn-zones.js';
test('large vessels always spawn in the middle ocean corridor',()=>{
 for(const kind of [0,1,4])for(const sample of [0,.25,.5,.75,.999]){
  const p=vesselSpawnPosition(kind,()=>sample);assert.ok(p.z<=-1200&&p.z>=-2800);assert.ok(Math.abs(p.x)<=450);
  // Even their near-side traffic waypoint remains well away from departure.
  assert.ok(p.z+160<=-1040);
 }
});
test('personal watercraft and kayaks begin near shore',()=>{
 for(const kind of [8,9])for(const sample of [0,.5,.999]){const p=vesselSpawnPosition(kind,()=>sample);assert.ok(p.z>=350&&p.z<=650);assert.ok(Math.abs(p.x)<=180);}
});

test('vessel distribution matches the requested category counts',()=>{
 const roster=vesselRoster([0,1,2,4,5,7,8,9,13]);assert.equal(roster.length,20);
 for(const [kind,count] of [[0,2],[1,2],[2,2],[4,0],[5,4],[7,3],[8,2],[9,3],[13,2]])assert.equal(roster.filter(k=>k===kind).length,count);
});
