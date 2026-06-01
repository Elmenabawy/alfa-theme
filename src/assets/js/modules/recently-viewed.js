/* ============================================================================
 *  recently-viewed.js — records the current product (PDP) in localStorage and
 *  hydrates the [data-recently-viewed] strip on home/category/cart pages.
 *  Builds cards client-side to match product-card markup so styles/wishlist/
 *  quick-view all keep working. Removes the section if there's nothing to show.
 * ========================================================================== */
import { q, qa, money } from '../app.js';

const KEY = 'alfa:recently-viewed';
const MAX = 12;
const read  = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
const write = (arr) => localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX)));

function record(product) {
  if (!product?.id) return;
  const list = read().filter((p) => String(p.id) !== String(product.id));
  list.unshift(product);
  write(list);
}

function card(p) {
  return `
  <div role="listitem">
    <article class="product-card" data-product-id="${p.id}" data-product='${JSON.stringify(p).replace(/'/g, '&#39;')}'>
      <div class="product-card__media">
        <button type="button" class="product-card__wish" data-wishlist-toggle aria-pressed="false" aria-label="أضف للمفضلة">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-9.3-9C1 7.5 3 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.2.6-1 1.8-2.2 3.8-2.2 3.2 0 5.2 3 3.5 6.5C19 15.5 12 20 12 20z"/></svg>
        </button>
        <a href="${p.url}" class="product-card__link" aria-label="${p.name}">
          <img class="product-card__img" src="${p.image}" alt="${p.name}" width="400" height="400" loading="lazy" decoding="async">
        </a>
      </div>
      <div class="product-card__body">
        <h3 class="product-card__title"><a href="${p.url}">${p.name}</a></h3>
        <div class="product-card__price"><span class="product-card__price-now">${money(p.price)}</span></div>
      </div>
    </article>
  </div>`;
}

export default function initRecentlyViewed() {
  // 1) Record the product on a PDP (data injected by single.twig).
  const blob = q('#pdp-product');
  if (blob) { try { record(JSON.parse(blob.textContent)); } catch {} }

  // 2) Hydrate the strip if present on this page.
  const section = q('[data-recently-viewed]');
  if (!section) return;
  const track = q('[data-rv-track]', section);
  const currentId = blob ? (() => { try { return String(JSON.parse(blob.textContent).id); } catch { return null; } })() : null;

  const items = read().filter((p) => String(p.id) !== currentId);
  if (!items.length) { section.remove(); return; }

  track.innerHTML = items.map(card).join('');   // replaces skeletons → no shift (same box)
  section.hidden = false;
}
