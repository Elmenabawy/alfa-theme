/* ============================================================================
 *  free-shipping-bar.js — computes progress toward the merchant's free-shipping
 *  threshold and updates every [data-ship-bar] on the page (cart drawer, cart
 *  page) plus the PDP sticky bar. Reacts to salla.cart.event.onUpdated.
 * ========================================================================== */
import { qa, q, money, config } from '../app.js';

export default function initFreeShipping() {
  const threshold = Number(config.freeShippingThreshold) || 0;
  if (!threshold) return;

  function paint(subtotal) {
    const remaining = Math.max(threshold - subtotal, 0);
    const pct = Math.min((subtotal / threshold) * 100, 100);
    const complete = remaining === 0;

    qa('[data-ship-bar]').forEach((bar) => {
      bar.classList.toggle('is-complete', complete);
      const fill = q('[data-ship-fill]', bar);
      const msg = q('[data-ship-msg]', bar);
      if (fill) fill.style.width = `${pct}%`;
      if (msg) msg.innerHTML = complete
        ? '🎉 رائع! حصلت على <strong>شحن مجاني</strong>.'
        : `أضف <strong>${money(remaining)}</strong> للحصول على شحن مجاني.`;
    });

    // PDP sticky free-ship bar (only shows while under threshold)
    const pdpBar = q('[data-pdp-ship-bar]');
    if (pdpBar) {
      pdpBar.hidden = complete || subtotal === 0;
      const t = q('[data-pdp-ship-text]', pdpBar);
      if (t && !pdpBar.hidden) t.innerHTML = `🚚 أضف <strong>${money(remaining)}</strong> فقط لتحصل على شحن مجاني!`;
    }
  }

  if (typeof salla !== 'undefined') {
    salla.cart.event.onUpdated?.((s) => paint(s?.subtotal ?? s?.total ?? 0));
    salla.cart.api?.details?.().then((r) => paint((r?.data || r)?.subtotal ?? 0)).catch(() => paint(0));
  } else {
    paint(0);
  }
}
