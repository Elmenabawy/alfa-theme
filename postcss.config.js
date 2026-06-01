// postcss.config.js — Salla Twilight pipeline (runs after sass-loader).
module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': 'postcss-nesting',
    tailwindcss: {},
    'postcss-preset-env': {
      features: { 'nesting-rules': true },
    },
  },
};
