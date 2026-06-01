# Alfa — Salla Twilight Theme

A premium, **RTL-first** storefront theme for Salla, built on the Twilight
framework (Twig + Stencil web components) and Tailwind CSS. Glassmorphism,
gradient accents, dark-mode ready, mobile-first (designed from 360px up), and
performance-budgeted (LCP < 2.5s, CLS < 0.05).

---

## ✨ What's inside

| Area | Highlights |
|------|-----------|
| **Header** | Sticky glass nav that intensifies on scroll, expand-on-click search with debounced autocomplete, mini-cart drawer trigger, theme toggle. |
| **Announcement bar** | Fixed overlay (zero CLS), dismissable, optional countdown. |
| **Hero** | Full-bleed parallax, word-reveal headline, dual CTAs, eager LCP image. |
| **Featured** | Asymmetric bento grid, hover overlay + image zoom. |
| **Product card** | Image zoom, slide-up quick-add, wishlist heart, sale ribbon, swatches, low-stock counter, quick-view. |
| **PDP** | Sticky gallery + thumbnail rail, in-place hover zoom, variant chips, accordion, reviews with summary bars + photo grid, mobile sticky add-to-cart, trust strip. |
| **Cart drawer** | Slides from the correct side (RTL/LTR), free-ship progress bar, animated steppers, gift-wrap upsell. |
| **CRO** | Free-shipping bar, stock urgency, social proof, recently-viewed, exit-intent coupon, quick-view, wishlist, skeleton loaders. |
| **A11y** | WCAG AA contrast, focus-visible rings, keyboard menus, aria-labels, `prefers-reduced-motion`. |

---

## 🚀 Install & run

> Requires Node 18+, the [Salla CLI](https://docs.salla.dev/), and a Salla
> Partners account. The theme uses **only** Tailwind + Sass/PostCSS beyond what
> Twilight ships.

```bash
# 1. Install the Salla CLI (once)
npm i -g @salla.sa/cli
salla login

# 2. Install build tooling
cd twilight
npm install

# 3. Build the stylesheet (Sass → Tailwind → app.css)
npm run build          # or `npm run css:watch` while developing

# 4. Preview locally against your store
salla theme preview    # (alias: npm run preview)

# 5. Ship it
salla theme push       # (alias: npm run push — builds CSS first)
```

The CSS pipeline compiles `src/assets/styles/app.scss` → an intermediate file →
Tailwind (which scans `.twig`/`.js` for classes) → minified
`src/assets/styles/app.css`, the file `master.twig` links.

---

## 🎛️ Merchant-configurable settings

All editable from **Salla Dashboard → Theme → Customize** (defined in
`twilight.json`). No code edits needed.

### Brand & colors
- [ ] **Primary / Secondary / Accent** colors — drive all gradients & accents.
- [ ] **Gradient angle** (default 135°).
- [ ] **Display font** — Tajawal or IBM Plex Sans Arabic.
- [ ] **Dark-mode toggle** — show/hide the header switch.

### Announcement bar
- [ ] **Enabled** on/off.
- [ ] **Text** copy.
- [ ] **Countdown to** — ISO date (e.g. `2026-07-01T00:00:00`); leave blank to disable.
- [ ] **Dismissable** on/off (dismissal remembered per browser).

### CRO
- [ ] **Free-shipping threshold** (SAR) — powers the cart + PDP progress bars.
- [ ] **Low-stock threshold** — "Only X left" badge appears below this.
- [ ] **Social proof** on/off — "X people viewed this…".
- [ ] **Exit-intent modal** on/off + **coupon code**.
- [ ] **Recently-viewed** strip on/off.
- [ ] **Gift-wrap price** (SAR) — shown in the cart upsell.

---

## 🔌 Wiring stubs to real data

A few features ship as merchant-wireable stubs (clearly commented):

- **Social proof** — `initSocialProof()` in `app.js` returns a deterministic
  number. Replace `getViewers()` with a real source (analytics, a Salla
  metafield, or a small endpoint).
- **Gift-wrap upsell** — set `config.giftWrapProductId` (add it to the
  `#theme-config` blob in `master.twig`) to a real "gift wrap" product so
  `salla.cart.addItem` succeeds.
- **Search autocomplete** — uses `salla.product.quickSearch`; the form still
  submits to the native search page if the API is unavailable.

---

## 🏗️ Architecture notes

- **Tokens, not hex.** Every color/shadow/radius lives in `tokens.scss` as a CSS
  custom property. Tailwind maps to those vars, so merchant colors and dark mode
  apply at runtime with **no rebuild**.
- **RTL by default.** Layouts use logical properties (`inline-start/end`,
  `ms-*/me-*`). The cart drawer and shimmer flip automatically; shadows use a
  zero x-offset so they never imply a broken light direction.
- **Zero-CLS images.** Every `<img>` carries `width`/`height` (or an
  `aspect-ratio` box). The announcement bar is `position:fixed` and its height
  feeds `--announcement-h`, so it never pushes content.
- **Salla owns the flows.** Cart, wishlist, variants, reviews, and checkout use
  Salla web components + SDK events (`salla.cart.event.onUpdated`,
  `page::changed`, etc.). The theme only renders chrome and CRO features.
- **Reduced motion respected.** A blanket `prefers-reduced-motion` rule plus
  per-feature guards disable parallax, reveals, confetti, and zoom.

---

## 📁 Structure

```
twilight/
├── twilight.json            # manifest: sections + dashboard settings
├── tailwind.config.js       # utilities mapped to CSS tokens
├── package.json / postcss.config.js
└── src/
    ├── layouts/master.twig
    ├── pages/               # index, product/single, product/index, cart, order
    ├── partials/            # header, footer, product-card, cart-drawer, modals…
    └── assets/{styles,js,images}
```

See the inline comments at the top of each file for its specific role.
