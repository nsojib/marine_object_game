import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
test('bundled free assets remain small and all texture references resolve locally',()=>{
 const root=resolve('public/models/kenney');let bytes=0,triangles=0;
 for(const name of ['ship-cargo-a','boat-tug-a','boat-fishing-small','boat-speed-a','boat-sail-a']){
  const data=readFileSync(resolve(root,name+'.glb'));bytes+=data.length;
  assert.equal(data.readUInt32LE(0),0x46546c67);assert.equal(data.readUInt32LE(4),2);
  const json=JSON.parse(data.subarray(20,20+data.readUInt32LE(12)).toString());
  for(const mesh of json.meshes)for(const p of mesh.primitives)triangles+=json.accessors[p.indices].count/3;
  for(const image of json.images??[]){if(image.uri){const path=resolve(root,image.uri);assert.ok(path.startsWith(root));assert.ok(existsSync(path));}}
 }
 bytes+=statSync(resolve(root,'Textures/colormap.png')).size;
 assert.ok(bytes<250*1024,`Asset transfer budget: ${bytes}`);assert.ok(triangles<3000,`Triangle budget: ${triangles}`);
 assert.match(readFileSync(resolve(root,'License.txt'),'utf8'),/CC0/);
});
