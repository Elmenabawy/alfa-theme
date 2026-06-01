/* ============================================================================
 *  app.js — theme entry point.
 *  Imports feature modules and wires the small UI behaviors that don't deserve
 *  their own file (header scroll state, search expand, theme toggle, accordion,
 *  gallery, announcement bar, newsletter validation, carousel nav, social proof).
 *
 *  Salla integration: we re-run init on `salla.event.on('page::changed')` so
 *  behaviors rebind after SPA-style navigations, and we read merchant config
 *  from the #theme-config JSON blob. We never hand-roll cart/auth/wishlist
 *  network calls — Salla's SDK + web components own those flows.
 * ========================================================================== */

import initStickyCart from './modules/sticky-cart.js';
import initFreeShipping from './modules/free-shipping-bar.js';
import initWishlist from './modules/wishlist.js';
import initRecentlyViewed from './modules/recently-viewed.js';
import initQuickView from './modules/quick-view.js';
import initExitIntent from './modules/exit-intent.js';
import initScrollReveal from './modules/scroll-reveal.js';
import initMobileStickyCta from './modules/mobile-sticky-cta.js';

/* ---- Shared config + tiny helpers (exported for modules) ----------------- */
export const config = (() => {
  try { return JSON.parse(document.getElementById('theme-config')?.textContent || '{}'); }
  catch { return {}; }
})();

export const q  = (sel, root = document) => root.querySelector(sel);
export const qa = (sel, root = document) => [...root.querySelectorAll(sel)];
export const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Format an amount with the store currency (fallback when Salla money helper absent). */
export const money = (v) => {
  try { return salla.money(v); } catch { return `${Number(v).toFixed(2)} ${config.currency || 'SAR'}`; }
};

/* ========================================================================== */
/*  Lightweight inline behaviors                                              */
/* ========================================================================== */

