/* ============================================================================
 *  exit-intent.js — shows the coupon modal once per session when the user
 *  signals leaving. Desktop: pointer exits the top of the viewport. Mobile:
 *  rapid scroll-up (back-to-top intent). Respects the merchant toggle and a
 *  session flag. Copy-to-clipboard on the coupon. No external deps.
 * ========================================================================== */
import { q, config } from '../app.js';

export default function initExitIntent() {
  if (!config.enableExitIntent) return;
  const modal = q('[data-exit-modal]');
  if (!modal || modal.__bound) return;
  modal.__bound = true;

  const SEEN = 'alfa:exit-intent-seen';
  if (sessionStorage.getItem(SEEN)) return;

  let lastFocused = null;
  const open = () => {
    if (sessionStorage.getItem(SEEN)) return;
    sessionStorage.setItem(SEEN, '1');
    modal.hidden = false;
    requestAnimationFrame(() => { modal.dataset.open = 'true'; document.body.classList.add('is-locked'); });
    lastFocused = document.activeElement;
    q('[data-exit-close]', modal)?.focus();
    teardown();
  };
  const close = () => {
    modal.dataset.open = 'false';
    document.body.classList.remove('is-locked');
    setTimeout(() => { modal.hidden = true; }, 320);
    lastFocused?.focus?.();
  };

  q('[data-exit-close]', modal)?.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.dataset.open === 'true') close(); });

  // Copy coupon
  q('[data-exit-coupon]', modal)?.addEventListener('click', async () => {
    const code = q('[data-exit-code]', modal)?.textContent?.trim() || '';
    try { await navigator.clipboard.writeText(code); q('[data-exit-copied]', modal).textContent = 'تم نسخ الكود ✅'; }
    catch { q('[data-exit-copied]', modal).textContent = `الكود: ${code}`; }
  });

  /* ---- Triggers ---- */
  const onMouseOut = (e) => { if (e.clientY <= 0 && !e.relatedTarget) open(); };
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (lastY - y > 60 && y < 200) open();      // fast upward swipe near top
    lastY = y;
  };
  function teardown() {
    document.removeEventListener('mouseout', onMouseOut);
    window.removeEventListener('scroll', onScroll);
  }

  // Arm after a short delay so it never fires on initial load.
  setTimeout(() => {
    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
  }, 4000);
}
