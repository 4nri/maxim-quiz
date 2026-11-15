// Motion only confirms a state change. Questions and answer labels stay still.
const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const active = new Set();

function cancelMotion() {
  for (const animation of active) animation.cancel();
  active.clear();
}

document.addEventListener('keydown', () => {
  root.dataset.input = 'keyboard';
  cancelMotion();
}, { capture: true });
document.addEventListener('pointerdown', () => { root.dataset.input = 'pointer'; }, { capture: true });
reducedMotion.addEventListener('change', cancelMotion);

export function reveal(element, { emphasis = false } = {}) {
  if (!element?.animate || root.dataset.input === 'keyboard') return;
  const style = getComputedStyle(root);
  const duration = parseFloat(style.getPropertyValue(emphasis ? '--motion-enter' : '--motion-feedback'));
  const easing = style.getPropertyValue('--ease-out').trim();
  const frames = emphasis && !reducedMotion.matches
    ? [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }]
    : [{ opacity: .6 }, { opacity: 1 }];
  const animation = element.animate(frames, { duration, easing });
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => active.delete(animation));
}

export { cancelMotion };

export function animateMascot(element) {
  if (!element?.animate || reducedMotion.matches || document.hidden || root.dataset.input === 'keyboard') return;
  const style = getComputedStyle(root);
  const animation = element.animate([
    { transform: 'translateY(3px) rotate(-2deg)' },
    { transform: 'translateY(0) rotate(0)' },
  ], { duration: parseFloat(style.getPropertyValue('--motion-enter')), easing: style.getPropertyValue('--ease-out').trim() });
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => active.delete(animation));
}
document.addEventListener('visibilitychange', () => { if (document.hidden) cancelMotion(); });
