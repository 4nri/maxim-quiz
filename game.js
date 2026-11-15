import { FOCUS } from './engine.js';

// Awards are earned once, survive later mistakes, and use question IDs rather than clicks.
export function syncGame(state, questions) {
  const raw = state.game || {};
  const ids = new Set(questions.map(q => q.id));
  const topics = [...new Set(questions.map(q => q.topic))];
  const earned = new Set(Array.isArray(raw.earned) ? raw.earned.filter(id => ids.has(id)) : []);
  for (const q of questions) if (state.progress[q.id]?.correct > 0) earned.add(q.id);
  const recovered = new Set(Array.isArray(raw.recovered) ? raw.recovered.filter(id => earned.has(id)) : []);
  const mastered = new Set(Array.isArray(raw.mastered) ? raw.mastered.filter(id => topics.includes(id)) : []);
  for (const topic of topics) {
    const pool = questions.filter(q => q.topic === topic);
    if (pool.length && pool.every(q => state.progress[q.id] && !state.progress[q.id].wrong)) mastered.add(topic);
  }
  state.game = { earned: [...earned], recovered: [...recovered], mastered: [...mastered], equipped: raw.equipped ?? 'none' };
  if (!unlockedItems(state.game).includes(state.game.equipped)) state.game.equipped = 'none';
  return state.game;
}

export function totalXP(game) { return game.earned.length * 10 + game.recovered.length * 5 + game.mastered.length * 30; }
export function unlockedItems(game) {
  return ['none', ...(game.earned.length >= 5 ? ['star'] : []), ...(game.mastered.length ? ['medal'] : []), ...(FOCUS.every(id => game.mastered.includes(id)) ? ['shield'] : [])];
}
export function awardAnswer(state, questions, question, correct) {
  const game = syncGame(state, questions);
  const before = totalXP(game);
  const wasWrong = state.progress[question.id]?.wrong;
  if (correct && !game.earned.includes(question.id)) game.earned.push(question.id);
  if (correct && wasWrong && !game.recovered.includes(question.id)) game.recovered.push(question.id);
  return before;
}

export const ITEMS = [
  { id: 'none', name: 'Без значка', rule: 'Любимый фиолетовый свитер' },
  { id: 'star', name: 'Первая звезда', rule: 'Ответь верно на 5 разных вопросов' },
  { id: 'medal', name: 'Медаль знатока', rule: 'Освой одну тему целиком' },
  { id: 'shield', name: 'Герой трёх тем', rule: 'Освой темы 4, 5 и 6' },
];
export function pinMarkup(id) {
  const paths = {
    star: '<path fill="#ffd05b" stroke="#996019" stroke-width="2" d="m20 3 5 11 12 2-9 9 2 12-10-6-10 6 2-12-9-9 12-2z"/>',
    medal: '<path fill="#657ec1" d="M9 2h8l3 14 3-14h8l-6 22H15z"/><circle cx="20" cy="26" r="12" fill="#ffd05b" stroke="#996019" stroke-width="2"/><path fill="#996019" d="m20 18 2 5 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1z"/>',
    shield: '<path fill="#397a66" stroke="#f7d26c" stroke-width="3" d="M4 5h32v16c0 9-16 17-16 17S4 30 4 21z"/><path fill="#f7d26c" d="m20 10 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
  };
  return paths[id] ? `<svg viewBox="0 0 40 40" aria-hidden="true">${paths[id]}</svg>` : '<span aria-hidden="true">○</span>';
}
export function mascotMarkup(pose = 'ready', equipped = 'none', animate = false) {
  if (!['ready', 'think', 'happy'].includes(pose)) pose = 'ready';
  return `<span class="mascot mascot-${pose}" ${animate ? 'data-mascot-motion' : ''} aria-hidden="true"><img src="./assets/mascot/${pose}.png" width="160" height="180" alt="" decoding="async">${equipped !== 'none' && ITEMS.some(i => i.id === equipped) ? `<span class="mascot-pin">${pinMarkup(equipped)}</span>` : ''}</span>`;
}

export function companionPanel(state, questions) {
  const g = syncGame(state, questions), xp = totalXP(g), level = Math.floor(xp / 100) + 1;
  const unlocked = unlockedItems(g);
  return `<section class="companion" aria-labelledby="companion-title"><div class="companion-stage">${mascotMarkup('ready', g.equipped)}<span class="companion-name">МИНИ-МАКСИМ</span></div><div class="companion-content"><p class="eyebrow">ТВОЙ ИГРОВОЙ НАПАРНИК</p><h2 id="companion-title">Учимся и растём вместе</h2><p class="companion-line">${g.earned.length ? 'Каждый новый ответ делает нас опытнее.' : 'Начнём с пяти вопросов? Откроем первый значок!'}</p><div class="xp-label"><strong>Уровень ${level}</strong><span>${xp} опыта · до уровня ${level + 1}: ${100 - xp % 100}</span></div><div class="bar xp-bar" role="progressbar" aria-label="Опыт до следующего уровня" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${xp % 100}"><i style="transform:scaleX(${xp % 100 / 100})"></i></div><div class="wardrobe" aria-label="Значки для свитера">${ITEMS.map(item => `<button class="wardrobe-item ${g.equipped === item.id ? 'equipped' : ''}" data-action="equip" data-value="${item.id}" aria-pressed="${g.equipped === item.id}" ${unlocked.includes(item.id) ? '' : 'disabled'}>${pinMarkup(item.id)}<span><strong>${item.name}</strong><small>${unlocked.includes(item.id) ? (g.equipped === item.id ? 'Надето' : 'Надеть') : item.rule}</small></span></button>`).join('')}</div><details class="xp-rules"><summary>Как получать опыт и значки</summary><p>Первый верный ответ на каждый вопрос: +10 опыта. Первое исправление ошибки в каждом вопросе: ещё +5. Все последние ответы по теме верные: +30 за тему и новый значок. Каждая награда выдаётся один раз и остаётся у тебя. В пробном квизе опыт начисляется после завершения.</p><p>Уже сохранённые верные ответы тоже учтены. Прогресс хранится в этом браузере.</p></details></div></section>`;
}