function initHeaderScroll() {
  const header = q('[data-header]');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initAnnouncementBar() {
  const bar = q('#announcement-bar');
  if (!bar) return;
  const KEY = 'alfa:announcement-dismissed';
  if (bar.dataset.dismissable === 'true' && localStorage.getItem(KEY)) {
    bar.remove();
    document.documentElement.style.setProperty('--announcement-h', '0px');
    return;
  }
  bar.hidden = false;
  // Measure → offset body/header so the fixed bar causes zero CLS.
  const setH = () => document.documentElement.style.setProperty('--announcement-h', `${bar.offsetHeight}px`);
  setH();
  window.addEventListener('resize', setH, { passive: true });

  q('[data-announcement-close]', bar)?.addEventListener('click', () => {
    localStorage.setItem(KEY, '1');
    bar.style.transform = 'translateY(-100%)';
    bar.style.transition = 'transform var(--dur-base) var(--ease-friendly)';
    setTimeout(() => { bar.remove(); document.documentElement.style.setProperty('--announcement-h', '0px'); }, 260);
  });

  // Countdown
  const target = bar.dataset.countdown && new Date(bar.dataset.countdown).getTime();
  const out = q('[data-countdown-display]', bar);
  if (target && out && !Number.isNaN(target)) {
    out.hidden = false;
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { out.textContent = '⏰ انتهى العرض'; return; }
      const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24,
            m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      out.textContent = `${d > 0 ? d + 'ي ' : ''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      requestAnimationFrame(() => setTimeout(tick, 1000));
    };
    tick();
  }
}

function initThemeToggle() {
  const KEY = 'alfa:theme';
  const saved = localStorage.getItem(KEY);
  const root = document.documentElement;
  if (saved) root.dataset.theme = saved;
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.dataset.theme = 'dark';

  qa('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem(KEY, next);
  }));
}

function initMobileMenu() {
  const menu = q('[data-mobile-menu]');
  const overlay = q('[data-mobile-menu-overlay]');
  if (!menu || menu.__bound) return;
  menu.__bound = true;
  let lastFocused = null;

  const open = () => {
    menu.hidden = false;
    requestAnimationFrame(() => { menu.dataset.open = 'true'; overlay.dataset.open = 'true'; document.body.classList.add('is-locked'); });
    qa('[data-mobile-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    lastFocused = document.activeElement;
    q('[data-mobile-menu-close]', menu)?.focus();
  };
  const close = () => {
    menu.dataset.open = 'false'; overlay.dataset.open = 'false';
    document.body.classList.remove('is-locked');
    qa('[data-mobile-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    setTimeout(() => { menu.hidden = true; }, 320);
    lastFocused?.focus?.();
  };

  qa('[data-mobile-menu-open]').forEach((b) => b.addEventListener('click', open));
  q('[data-mobile-menu-close]', menu)?.addEventListener('click', close);
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.dataset.open === 'true') close(); });
  // Close after navigating via a menu link.
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
}

function initSearch() {
  const wrap = q('[data-search]');
  if (!wrap) return;
  const toggle = q('[data-search-toggle]', wrap);
  const input = q('[data-search-input]', wrap);
  const results = q('[data-search-results]', wrap);

  const open = () => { wrap.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); input.focus(); };
  const close = () => { wrap.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); results.dataset.open = 'false'; };
  toggle.addEventListener('click', () => (wrap.classList.contains('is-open') ? close() : open()));
  document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Autocomplete via Salla search API (debounced). Falls back silently.
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    const term = input.value.trim();
    if (term.length < 2) { results.dataset.open = 'false'; return; }
    t = setTimeout(async () => {
      try {
        const res = await salla.product.quickSearch?.({ keyword: term })
                 ?? await salla.api.product.fetch?.({ keyword: term });
        const items = res?.data || [];
        results.innerHTML = items.slice(0, 6).map((p) => `
          <a class="search__result" href="${p.url}" role="option">
            <img src="${p.image?.url || p.thumbnail}" alt="" width="44" height="44" loading="lazy">
            <span><strong style="font-size:.9rem">${p.name}</strong><br><small>${money(p.price)}</small></span>
          </a>`).join('') || `<p style="padding:.75rem;color:var(--color-text-muted)">لا نتائج</p>`;
        results.dataset.open = 'true';
      } catch { /* fall back to full search page on submit */ }
    }, 250);
  });
}

function initAccordion(root = document) {
  qa('[data-accordion]', root).forEach((btn) => {
    const panel = btn.nextElementSibling;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.style.maxHeight = open ? '0px' : `${panel.scrollHeight}px`;
    });
    // First-open panels rendered with max-height:none → set a concrete value.
    if (btn.getAttribute('aria-expanded') === 'true') panel.style.maxHeight = `${panel.scrollHeight}px`;
  });
}

function initGallery(root = document) {
  const gallery = q('[data-gallery]', root);
  if (!gallery) return;
  const thumbs = qa('[data-thumb]', gallery);
  const stages = qa('[data-stage]', gallery);
  thumbs.forEach((thumb) => thumb.addEventListener('click', () => {
    const i = thumb.dataset.thumb;
    thumbs.forEach((t) => t.setAttribute('aria-current', String(t === thumb)));
    stages.forEach((s) => (s.hidden = s.dataset.stage !== i));
  }));

  // In-place hover zoom (no lightbox jump)
  const stageBox = q('[data-zoom]', gallery);
  if (stageBox && !reduceMotion() && window.matchMedia('(hover:hover)').matches) {
    stageBox.addEventListener('mousemove', (e) => {
      const r = stageBox.getBoundingClientRect();
      stageBox.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
      stageBox.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
    stageBox.addEventListener('mouseenter', () => stageBox.classList.add('is-zooming'));
    stageBox.addEventListener('mouseleave', () => stageBox.classList.remove('is-zooming'));
  }
}

function initHeroParallax(root = document) {
  const img = q('[data-parallax]', root);
  if (!img || reduceMotion()) return;
  const onScroll = () => {
    const y = Math.min(window.scrollY * 0.25, 120);
    img.style.setProperty('--parallax', `${y}px`);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initCarousels(root = document) {
  qa('[data-carousel]', root).forEach((track) => {
    const scope = track.closest('section') || document;
    const step = () => track.clientWidth * 0.8;
    // Logical direction: in RTL, "next" means scrolling toward negative scrollLeft.
    const dir = getComputedStyle(track).direction === 'rtl' ? -1 : 1;
    q('[data-carousel-next]', scope)?.addEventListener('click', () => track.scrollBy({ left: step() * dir, behavior: reduceMotion() ? 'auto' : 'smooth' }));
    q('[data-carousel-prev]', scope)?.addEventListener('click', () => track.scrollBy({ left: -step() * dir, behavior: reduceMotion() ? 'auto' : 'smooth' }));
  });
}

function initNewsletter(root = document) {
  const form = q('[data-newsletter]', root);
  if (!form) return;
  const input = q('input[type="email"]', form);
  const err = q('[data-newsletter-error]', form);
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valid(input.value.trim())) {
      input.setAttribute('aria-invalid', 'true');
      err.textContent = 'يرجى إدخال بريد إلكتروني صحيح.';
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');
    err.style.color = '#fff';
    try {
      await salla.newsletter?.subscribe?.({ email: input.value.trim() });
      err.textContent = 'تم الاشتراك بنجاح! ✅';
      form.reset();
    } catch { err.textContent = 'تعذّر الاشتراك الآن، حاول لاحقاً.'; }
  });
  input.addEventListener('input', () => { if (input.value && valid(input.value)) { input.removeAttribute('aria-invalid'); err.textContent = ''; } });
}

function initShare(root = document) {
  const box = q('[data-share]', root);
  if (!box) return;
  const url = box.dataset.shareUrl || location.href;
  const title = box.dataset.shareTitle || document.title;
  const enc = encodeURIComponent(url);

  q('[data-share-wa]', box)?.setAttribute('href', `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`);
  q('[data-share-x]', box)?.setAttribute('href', `https://twitter.com/intent/tweet?url=${enc}&text=${encodeURIComponent(title)}`);

  const native = q('[data-share-native]', box);
  if (navigator.share) {
    native?.addEventListener('click', () => navigator.share({ title, url }).catch(() => {}));
  } else { native?.setAttribute('hidden', ''); }   // hide if unsupported

  q('[data-share-copy]', box)?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(url); q('[data-share-copied]', box).textContent = 'تم النسخ ✓'; }
    catch { q('[data-share-copied]', box).textContent = url; }
    setTimeout(() => { const c = q('[data-share-copied]', box); if (c) c.textContent = ''; }, 2500);
  });
}

