import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, recordAnswer, readState, STORAGE_KEY } from '../engine.js';
import { syncGame, totalXP, awardAnswer, unlockedItems, mascotMarkup } from '../game.js';

const questions = Array.from({length:6},(_,i)=>({id:`q${i}`,topic:4+Math.floor(i/2),answer:'yes'}));
function answer(state, index, correct) {
  const q=questions[index], before=awardAnswer(state,questions,q,correct);
  state.progress=recordAnswer(state.progress,q,correct?'yes':'no');
  syncGame(state,questions);
  return totalXP(state.game)-before;
}
test('first correct and first recovery earn once, repetitions cannot farm XP',()=>{
  const s=freshState();
  assert.equal(answer(s,0,false),0);
  assert.equal(answer(s,0,true),15);
  assert.equal(answer(s,0,true),0);
  assert.equal(answer(s,0,false),0);
  assert.equal(answer(s,0,true),0);
  assert.equal(totalXP(s.game),15);
});
test('topic awards require all latest answers correct and never disappear after mistakes',()=>{
  const s=freshState();
  answer(s,0,true); answer(s,0,false);
  assert.equal(answer(s,1,true),10);
  assert.deepEqual(s.game.mastered,[]);
  assert.equal(answer(s,0,true),35);
  assert.deepEqual(s.game.mastered,[4]);
  answer(s,1,false);
  assert.equal(totalXP(s.game),55);
  assert.equal(answer(s,1,true),5);
  assert.equal(totalXP(s.game),60);
});
test('existing progress migrates without inventing historical recoveries; reload preserves rewards and equipment',()=>{
  const s=freshState();
  s.progress.q0={attempts:4,correct:2,wrong:true};
  syncGame(s,questions);
  assert.equal(totalXP(s.game),10);
  assert.deepEqual(s.game.recovered,[]);
  for(let i=0;i<6;i++)answer(s,i,true);
  assert.deepEqual(unlockedItems(s.game),['none','star','medal','shield']);
  s.game.equipped='shield';
  const loaded=readState({getItem:key=>key===STORAGE_KEY?JSON.stringify(s):null});
  syncGame(loaded,questions);
  assert.deepEqual(loaded.game,s.game);
  assert.equal(answer(loaded,0,true),0);
});
test('bad saved game data is normalized, locked equipment cannot be selected',()=>{
  const s=freshState();
  s.game={earned:['missing','q0','q0'],recovered:['missing','q0','q0'],mastered:[999,4,4],equipped:'shield'};
  syncGame(s,questions);
  assert.deepEqual(s.game,{earned:['q0'],recovered:['q0'],mastered:[4],equipped:'none'});
  s.game={earned:4,recovered:{},mastered:null,equipped:'<script>'};
  syncGame(s,questions);
  assert.equal(totalXP(s.game),0);
  assert.equal(s.game.equipped,'none');
  assert.equal(mascotMarkup('<script>','<script>').includes('<script>'),false);
});
test('exam answers can remain pending without changing rewards until the round is committed',()=>{
  const s=freshState();syncGame(s,questions);
  s.session={mode:'exam',answers:[{id:'q0',correct:true},{id:'q1',correct:true}]};
  syncGame(s,questions);
  assert.equal(totalXP(s.game),0);
  for(const a of s.session.answers)answer(s,questions.findIndex(q=>q.id===a.id),a.correct);
  assert.equal(totalXP(s.game),50);
  syncGame(s,questions);
  assert.equal(totalXP(s.game),50);
});
