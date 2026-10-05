import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {CLASSES} from '../src/rules.js';
const root=new URL('../public/',import.meta.url);
test('every known class has five local credited reference photographs',async()=>{
 const groups=JSON.parse(await readFile(new URL('reference-photos/manifest.json',root),'utf8'));
 assert.deepEqual(groups.map(g=>g.className),CLASSES);
 const files=new Set();let total=0;
 for(const group of groups){assert.equal(group.photos.length,5);for(const photo of group.photos){
  assert.ok(!files.has(photo.file));files.add(photo.file);
  assert.match(photo.file,/^reference-photos\/[a-z-]+\/0[1-5]\.webp$/);
  assert.ok(photo.author&&photo.license&&photo.source&&photo.licenseUrl);
  assert.match(photo.source,/^https:\/\/commons\.wikimedia\.org\//);
  assert.match(photo.license,/^(CC BY|CC0|Public domain)/);
  const url=new URL(photo.file,root),size=(await stat(url)).size;total+=size;
  const image=await readFile(url);assert.equal(image.subarray(0,4).toString(),'RIFF');assert.equal(image.subarray(8,12).toString(),'WEBP');
  assert.ok(size>1000&&size<250000,`${photo.file}: unexpected file size ${size}`);
 }}
 assert.equal(files.size,65);assert.ok(total<10*1024*1024);
});
