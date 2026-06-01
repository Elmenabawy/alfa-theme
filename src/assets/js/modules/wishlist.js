/* ============================================================================
 *  wishlist.js — wishlist with localStorage fallback that syncs to
 *  salla.wishlist when the SDK is available. Toggles heart state (aria-pressed
 *  + pop animation) and keeps the header count badge accurate. Works for both
 *  card hearts and the PDP heart via the shared [data-wishlist-toggle] hook.
 * ========================================================================== */
import { qa, q } from '../app.js';

const KEY = 'alfa:wishlist';
const read  = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } };
const write = (set) => localStorage.setItem(KEY, JSON.stringify([...set]));

export default function initWishlist() {
  if (document.__wishlistBound) return;          // global, bind once
  document.__wishlistBound = true;

  let ids = read();

  const syncBadge = () => {
    qa('[data-wishlist-count]').forEach((b) => { b.textContent = ids.size; b.hidden = ids.size === 0; });
  };
  const reflect = (root = document) => {
    qa('[data-wishlist-toggle]', root).forEach((btn) => {
      const id = getId(btn);
      if (id != null) btn.setAttribute('aria-pressed', String(ids.has(String(id))));
    });
  };
  const getId = (btn) => {
    const card = btn.closest('[data-product-id]');
    if (card) return card.dataset.productId;
    try { return JSON.parse(btn.dataset.product || '{}').id; } catch { return null; }
  };

  // Event delegation so dynamically-added cards (quick-view, carousels) work too.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn) return;
    e.preventDefault();
    const id = String(getId(btn));
    if (id === 'null' || id === 'undefined') return;

    const active = ids.has(id);
    active ? ids.delete(id) : ids.add(id);
    write(ids);

    btn.setAttribute('aria-pressed', String(!active));
    btn.classList.remove('is-popping'); void btn.offsetWidth; btn.classList.add('is-popping');
    syncBadge();

    // Sync to Salla (best-effort; localStorage stays the source of truth offline).
    try { active ? salla.wishlist.remove(+id) : salla.wishlist.add(+id); } catch { /* offline / guest */ }
  });

  // If the SDK reports a server wishlist, merge it in.
  if (typeof salla !== 'undefined') {
    salla.wishlist?.event?.onFetched?.((items) => {
      (items || []).forEach((i) => ids.add(String(i.id ?? i)));
      write(ids); syncBadge(); reflect();
    });
  }

  reflect();
  syncBadge();
  // Re-reflect after SPA nav (new cards in DOM).
  if (typeof salla !== 'undefined') salla.event?.on?.('page::changed', () => { ids = read(); reflect(); syncBadge(); });
}
