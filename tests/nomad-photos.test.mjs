import {ACTIVE_CLASSES,VESSEL_KINDS,CLASSES} from '../src/rules.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('inset manifest exactly matches selected files without refilling removed photos',async()=>{
 const groups=JSON.parse(await readFile(new URL('../public/nomad-inset/manifest.json',import.meta.url),'utf8'));
 assert.deepEqual(ACTIVE_CLASSES.map(c=>c.name).sort(),groups.filter(g=>g.photos.length).map(g=>g.className).sort());
 assert.ok(!ACTIVE_CLASSES.some(c=>['Barge','Pleasure craft','Dredger'].includes(c.name)));
 assert.ok(VESSEL_KINDS.every(k=>ACTIVE_CLASSES.some(c=>c.kind===k)));
 for(const g of groups){
  const dir=new URL('../selected_nomad_objects/'+g.slug+'/',import.meta.url);
  const names=(await readdir(dir)).filter(f=>/\.(png|jpe?g|webp)$/i.test(f)).sort();
  assert.deepEqual(g.photos.map(p=>p.selectedFile),names.map(n=>g.slug+'/'+n));
  for(const p of g.photos){
   assert.equal(p.crop.length,4);assert.ok(p.crop.every(n=>n>=0&&n<=1));
   const source=await readFile(new URL('../selected_nomad_objects/'+p.selectedFile,import.meta.url));
   assert.equal(p.sourceHash,createHash('sha256').update(source).digest('hex'));
   assert.ok((await stat(new URL('../public/'+p.file,import.meta.url))).size>0);
  }
 }
});

test('new marker categories are active with at least two instances each',async()=>{
 const config=JSON.parse(await readFile(new URL('../backend/game_config.json',import.meta.url),'utf8'));
 for(const [name,key] of [['Regulatory mark','regulatory_marker'],['Channel marker','channel_marker'],['Safe-water marker','safe_water_marker']]){
  assert.ok(ACTIVE_CLASSES.some(c=>c.name===name));assert.ok(config.objects[key]>=2);
 }
 assert.ok(!('dredger' in config.objects));
});
