import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FOCUS, selectQuestions, recordAnswer, summarize, readState, shuffle } from '../engine.js';
const data=JSON.parse(await readFile(new URL('../data.json',import.meta.url),'utf8'));
test('all 18 topics have sourced questions with four distinct answers',()=>{
  assert.equal(data.topics.length,18);assert.equal(data.questions.length,108);
  assert.equal(new Set(data.questions.map(q=>q.id)).size,108);
  for(const t of data.topics){
    const qs=data.questions.filter(q=>q.topic===t.id);
    assert.ok(qs.length>=4);
    for(const q of qs){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));assert.ok(t.paragraphs[q.sourceParagraph].includes(q.anchor));assert.ok(q.explanation.length>20);}
  }
  assert.equal(data.questions.filter(q=>FOCUS.includes(q.topic)).length,48);
});
test('exam includes every topic and exactly 20 unique questions',()=>{
  for(let n=0;n<100;n++){
    const qs=selectQuestions(data.questions,'exam',data.topics.map(t=>t.id));
    assert.equal(qs.length,20);assert.equal(new Set(qs.map(q=>q.id)).size,20);assert.equal(new Set(qs.map(q=>q.topic)).size,18);
    assert.equal(qs.filter(q=>FOCUS.includes(q.topic)).length,5);
  }
});
test('practice prioritizes errors then unseen, within chosen topics',()=>{
  const first=data.questions.find(q=>q.topic===4);const next=data.questions.find(q=>q.topic===4&&q.id!==first.id);
  let p=recordAnswer({},first,null);p=recordAnswer(p,next,next.answer);
  const qs=selectQuestions(data.questions,'practice',[4],p);
  assert.equal(qs[0].id,first.id);assert.equal(qs.at(-1).id,next.id);assert.ok(qs.every(q=>q.topic===4));
});
test('wrong answers and timeouts enter review, subsequent correct answer clears them',()=>{
  const q=data.questions[0];let p=recordAnswer({},q,null);
  assert.equal(selectQuestions(data.questions,'errors',[q.topic],p).length,1);
  p=recordAnswer(p,q,q.answer);
  assert.equal(selectQuestions(data.questions,'errors',[q.topic],p).length,0);
  assert.deepEqual(p[q.id],{attempts:2,correct:1,wrong:false});
});
test('storage corruption and denied access are handled',()=>{
  for(const storage of [{getItem:()=>'{bad'},{getItem:()=>{throw new Error();}},{getItem:()=>'{"progress":null}'}])assert.deepEqual(readState(storage).progress,{});
  assert.deepEqual(readState({getItem:()=>JSON.stringify({progress:{bad:{},fine:{attempts:1,correct:0,wrong:true}},read:[4,200,'x']})}).read,[4]);
});
test('shuffle preserves options without mutating the source',()=>{
  const items=['a','b','c','d'];assert.deepEqual(shuffle(items,()=>0),['b','c','d','a']);assert.deepEqual(items,['a','b','c','d']);
});
test('score uses answers and actual elapsed times',()=>{
  assert.deepEqual(summarize([{correct:true,seconds:3},{correct:false,seconds:60}]),{correct:1,total:2,seconds:63});
});
