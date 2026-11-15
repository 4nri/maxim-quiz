export const FOCUS = [4, 5, 6];
export const STORAGE_KEY = 'maxim-quiz-v1';
export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function selectQuestions(questions, mode, scope = FOCUS, progress = {}, random = Math.random) {
  const pool = questions.filter(q => scope.includes(q.topic));
  if (mode === 'exam') {
    // Every topic appears once; the two extra questions come from the focus topics.
    const first = [...new Set(pool.map(q => q.topic))].map(t => shuffle(pool.filter(q => q.topic === t), random)[0]);
    const remaining = shuffle(pool.filter(q => !first.includes(q)), random);
    remaining.sort((a,b) => Number(FOCUS.includes(b.topic)) - Number(FOCUS.includes(a.topic)));
    return shuffle([...first, ...remaining.slice(0, Math.max(0, 20-first.length))], random).slice(0,20);
  }
  if (mode === 'errors') return shuffle(pool.filter(q => progress[q.id]?.wrong), random);
  return shuffle(pool, random).sort((a,b) => priority(b,progress)-priority(a,progress)).slice(0,20);
}
function priority(q,p) { return p[q.id]?.wrong ? 2 : !p[q.id] ? 1 : 0; }
export function recordAnswer(progress, question, answer) {
  const previous = progress[question.id] || { attempts: 0, correct: 0 };
  const correct = answer === question.answer;
  return { ...progress, [question.id]: { attempts: previous.attempts+1, correct: previous.correct+Number(correct), wrong: !correct } };
}
export function summarize(answers) {
  return { correct: answers.filter(a => a.correct).length, total: answers.length,
    seconds: answers.reduce((n,a) => n + a.seconds, 0) };
}
export function freshState() { return { progress: {}, read: [], history: [], session: null }; }
export function readState(storage) {
  try {
    const raw = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!raw || typeof raw.progress !== 'object' || !raw.progress || Array.isArray(raw.progress)) return freshState();
    return { ...freshState(), progress: Object.fromEntries(Object.entries(raw.progress).filter(([,v]) => v && Number.isInteger(v.attempts) && v.attempts>0 && Number.isInteger(v.correct) && v.correct>=0 && v.correct<=v.attempts && typeof v.wrong==='boolean')),
      read: Array.isArray(raw.read) ? raw.read.filter(n => Number.isInteger(n) && n>=1 && n<=18) : [],
      history: Array.isArray(raw.history) ? raw.history.filter(h=>h && Number.isFinite(h.correct) && Number.isFinite(h.total) && Number.isFinite(h.seconds)).slice(-30) : [],
      session: raw.session || null };
  } catch { return freshState(); }
}
