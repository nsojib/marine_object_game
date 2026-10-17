import {readFileSync} from 'node:fs';
import {configureLife} from '../src/life.js';
const config=JSON.parse(readFileSync(new URL('../backend/game_config.json',import.meta.url),'utf8'));
configureLife(config);
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAX_LIFE,remainingLife} from '../src/life.js';
test('five crashes or ten wrong identifications exhaust life',()=>{
 for(const [cause,count] of [['collision',5],['wrong',10]]){let life=MAX_LIFE;for(let i=0;i<count;i++)life=remainingLife(life,cause);assert.equal(life,0);assert.equal(remainingLife(life,cause),0);}
});
test('mixed damage accumulates and cannot produce negative life',()=>{assert.equal(remainingLife(remainingLife(10,'collision'),'wrong'),7);assert.equal(remainingLife(1,'collision'),0);});
