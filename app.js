import { FOCUS, STORAGE_KEY, shuffle, selectQuestions, recordAnswer, summarize, readState, freshState } from './engine.js';

const main = document.querySelector('main');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data, state, storage, timer, flash, lastResult, pendingStart, saveFailed = false;
try { storage = window.localStorage; } catch { storage = {getItem:()=>null,setItem:()=>{throw new Error('Storage unavailable');}}; }
state = readState(storage);
const byId = id => data.questions.find(q => q.id === id);
const topicById = id => data.topics.find(t => t.id === Number(id));
const allIds = () => data.topics.map(t=>t.id);
const isFocus = id => FOCUS.includes(id);
const questionsFor = id => data.questions.filter(q => q.topic === id);
const errors = () => data.questions.filter(q => state.progress[q.id]?.wrong);
const learned = qs => qs.filter(q => state.progress[q.id] && !state.progress[q.id].wrong).length;
const action = (name, label, value='', cls='button') => `<button class="${cls}" data-action="${name}" data-value="${esc(value)}">${label}</button>`;
function save() { try { storage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch { saveFailed = true; } }
function navigate(hash) { if(location.hash === hash) render(); else location.hash = hash; }
function source(q) {
  const t = topicById(q.topic);
  return `<details><summary>Проверить по материалу</summary><blockquote>${esc(t.paragraphs[q.sourceParagraph])}</blockquote><p class="note">${esc(t.title)} · <a href="${t.url}" target="_blank" rel="noopener noreferrer">Статья проекта ↗</a></p></details>`;
}
const icons = {
  4:'<path d="M8 10h18v13c0 10-9 15-9 15S8 33 8 23zM18 10V6h18v17c0 8-6 13-9 15M11 19l4-1m5 0 3 1m-10 8q4-4 8 0M28 15l4 1m-4 10 4-2"/>',
  5:'<path d="m5 27 15-7V8c0-5 5-5 5 0v12l15 7v4l-15-3v8l5 4v3l-8-2-8 2v-3l6-4v-8L5 31z"/>',
  6:'<path d="M10 39V23h24v16M7 23l15-10 15 10M18 39V28h8v11M6 40h32M22 13V5m0 0h11l-3 4H22M12 19h20"/>'
};
const descriptions = {4:'Актриса, фронтовые концерты и Народный театр в Покрове.',5:'Защита московского неба и судьба лётчика.',6:'Разведчик и площадь его имени в Ясеневе.'};
function topicCard(t, featured=false) {
  const qs=questionsFor(t.id), n=learned(qs);
  return `<article class="topic-card"><div class="card-top"><span class="topic-no">ТЕМА ${String(t.id).padStart(2,'0')}</span><span class="tag ${isFocus(t.id)?'focus':''}">${isFocus(t.id)?'Твоя тема':state.read.includes(t.id)?'Прочитано':'Общий кругозор'}</span></div>${featured?`<div class="topic-art" aria-hidden="true"><svg viewBox="0 0 44 46">${icons[t.id]}</svg></div>`:''}<h3>${esc(t.short)}</h3><p class="topic-description">${esc(featured?descriptions[t.id]:t.title)}</p><div class="topic-progress"><span>${n ? 'Правильные последние ответы' : 'Готов к первому шагу'}</span><span>${n} / ${qs.length}</span></div><div class="bar" aria-hidden="true"><i style="width:${n/qs.length*100}%"></i></div><div class="card-actions"><a class="button" href="#topic/${t.id}">Изучить тему <span aria-hidden="true">↗</span></a>${action('practice','Тест',t.id,'button secondary')}</div></article>`;
}
function home() {
  const focusQuestions=data.questions.filter(q=>isFocus(q.topic));
  const examHistory=state.history.filter(h=>h.mode==='exam');
  const best=examHistory.length?Math.max(...examHistory.map(h=>h.correct)):null;
  const seen=data.questions.filter(q=>state.progress[q.id]).length;
  const remaining=Math.max(0,Math.ceil((Date.parse('2026-11-19T00:00:00+03:00')-Date.now())/86400000));
  return `${state.session?`<div class="resume"><span>У тебя есть незаконченная ${state.session.mode==='exam'?'пробная игра':'тренировка'}.</span>${action('resume','Продолжить →','','button secondary')}</div>`:''}
  <section class="hero"><div><p class="eyebrow">ЛИЧНЫЙ МАРШРУТ ПОДГОТОВКИ</p><h1>Максим, твой район.<br>Твоя <em>история.</em></h1><p class="hero-copy">Узнай о людях и местах, которые хранят память о подвиге. Твои главные темы: 4, 5 и 6. Начнём с них.</p><div class="hero-meta"><span><i class="status-dot"></i>3 темы изучаем подробно</span><span>18 тем повторяем вместе</span></div></div><aside class="event"><p class="eyebrow">ВСТРЕЧАЕМСЯ НА КВИЗЕ</p><span class="event-tag">${remaining>0?`До игры ${remaining} дн.`:'Сезон 2026–2027'}</span><div class="event-date">19<span>ноября</span></div><div class="event-bottom"><span>Четверг</span><span>13:00–13:30 · МСК</span></div><svg class="city" viewBox="0 0 150 110" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M3 103h144M9 103V57h25v46M14 57V45h15v12M21 45V24m-5 14h10M39 103V73h30v30M45 73V60h18v13M53 60V40M74 103V48h30v55M79 48V35h20v13M89 35V6M84 19l5-7 5 7M110 103V66h29v37M115 66V51h19v15M125 51V33M17 68h9m-9 10h9m-9 10h9M82 60h14m-14 12h14m-14 12h14M47 83h14m-14 9h14M117 77h14m-14 10h14"/><circle cx="89" cy="26" r="5"/></svg></aside></section>
  <section class="stats" aria-label="Твой прогресс"><div class="stat"><strong>${learned(focusQuestions)} <small>/ ${focusQuestions.length}</small></strong><p>Верно в твоих темах</p></div><div class="stat"><strong>${seen} <small>/ ${data.questions.length}</small></strong><p>Вопросов попробовал</p></div><div class="stat"><strong>${best??'—'} <small>/ 20</small></strong><p>Лучший пробный квиз</p></div><div class="stat"><strong>${errors().length}</strong><p>Вопросов на повторение</p></div></section>
  <section><div class="section-top"><h2>Твои три темы</h2><p>Прочитай → запомни → проверь себя</p></div><div class="focus-grid">${FOCUS.map(id=>topicCard(topicById(id),true)).join('')}</div></section>
  <section class="practice-grid" aria-label="Режимы подготовки"><article class="practice-banner"><div><p class="eyebrow">КАК НА НАСТОЯЩЕЙ ИГРЕ</p><h3>Пробный квиз</h3><p>20 вопросов · все темы · 60 секунд на ответ</p></div>${action('exam','Начать игру ↗','','button light')}</article><article class="practice-banner pale"><div><p class="eyebrow">ВСПОМНИ БЕЗ ПОДСКАЗОК</p><h3>Карточки по твоим темам</h3><p>Имена, даты и события. В удобном темпе.</p></div>${action('cards','Повторить →','focus','button secondary')}</article></section>
  <div class="home-bottom"><p class="note">Сначала изучи свои темы. Потом попробуй общий квиз<br>и вернись к вопросам, в которых ошибся.</p><a class="text-button" href="#print">Памятка по темам 4–6 для печати ↗</a></div>`;
}
let topicFilter='all', searchText='';
function topicsPage() {
  return `<p class="eyebrow">БИБЛИОТЕКА ПОДГОТОВКИ</p><h1 class="page-title">Все 18 тем</h1><p class="note">Твои темы отмечены отдельно. Остальные помогут увереннее отвечать вместе с командой.</p><div class="toolbar"><input class="search" id="topic-search" type="search" placeholder="Найти человека, место или номер темы" aria-label="Поиск по темам" value="${esc(searchText)}"><select id="topic-filter" aria-label="Какие темы показать"><option value="all" ${topicFilter==='all'?'selected':''}>Все темы</option><option value="focus" ${topicFilter==='focus'?'selected':''}>Мои темы 4–6</option><option value="unread" ${topicFilter==='unread'?'selected':''}>Ещё не прочитано</option></select>${action('practice','Тренировка по всем темам','all','button secondary')}</div><div class="all-grid" id="topic-grid">${filteredTopics()}</div>`;
}
function filteredTopics() {
  const normalize=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е');
  const list=data.topics.filter(t=>(topicFilter!=='focus'||isFocus(t.id))&&(topicFilter!=='unread'||!state.read.includes(t.id))&&normalize(`${t.id} ${t.short} ${t.title}`).includes(normalize(searchText.trim())));
  return list.length?list.map(t=>topicCard(t)).join(''):'<p class="note">Темы не найдены. Попробуй другое имя или убери фильтр.</p>';
}
function topicPage(id) {
  const t=topicById(id); if(!t) return home();
  const qs=questionsFor(t.id), n=learned(qs);
  return `<a href="#topics" class="back">← Ко всем темам</a><div class="reader"><article><p class="eyebrow">ТЕМА ${String(id).padStart(2,'0')} ${isFocus(t.id)?'· ТВОЯ ЗОНА ПОДГОТОВКИ':''}</p><h1>${esc(t.title)}</h1><p class="note">Запомни ключевые факты, затем прочитай полный материал и проверь себя.</p><div class="fact-list">${qs.map(q=>`<div class="fact"><p>${esc(q.prompt)}</p><strong>${esc(q.answer)}</strong><p class="note">${esc(q.explanation)}</p></div>`).join('')}</div><details id="full-source"><summary>Прочитать полный исходный материал</summary><div class="source-text">${t.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div><p class="note">Текст из предоставленного документа сохранён без редакторских изменений.</p><a href="${t.url}" target="_blank" rel="noopener noreferrer">Открыть статью проекта ↗</a></details>${action('read',state.read.includes(t.id)?'✓ Прочитано · снять отметку':'Отметить как прочитанное',t.id,'button secondary')}</article><aside class="reader-side"><p class="eyebrow">ЗАКРЕПИ МАТЕРИАЛ</p><h3>${n} из ${qs.length}</h3><p>вопросов с правильным последним ответом</p><div class="bar" aria-hidden="true"><i style="width:${n/qs.length*100}%"></i></div>${action('practice','Проверить себя →',t.id)}${action('cards','Карточки по теме',t.id,'button secondary')}<a class="button secondary" href="#print/${t.id}">Памятка для печати</a><p class="note" style="margin-top:20px">В тренировке время не ограничено. После ответа сразу появится пояснение.</p></aside></div>`;
}
function errorPage() {
  const qs=errors();
  return `<p class="eyebrow">ПОВТОРЕНИЕ</p><h1 class="page-title">Разберём ошибки</h1>${qs.length?`<p class="note">${qs.length} вопросов пока требуют внимания. Правильный ответ в следующей тренировке уберёт вопрос из этого списка.</p>${action('errors','Повторить все ошибки →')}<div class="fact-list">${qs.map(q=>`<div class="fact"><p>Тема ${q.topic} · ${esc(topicById(q.topic).short)}</p><strong>${esc(q.prompt)}</strong><details><summary>Вспомнить правильный ответ</summary><p class="note">${esc(q.explanation)}</p></details><a class="text-button" href="#topic/${q.topic}">Вернуться к теме ↗</a></div>`).join('')}</div>`:`<div class="empty"><div class="empty-mark">✓</div><h2>Здесь пока нет ошибок</h2><p>${Object.keys(state.progress).length?'Все вопросы из списка повторения уже исправлены. Попробуй новый квиз.':'Начни с тренировки. Вопросы, в которых ошибёшься, появятся здесь для повторения.'}</p>${action('practice','Тренировать темы 4–6','focus')}</div>`}`;
}
function scopeFor(value) { return value==='all'?allIds():value==='focus'?FOCUS:[Number(value)]; }
function start(mode,value='all',confirmed=false) {
  if(state.session && !confirmed){pendingStart={mode,value};document.querySelector('#new-round').showModal();return;}
  const scope=scopeFor(value);
  const qs=selectQuestions(data.questions,mode,scope,state.progress);
  if(!qs.length){navigate('#errors');return;}
  const now=Date.now();
  state.session={mode,scope,ids:qs.map(q=>q.id),options:Object.fromEntries(qs.map(q=>[q.id,shuffle(q.options)])),index:0,answers:[],started:now,deadline:mode==='exam'?now+60000:null};
  save();navigate('#quiz');
}
function validSession(s) {
  return s && ['exam','practice','errors'].includes(s.mode) && Array.isArray(s.ids) && s.ids.length>0 && s.ids.every(id=>byId(id)) && Number.isInteger(s.index) && s.index>=0 && s.index<s.ids.length && Array.isArray(s.answers) && s.answers.length>=s.index && s.answers.length<=s.index+1 && s.answers.every((a,i)=>a && a.id===s.ids[i] && (a.answer===null||byId(a.id).options.includes(a.answer)) && typeof a.correct==='boolean' && Number.isFinite(a.seconds) && a.seconds>=0) && s.options && s.ids.every(id=>Array.isArray(s.options[id]) && s.options[id].length===4 && new Set(s.options[id]).size===4 && s.options[id].every(o=>byId(id).options.includes(o))) && Number.isFinite(s.started) && (s.mode!=='exam'||Number.isFinite(s.deadline));
}
function quizPage() {
  const s=state.session;if(!validSession(s)){state.session=null;save();return `<div class="empty"><h2>Начни новую тренировку</h2><p>Сохранённый раунд недоступен. Уже записанный прогресс сохранён.</p><a href="#home" class="button">К подготовке</a></div>`;}
  const q=byId(s.ids[s.index]), a=s.answers[s.index], exam=s.mode==='exam';
  const answered=Boolean(a);
  return `<div class="quiz-shell"><div class="quiz-head"><a href="#home" class="back" style="margin:0">← К подготовке</a><p>${exam?'Пробный квиз':s.mode==='errors'?'Повторение ошибок':'Тренировка'} · ${s.index+1} / ${s.ids.length}</p><span class="timer" id="timer" role="timer" aria-label="Осталось времени">${exam?`${Math.max(0,Math.ceil((s.deadline-Date.now())/1000))} с`:'∞'}</span></div>${exam?'<p class="note">По 60 секунд на вопрос. Правильные ответы и пояснения увидишь после игры.</p>':'<p class="note">Без ограничения времени. Подумай, затем выбери один ответ.</p>'}<div class="bar" aria-label="Прогресс раунда"><i style="width:${s.index/s.ids.length*100}%"></i></div><section class="quiz-card"><p class="eyebrow">ТЕМА ${q.topic} · ${esc(topicById(q.topic).short)}</p><h1>${esc(q.prompt)}</h1><div class="answers">${s.options[q.id].map((o,i)=>{
    const correct=answered&&!exam&&o===q.answer, wrong=answered&&!exam&&o===a.answer&&!a.correct;
    return `<button class="answer ${correct?'correct':wrong?'wrong':answered&&o===a.answer?'selected':''}" data-action="answer" data-value="${i}" ${answered?'disabled':''}><span class="answer-key" aria-hidden="true">${i+1}</span><span>${esc(o)}</span>${correct?'<span class="answer-status" aria-label="Правильный ответ">✓</span>':wrong?'<span class="answer-status" aria-label="Неверный ответ">✕</span>':''}</button>`;
  }).join('')}</div>${answered?`<div class="feedback ${!exam&&!a.correct?'wrong':''}" role="status"><strong>${exam?(a.answer===null?'Время вышло':'Ответ принят'):(a.correct?'Верно!':'Запомним правильный ответ')}</strong><p>${exam?'Переходи к следующему вопросу.':esc(q.explanation)}</p>${!exam?source(q):''}</div>`:''}<div class="quiz-bottom"><p>${answered?'Ответ сохранён.':'Можно отвечать клавишами 1, 2, 3, 4.'}</p>${answered?action('next',s.index===s.ids.length-1?'Мой результат →':'Следующий вопрос →'):''}</div></section></div>`;
}
function answer(index) {
  const s=state.session;if(!validSession(s)||s.answers[s.index])return;
  const q=byId(s.ids[s.index]), expired=s.mode==='exam'&&Date.now()>=s.deadline;
  const chosen=expired||index===null?null:s.options[q.id][index];
  if(chosen===undefined)return;
  clearInterval(timer);
  const seconds=s.mode==='exam'?Math.min(60,(Date.now()-s.started)/1000):Math.max(0,(Date.now()-s.started)/1000);
  s.answers.push({id:q.id,answer:chosen,correct:chosen===q.answer,seconds});
  if(s.mode!=='exam')state.progress=recordAnswer(state.progress,q,chosen);
  save();render(false);
  document.querySelector('[data-action="next"]')?.focus({preventScroll:true});
}
function next() {
  const s=state.session;if(!s?.answers[s.index])return;
  if(s.index===s.ids.length-1){
    if(s.mode==='exam')for(const a of s.answers)state.progress=recordAnswer(state.progress,byId(a.id),a.answer);
    lastResult={...s,...summarize(s.answers)};
    state.history.push({mode:s.mode,date:new Date().toISOString(),...summarize(s.answers)});
    state.history=state.history.slice(-30);state.session=null;save();navigate('#result');
  }else{s.index++;s.started=Date.now();s.deadline=s.mode==='exam'?s.started+60000:null;save();render();}
}
function tick() {
  const s=state.session;
  if(!s||s.mode!=='exam'||s.answers[s.index])return;
  const left=Math.max(0,Math.ceil((s.deadline-Date.now())/1000));
  const el=document.querySelector('#timer');
  if(el){el.textContent=`${left} с`;el.classList.toggle('urgent',left<=10);}
  if(left===0)answer(null);
}
function resultPage() {
  const r=lastResult;if(!r)return `<div class="empty"><h2>Результаты сохраняются в твоём прогрессе</h2><p>Подробный разбор доступен сразу после раунда. Начни новую тренировку, чтобы проверить себя ещё раз.</p><a class="button" href="#home">Моя подготовка</a></div>`;
  const wrong=r.answers.filter(a=>!a.correct).length;
  return `<div class="quiz-shell"><a href="#home" class="back">← Моя подготовка</a><section class="result-hero"><p class="eyebrow">${r.mode==='exam'?'ПРОБНЫЙ КВИЗ':'ТРЕНИРОВКА'} ЗАВЕРШЁН</p><div class="result-score">${r.correct}<span> / ${r.total}</span></div><h1>${wrong===0?'Все ответы верные!':r.correct/r.total>=.7?'Хорошая работа, Максим!':'Теперь ты знаешь, что повторить'}</h1><p>${wrong?`Вопросов для разбора: ${wrong}. Они добавлены в повторение.`:'Попробуй ещё один раунд, чтобы закрепить результат.'}<br>Среднее время ответа: ${Math.round(r.seconds/r.total)} с.</p><div class="result-actions">${wrong?action('errors','Повторить ошибки →'):action('exam','Новый пробный квиз →')}<a class="button secondary" href="#home">К моей подготовке</a></div></section><div class="section-top"><h2>Разбор ответов</h2><p>Открой вопрос для пояснения</p></div>${r.answers.map((a,i)=>{const q=byId(a.id);return `<details class="review-item ${a.correct?'':'failed'}" ${!a.correct?'open':''}><summary><span class="verdict">${a.correct?'✓':'✕'}</span> ${i+1}. ${esc(q.prompt)}</summary><p>Твой ответ: <strong>${esc(a.answer??'Время вышло')}</strong></p><p>${esc(q.explanation)}</p>${source(q)}<p><a href="#topic/${q.topic}">Перечитать тему ${q.topic} ↗</a></p></details>`;}).join('')}</div>`;
}
function startCards(value) {
  const scope=scopeFor(value);flash={ids:shuffle(data.questions.filter(q=>scope.includes(q.topic))).map(q=>q.id),index:0,revealed:false,known:0,again:[],scope};navigate('#cards');
}
function cardsPage() {
  if(!flash)return `<div class="empty"><h2>Повторим ключевые факты</h2><p>Прочитай вопрос и вспомни ответ до переворота карточки.</p>${action('cards','Карточки по темам 4–6','focus')}</div>`;
  if(flash.index>=flash.ids.length)return `<div class="empty"><div class="empty-mark">✓</div><h2>Карточки пройдены</h2><p>Вспомнил: ${flash.known} из ${flash.ids.length}. Ещё повторить: ${flash.again.length}.<br>Самооценка карточек не меняет результаты тестов.</p>${flash.again.length?action('cards-again','Повторить трудные →'):action('practice','Проверить себя в тесте','focus')} <a class="button secondary" href="#home">К подготовке</a></div>`;
  const q=byId(flash.ids[flash.index]);
  return `<div class="quiz-shell"><div class="quiz-head"><a href="#home" class="back" style="margin:0">← К подготовке</a><p>Карточка ${flash.index+1} из ${flash.ids.length}</p></div><section class="quiz-card flash"><p class="eyebrow">ТЕМА ${q.topic} · ${esc(topicById(q.topic).short)}</p><h1>${esc(q.prompt)}</h1>${flash.revealed?`<div role="status"><p class="flash-answer">${esc(q.answer)}</p><p class="flash-source">${esc(q.explanation)}</p></div>`:'<p class="flash-source">Попробуй ответить вслух. Потом проверь себя.</p>'}</section><div class="flash-controls">${flash.revealed?action('card-next','Ещё повторить','again','button secondary')+action('card-next','Я вспомнил ✓','known'):action('flip','Показать ответ ↻')}</div><p class="note" style="text-align:center;margin-top:20px">${flash.revealed?'Оцени, вспомнил ли ты ответ до переворота.':'Пробел тоже переворачивает карточку.'}</p></div>`;
}
function printPage(id) {
  const ids=id&&topicById(id)?[Number(id)]:FOCUS;
  return `<div class="print-sheet"><div class="print-top"><div><p class="eyebrow">МОЙ ГЕРОИЧЕСКИЙ РАЙОН</p><h1 class="page-title">Памятка к квизу</h1></div>${action('print','Распечатать','','button no-print')}</div><p class="note no-print">На печать пойдут только ключевые факты. Можно сохранить памятку в PDF через диалог печати.</p>${ids.map(id=>{const t=topicById(id);return `<section class="print-topic"><p class="eyebrow">ТЕМА ${id}</p><h2>${esc(t.short)}</h2><p class="note">${esc(t.title)}</p>${questionsFor(id).map(q=>`<div class="print-fact"><span>${esc(q.prompt)}</span><strong>${esc(q.answer)}</strong></div>`).join('')}<p class="note" style="margin-top:15px">Источник: ${t.url}</p></section>`;}).join('')}</div>`;
}
function render(scroll=true) {
  clearInterval(timer);
  if(!data)return;
  const [page,id]=(location.hash.slice(1)||'home').split('/');
  const pages={home,topics:topicsPage,topic:()=>topicPage(id),errors:errorPage,quiz:quizPage,result:resultPage,cards:cardsPage,print:()=>printPage(id)};
  main.innerHTML=(saveFailed?'<div class="storage-warning" role="status">Браузер не разрешает сохранять прогресс. Пока вкладка открыта, тренироваться можно.</div>':'')+(pages[page]||home)();
  document.querySelector('#error-count').textContent=errors().length;
  document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(page==='topic'?'topics':page);a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.title=`${page==='topic'&&topicById(id)?topicById(id).short:'Мой героический район'} · Тренажёр Максима`;
  if(scroll){window.scrollTo(0,0);main.focus({preventScroll:true});}
  if(page==='quiz'&&state.session?.mode==='exam'&&!state.session.answers[state.session.index]){timer=setInterval(tick,200);tick();}
}
main.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
  const value=button.dataset.value;
  switch(button.dataset.action){
    case 'practice':start('practice',value);break;
    case 'exam':start('exam','all');break;
    case 'errors':start('errors','all');break;
    case 'resume':navigate('#quiz');break;
    case 'answer':answer(Number(value));break;
    case 'next':next();break;
    case 'read':state.read=state.read.includes(Number(value))?state.read.filter(n=>n!==Number(value)):[...state.read,Number(value)];save();button.textContent=state.read.includes(Number(value))?'✓ Прочитано · снять отметку':'Отметить как прочитанное';break;
    case 'cards':startCards(value);break;
    case 'flip':flash.revealed=true;render(false);document.querySelector('[data-action="card-next"]')?.focus({preventScroll:true});break;
    case 'card-next':if(!flash?.revealed)break;if(value==='known')flash.known++;else flash.again.push(flash.ids[flash.index]);flash.index++;flash.revealed=false;render();break;
    case 'cards-again':flash={...flash,ids:shuffle(flash.again),index:0,known:0,again:[],revealed:false};render();break;
    case 'print':window.print();break;
  }
});
main.addEventListener('input',event=>{if(event.target.id==='topic-search'){searchText=event.target.value;document.querySelector('#topic-grid').innerHTML=filteredTopics();}});
main.addEventListener('change',event=>{if(event.target.id==='topic-filter'){topicFilter=event.target.value;document.querySelector('#topic-grid').innerHTML=filteredTopics();}});
document.addEventListener('keydown',event=>{
  if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||document.querySelector('dialog[open]')||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if(location.hash==='#quiz'&&/^[1-4]$/.test(event.key)){event.preventDefault();answer(Number(event.key)-1);}
  if(location.hash==='#cards'&&event.code==='Space'&&flash&&!flash.revealed&&flash.index<flash.ids.length&&event.target.tagName!=='BUTTON'){event.preventDefault();flash.revealed=true;render(false);}
});
document.querySelector('#settings').addEventListener('click',()=>document.querySelector('#info').showModal());
document.querySelector('#new-round-yes').addEventListener('click',()=>{document.querySelector('#new-round').close();if(pendingStart)start(pendingStart.mode,pendingStart.value,true);pendingStart=null;});
document.querySelector('#new-round-no').addEventListener('click',()=>{document.querySelector('#new-round').close();pendingStart=null;navigate('#quiz');});
document.querySelector('.skip').addEventListener('click',event=>{event.preventDefault();main.focus();});
document.querySelector('#close-info').addEventListener('click',()=>document.querySelector('#info').close());
document.querySelector('#reset').addEventListener('click',()=>document.querySelector('#reset-confirm').hidden=false);
document.querySelector('#reset-no').addEventListener('click',()=>document.querySelector('#reset-confirm').hidden=true);
document.querySelector('#reset-yes').addEventListener('click',()=>{state=freshState();lastResult=null;flash=null;save();document.querySelector('#reset-confirm').hidden=true;document.querySelector('#info').close();navigate('#home');});
window.addEventListener('hashchange',()=>render());
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&location.hash==='#quiz')tick();});
try {
  const response=await fetch(new URL('./data.json',import.meta.url));
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  data=await response.json();
  if(!Array.isArray(data.topics)||!Array.isArray(data.questions))throw new Error('Invalid data');
  render(false);
}catch(error){main.innerHTML='<div class="empty"><h1 class="page-title">Не удалось загрузить материалы</h1><p>Проверь соединение и обнови страницу.</p><button class="button" id="reload">Попробовать ещё раз</button></div>';document.querySelector('#reload').addEventListener('click',()=>location.reload());console.error(error);}
