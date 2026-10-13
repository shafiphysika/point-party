const {test}=require('node:test');
const assert=require('node:assert/strict');
const dice=require('../lucky-dice.js');
test('random selection reaches every student including numbers above six',()=>{
 for(let i=0;i<26;i++) assert.equal(dice.randomIndex(26,a=>{a[0]=i;}),i);
});
test('random selection rejects the biased tail before choosing a student',()=>{
 const values=[4294967295,25];
 assert.equal(dice.randomIndex(26,a=>{a[0]=values.shift();}),25);
 assert.equal(values.length,0);
});
test('invalid and empty pools cannot produce a winner',()=>{
 for(const n of [0,-1,1.5,NaN]) assert.throws(()=>dice.randomIndex(n),RangeError);
});
test('overlapping legacy modes migrate to one dice show',()=>{
 for(const mode of ['buddy','cinema','surprise'])assert.equal(dice.resolveEffect(mode),'show');
 for(const mode of ['original','show','machine','magic'])assert.equal(dice.resolveEffect(mode),mode);
 assert.equal(dice.resolveEffect('invalid'),'show');
 assert.deepEqual(dice.EFFECTS.map(e=>e.id),['original','show','machine','magic']);
});
test('original die has visible six-sided pips and machine has its own chamber',()=>{
 assert.match(dice.markup('original'),/dice-face face-6/);
 assert.doesNotMatch(dice.markup('original'),/baby-dice\.png/);
 assert.match(dice.markup('machine'),/machine-chamber/);
 assert.match(dice.markup('show'),/clay-dice-buddy/);assert.match(dice.markup('show'),/assets\/clay-teacher\.png/);
});
