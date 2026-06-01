/* ============================================================================
 *  scroll-reveal.js — IntersectionObserver-driven reveals for [data-reveal].
 *  Adds .is-visible to fade+translate elements into view, staggering siblings
 *  by 60ms via the --reveal-i custom prop. Fully disabled under reduced motion
 *  (elements are shown immediately). Animates transform/opacity only.
 * ========================================================================== */
import { qa, reduceMotion } from '../app.js';

export default function initScrollReveal() {
  const els = qa('[data-reveal]:not(.is-visible)');
  if (!els.length) return;

  if (reduceMotion() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Stagger: assign an index among same-parent reveal siblings.
  const byParent = new Map();
  els.forEach((el) => {
    if (el.style.getPropertyValue('--reveal-i')) return;  // explicit index wins
    const p = el.parentElement;
    const i = byParent.get(p) || 0;
    el.style.setProperty('--reveal-i', i);
    byParent.set(p, i + 1);
  });

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  els.forEach((el) => io.observe(el));
}
