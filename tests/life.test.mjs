import {readFileSync} from 'node:fs';
import {configureLife} from '../src/life.js';
const config=JSON.parse(readFileSync(new URL('../backend/game_config.json',import.meta.url),'utf8'));
configureLife(config);
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAX_LIFE,remainingLife} from '../src/life.js';
test('two crashes or five wrong identifications exhaust life',()=>{
 for(const [cause,count] of [['collision',2],['wrong',5]]){let life=MAX_LIFE;for(let i=0;i<count;i++)life=remainingLife(life,cause);assert.equal(life,0);assert.equal(remainingLife(life,cause),0);}
});
test('mixed damage accumulates and cannot produce negative life',()=>{assert.equal(remainingLife(remainingLife(5,'collision'),'wrong'),1);assert.equal(remainingLife(1,'collision'),0);});

test('first crash leaves two life and second ends the game',()=>{assert.equal(MAX_LIFE,5);const after=remainingLife(MAX_LIFE,'collision');assert.equal(after,2);assert.equal(remainingLife(after,'collision'),0);});
