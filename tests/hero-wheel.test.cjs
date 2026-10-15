const {test}=require('node:test');
const assert=require('node:assert/strict');
const dice=require('../lucky-dice.js');
test('wheel lands the pointer at the chosen equal-size segment for one to sixty learners',()=>{
 for(let n=1;n<=60;n++)for(let i=0;i<n;i++){
  const angle=dice.wheelAngle(i,n);
  const pointer=((360-angle%360)%360);
  assert.ok(Math.abs(pointer-(i+.5)*360/n)<.000001);
 }
});
test('wheel renders safe names and full roster labels, including a single learner',()=>{
 const html=dice.wheelMarkup([{seat:3,name:'<img src=x onerror=alert(1)>'}]);
 assert.ok(!html.includes('<img'));assert.match(html,/&lt;img/);assert.match(html,/wheel-name/);
 assert.match(dice.wheelMarkup([]),/No learners/);
});
