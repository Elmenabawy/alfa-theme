/* ============================================================================
 *  quick-view.js — opens the global quick-view modal from any card's
 *  [data-quick-view] button, fetches product details via Salla, and fills the
 *  panel. Skeletons hold layout while loading. Add-to-cart uses the Salla web
 *  component so the real flow + cart drawer fire normally. Esc/overlay close +
 *  focus trap. Falls back to navigating to the PDP if the API is unavailable.
 * ========================================================================== */
import { q, qa, money } from '../app.js';

export default function initQuickView() {
  const modal = q('[data-quick-view-modal]');
  if (!modal || modal.__bound) return;
  modal.__bound = true;

  const content = q('[data-qv-content]', modal);
  const skeleton = content.innerHTML;        // keep skeleton to restore between opens
  let lastFocused = null;

  const open = () => {
    modal.hidden = false;
    requestAnimationFrame(() => { modal.dataset.open = 'true'; document.body.classList.add('is-locked'); });
    lastFocused = document.activeElement;
    q('[data-qv-close]', modal)?.focus();
  };
  const close = () => {
    modal.dataset.open = 'false';
    document.body.classList.remove('is-locked');
    setTimeout(() => { modal.hidden = true; content.innerHTML = skeleton; }, 320);
    lastFocused?.focus?.();
  };

  q('[data-qv-close]', modal)?.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.dataset.open === 'true') close(); });

  function fill(p) {
    content.innerHTML = `
      <div class="quick-view__media"><img src="${p.image?.url || p.image}" alt="${p.name}" width="500" height="500" decoding="async"></div>
      <div>
        <h2 id="qv-title" style="margin-block:.25rem 0">${p.name}</h2>
        <div class="product-card__price" style="margin-block:.5rem 1rem">
          <span class="product-card__price-now" style="font-size:1.3rem">${money(p.price)}</span>
          ${p.on_sale ? `<span class="product-card__price-was">${money(p.regular_price)}</span>` : ''}
        </div>
        <p style="color:var(--color-text-muted);font-size:.9rem">${(p.description || '').slice(0, 160)}…</p>
        <salla-add-product-button product-id="${p.id}" class="btn btn--primary btn--block btn--lg" style="margin-block-start:1rem">أضف إلى السلة</salla-add-product-button>
        <a href="${p.url}" class="btn btn--ghost btn--block" style="margin-block-start:.5rem">عرض كل التفاصيل</a>
      </div>`;
  }

  // Delegated trigger (works for dynamically-added cards too)
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-quick-view]');
    if (!btn) return;
    e.preventDefault();
    const card = btn.closest('[data-product-id]');
    const id = card?.dataset.productId;
    let local = {}; try { local = JSON.parse(card?.dataset.product || '{}'); } catch {}

    open();
    try {
      const res = await salla.product.getDetails?.(id) ?? await salla.api.product.details?.(id);
      fill(res?.data || res || local);
    } catch {
      if (local.url) { window.location.href = local.url; }   // graceful fallback to PDP
    }
  });
}