function initSocialProof(root = document) {
  if (!config.enableSocialProof) return;
  const el = q('[data-social-proof-text]', root);
  if (!el) return;
  // STUB: merchant replaces with real data (e.g. from analytics). Deterministic
  // per page-view so it doesn't flicker; swap getViewers() for a live source.
  const getViewers = () => 8 + (Date.now() % 30);
  el.textContent = `شاهد هذا المنتج ${getViewers()} شخصاً خلال الساعة الماضية`;
}

/* ========================================================================== */
/*  Boot                                                                      */
/* ========================================================================== */

// Behaviors that bind once to persistent (layout-level) elements.
function initGlobalOnce() {
  initHeaderScroll();
  initAnnouncementBar();
  initThemeToggle();
  initMobileMenu();
  initSearch();
  initStickyCart();
  initWishlist();
  initQuickView();
  initExitIntent();
  initMobileStickyCta();
}

// Behaviors that must re-bind on every page (content swapped by Salla SPA nav).
function initPerPage() {
  initAccordion();
  initGallery();
  initHeroParallax();
  initCarousels();
  initNewsletter();
  initShare();
  initSocialProof();
  initFreeShipping();
  initRecentlyViewed();
  initScrollReveal();
}

function boot() {
  initGlobalOnce();
  initPerPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Re-run per-page behaviors after Salla client-side navigation.
if (typeof salla !== 'undefined') {
  salla.event?.on?.('page::changed', () => initPerPage());
}
