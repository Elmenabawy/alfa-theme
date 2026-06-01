/* ============================================================================
 *  sticky-cart.js — cart drawer controller.
 *  Opens/closes the global drawer, renders line items from Salla cart state,
 *  drives quantity steppers (animated count), keeps the header count badge in
 *  sync, and handles the gift-wrap upsell. All mutations go through the Salla
 *  SDK (salla.cart.*) — we only render and trap focus.
 * ========================================================================== */
import { q, qa, money, config } from '../app.js';

export default function initStickyCart() {
  const drawer  = q('[data-cart-drawer]');
  const overlay = q('[data-cart-overlay]');
  if (!drawer || drawer.__bound) return;        // bind once
  drawer.__bound = true;

  const body     = q('[data-cart-body]');
  const linesEl  = q('[data-cart-lines]', drawer);
  const emptyEl  = q('[data-cart-empty]', drawer);
  const footEl   = q('[data-cart-foot]', drawer);
  const upsellEl = q('[data-cart-upsells]', drawer);
  const subtotalEl = q('[data-cart-subtotal]', drawer);
  let lastFocused = null;

  /* ---- Open / close with focus trap ---- */
  const open = () => {
    drawer.hidden = false;
    requestAnimationFrame(() => {
      drawer.dataset.open = 'true';
      overlay.dataset.open = 'true';
      document.body.classList.add('is-locked');
    });
    lastFocused = document.activeElement;
    q('[data-cart-close]', drawer)?.focus();
  };
  const close = () => {
    drawer.dataset.open = 'false';
    overlay.dataset.open = 'false';
    document.body.classList.remove('is-locked');
    setTimeout(() => { drawer.hidden = true; }, 320);
    lastFocused?.focus?.();
  };

  qa('[data-cart-toggle]').forEach((b) => b.addEventListener('click', open));
  q('[data-cart-close]', drawer)?.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.dataset.open === 'true') close(); });

  // Focus trap
  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = qa('a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])', drawer).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---- Render from Salla cart state ---- */
  function render(cart) {
    const items = cart?.items || [];
    const count = items.reduce((n, i) => n + i.quantity, 0);

    // Header badges
    qa('[data-cart-count]').forEach((badge) => {
      const prev = +badge.textContent || 0;
      badge.textContent = count;
      badge.hidden = count === 0;
      if (count !== prev) { badge.classList.remove('is-bumping'); void badge.offsetWidth; badge.classList.add('is-bumping'); }
    });

    const isEmpty = items.length === 0;
    emptyEl.hidden = !isEmpty;
    linesEl.hidden = isEmpty;
    footEl.hidden = isEmpty;
    upsellEl.hidden = isEmpty;
    if (isEmpty) return;

    linesEl.innerHTML = items.map((i) => `
      <li class="cart-line" data-line="${i.id}">
        <img class="cart-line__img" src="${i.product?.image?.url || i.image || ''}" alt="" width="64" height="64" loading="lazy">
        <div>
          <div class="cart-line__name">${i.product?.name || i.name}</div>
          <div class="cart-line__price">${money(i.price)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:end;gap:.4rem">
          <div class="stepper">
            <button type="button" data-qty-dec aria-label="إنقاص الكمية">−</button>
            <span class="stepper__val" data-qty>${i.quantity}</span>
            <button type="button" data-qty-inc aria-label="زيادة الكمية">+</button>
          </div>
          <button type="button" data-remove aria-label="حذف المنتج" style="background:none;color:var(--color-text-muted);font-size:.78rem">حذف</button>
        </div>
      </li>`).join('');

    subtotalEl.textContent = money(cart.subtotal ?? cart.total ?? 0);
    if (config.giftWrapPrice) q('[data-giftwrap-price]', drawer).textContent = `+ ${money(config.giftWrapPrice)}`;

    // Wire steppers → Salla
    qa('[data-line]', linesEl).forEach((line) => {
      const id = +line.dataset.line;
      const val = q('[data-qty]', line);
      const bump = () => { val.classList.remove('is-bumping'); void val.offsetWidth; val.classList.add('is-bumping'); };
      q('[data-qty-inc]', line)?.addEventListener('click', () => { bump(); salla.cart.updateItem({ id, quantity: (+val.textContent) + 1 }); });
      q('[data-qty-dec]', line)?.addEventListener('click', () => { const n = (+val.textContent) - 1; bump(); n <= 0 ? salla.cart.deleteItem(id) : salla.cart.updateItem({ id, quantity: n }); });
      q('[data-remove]', line)?.addEventListener('click', () => salla.cart.deleteItem(id));
    });
  }

  /* ---- Gift-wrap upsell ---- */
  q('[data-add-giftwrap]', drawer)?.addEventListener('click', () => {
    // Merchant maps a real "gift wrap" product id; placeholder uses a custom note.
    salla.cart.addItem?.({ id: config.giftWrapProductId, quantity: 1 })
      ?.catch?.(() => salla.notify?.info?.('فعّل منتج تغليف الهدية من لوحة التحكم'));
  });

  /* ---- Salla events: open on add, re-render on update ---- */
  if (typeof salla !== 'undefined') {
    salla.cart.event.onUpdated?.((summary) => render(summary));
    salla.cart.event.onItemAdded?.(() => open());
    // Initial paint
    salla.cart.api?.details?.().then((r) => render(r?.data || r)).catch(() => {});
  }
}
