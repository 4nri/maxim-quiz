// Short, local clips. Never reveal correctness while an exam is in progress.
export const REACTIONS = {
  celebrate: { id: 'celebrate', duration: 1380 },
  clap: { id: 'clap', duration: 1320 },
  think: { id: 'think', duration: 1800 },
  strong: { id: 'strong', duration: 1410 },
};

export function answerReaction(mode, answers, index) {
  if (mode === 'exam' || !answers[index]) return null;
  const answer = answers[index];
  if (!answer.correct) {
    return { ...REACTIONS[index % 2 ? 'strong' : 'think'], title: index % 2 ? 'Не сдаёмся. Запомним ответ!' : 'Разберёмся и запомним!' };
  }
  let streak = 0;
  for (let i = index; i >= 0 && answers[i]?.correct; i--) streak++;
  return {
    ...REACTIONS[streak >= 3 || index % 2 ? 'celebrate' : 'clap'],
    title: streak >= 3 ? `Верно! Уже ${streak} подряд!` : 'Верно! Так держать!',
  };
}

export function resultReaction(correct, total) {
  return REACTIONS[correct === total && total > 0 ? 'celebrate' : total > 0 && correct / total >= .7 ? 'clap' : 'strong'];
}

export function reactionMarkup(reaction) {
  if (!reaction || !REACTIONS[reaction.id]) return '';
  return `<span class="reaction" data-reaction="${reaction.id}" aria-hidden="true"><img src="./assets/reactions/${reaction.id}.svg" width="96" height="96" alt="" decoding="async"></span>`;
}

const cleanups = new Set();
export function stopReactions() {
  for (const cleanup of [...cleanups]) cleanup();
}

export function mountReactions(container) {
  stopReactions();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || document.hidden || document.documentElement.dataset.input === 'keyboard') return;

  for (const wrapper of container.querySelectorAll('[data-reaction]')) {
    const reaction = REACTIONS[wrapper.dataset.reaction];
    const poster = wrapper.querySelector('img');
    if (!reaction || !poster) continue;
    let observer, clip, timer, disposed = false;

    const cleanup = () => {
      disposed = true;
      clearTimeout(timer);
      observer?.disconnect();
      reduced.removeEventListener('change', cleanup);
      if (clip) {
        clip.onload = clip.onerror = null;
        if (clip.parentNode === wrapper) clip.replaceWith(poster);
        clip.removeAttribute('src');
      }
      cleanups.delete(cleanup);
    };
    cleanups.add(cleanup);
    reduced.addEventListener('change', cleanup);

    const play = () => {
      observer?.disconnect();
      if (disposed || reduced.matches || document.hidden || document.documentElement.dataset.input === 'keyboard') { cleanup(); return; }
      clip = new Image(96, 96);
      clip.alt = '';
      clip.decoding = 'async';
      clip.onerror = cleanup;
      clip.onload = () => {
        if (disposed || !wrapper.isConnected) { cleanup(); return; }
        poster.replaceWith(clip);
        // The explanation is interactive throughout; restore a still image afterward.
        timer = setTimeout(cleanup, reaction.duration);
      };
      clip.src = new URL(`./assets/reactions/${reaction.id}.webp`, import.meta.url).href;
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) play();
      }, { threshold: .5 });
      observer.observe(wrapper);
    } else play();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', stopReactions, { capture: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopReactions(); });
}
