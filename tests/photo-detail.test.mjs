import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {photoCrop,photoResolution} from '../src/photo-detail.js';
const crops=JSON.parse(readFileSync(new URL('../src/photo-crops.json',import.meta.url)));
const groups=JSON.parse(readFileSync(new URL('../public/reference-photos/manifest.json',import.meta.url)));
test('all 65 photo crops retain their subject and stay within the source image',()=>{
 for(const group of groups){assert.equal(crops[group.slug].length,5);for(const box of crops[group.slug]){
  const [x,y,w,h]=box;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=1.001&&y+h<=1.001);
  const c=photoCrop(800,600,box);
  assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=800.001&&c.y+c.height<=600.001);
  assert.ok(c.x<=x*800+.001&&c.y<=y*600+.001);
  assert.ok(c.x+c.width>=(x+w)*800-.001&&c.y+c.height>=(y+h)*600-.001);
 }}
});
test('approaching increases native resolution without exceeding source detail',()=>{
 let previous=0;
 for(const distance of [2000,1200,900,600,300,100,40,0]){
  const size=photoResolution(distance,800,400);
  assert.ok(size.width>=previous);assert.equal(size.width,size.height*2);previous=size.width;
 }
 assert.equal(photoResolution(1200,800,400).width,26);
 assert.equal(photoResolution(20,800,400).width,512);
 assert.equal(photoResolution(0,90,45).width,90);
 assert.equal(photoResolution(NaN,800,400).width,26);
});

test('distant objects retain shape while close objects gain detail',()=>{
 assert.ok(photoResolution(200,800,400).width>=64&&photoResolution(200,800,400).width<=96);
 assert.ok(photoResolution(100,800,400).width>=160&&photoResolution(100,800,400).width<=224);
 assert.ok(photoResolution(50,800,400).width>=400);
 assert.equal(photoResolution(20,800,400).width,512);
});
