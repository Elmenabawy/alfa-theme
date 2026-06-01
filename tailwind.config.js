/**
 * tailwind.config.js
 * Tailwind maps onto the CSS custom properties defined in tokens.scss, so a
 * single source of truth drives both utility classes and runtime theming
 * (merchant colors + dark mode). We do NOT hard-code hex here — every color
 * resolves a `var(--token)` so dark mode / brand overrides work with no rebuild.
 *
 * RTL: we rely on CSS logical properties (ms, me, ps, pe, start, end) which
 * Tailwind 3.3+ ships, so utilities mirror automatically under dir="rtl".
 * Avoid the physical ml / mr / left / right utilities in templates.
 */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.twig',
    './src/**/*.js',
    './twilight.json',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand-primary)',
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
        },
        bg: {
          DEFAULT: 'var(--color-bg)',
          subtle: 'var(--color-bg-subtle)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
        },
        ink: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
        },
        line: 'var(--color-border)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        sale: 'var(--color-sale)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-accent': 'var(--gradient-accent)',
      },
      backdropBlur: {
        glass: 'var(--glass-blur)',
      },
      transitionTimingFunction: {
        friendly: 'var(--ease-friendly)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
      },
      maxWidth: {
        container: 'var(--container-max)',
      },
      zIndex: {
        header: 'var(--z-header)',
        drawer: 'var(--z-drawer)',
        modal: 'var(--z-modal)',
        announcement: 'var(--z-announcement)',
      },
      keyframes: {
        'pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.28)' },
          '100%': { transform: 'scale(1)' },
        },
        'bounce-badge': {
          '0%,100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-4px)' },
        },
        'word-reveal': {
          from: { opacity: '0', transform: 'translateY(0.5em)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(-100%)' }, // RTL-correct: travels start->end
        },
      },
      animation: {
        pop: 'pop var(--dur-fast) var(--ease-friendly)',
        'bounce-badge': 'bounce-badge var(--dur-base) var(--ease-friendly)',
        'word-reveal': 'word-reveal var(--dur-slow) var(--ease-friendly) both',
        'reveal-up': 'reveal-up var(--dur-slow) var(--ease-friendly) both',
      },
    },
  },
  plugins: [],
};
