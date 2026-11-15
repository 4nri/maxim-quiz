import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { REACTIONS, answerReaction, resultReaction, reactionMarkup } from '../reactions.js';

test('no reaction exposes exam correctness or an unanswered question',()=>{
  assert.equal(answerReaction('exam',[{correct:true}],0),null);
  assert.equal(answerReaction('exam',[{correct:false}],0),null);
  assert.equal(answerReaction('practice',[],0),null);
  assert.equal(reactionMarkup(null),'');
});

test('practice reactions match the answer and streak resets after a mistake',()=>{
  const answers=[{correct:true},{correct:true},{correct:true}];
  assert.equal(answerReaction('practice',answers,2).id,'celebrate');
  assert.match(answerReaction('practice',answers,2).title,/3 подряд/);
  answers.push({correct:false},{correct:true});
  assert.ok(['think','strong'].includes(answerReaction('errors',answers,3).id));
  assert.doesNotMatch(answerReaction('practice',answers,4).title,/подряд/);
  assert.equal(resultReaction(20,20).id,'celebrate');
  assert.equal(resultReaction(0,20).id,'strong');
});

test('reaction assets exist locally and markup defaults to still images',async()=>{
  let totalBytes=0;
  for(const reaction of Object.values(REACTIONS)){
    const base=new URL(`../assets/reactions/${reaction.id}`,import.meta.url);
    const clip=await readFile(`${base.pathname}.webp`);
    const poster=await readFile(`${base.pathname}.svg`,'utf8');
    assert.equal(clip.toString('ascii',0,4),'RIFF');
    assert.equal(clip.toString('ascii',8,12),'WEBP');
    assert.ok(clip.includes(Buffer.from('ANIM')));
    assert.match(poster,/<svg/);assert.doesNotMatch(poster,/<script|<foreignObject/);
    assert.match(reactionMarkup(reaction),/\.svg/);
    assert.doesNotMatch(reactionMarkup(reaction),/\.webp|https:/);
    assert.ok(reaction.duration<=2000);
    totalBytes+=clip.length;
  }
  assert.ok(totalBytes<1_500_000);
});
