/* ============================================================================
 *  mobile-sticky-cta.js — reveals the PDP mobile sticky add-to-cart bar once
 *  the primary add button scrolls out of view, and hides it again when the
 *  primary button returns. Uses IntersectionObserver (no scroll math), and is
 *  inert on desktop (the bar is display:none ≥1024px via CSS).
 * ========================================================================== */
import { q } from '../app.js';

export default function initMobileStickyCta() {
  const bar = q('[data-sticky-cta]');
  const primary = q('[data-primary-add]');
  if (!bar || !primary) return;
  if (bar.__bound) return; bar.__bound = true;

  if (!('IntersectionObserver' in window)) { return; }

  const io = new IntersectionObserver(([entry]) => {
    // Show the sticky bar only when the primary button is NOT visible.
    bar.dataset.visible = String(!entry.isIntersecting);
  }, { threshold: 0 });

  io.observe(primary);
}
