// PostCSS pipeline. Used when running PostCSS directly (e.g. an editor
// integration). The npm build invokes the Tailwind CLI via scripts/build-css.mjs,
// which carries its own autoprefixer chain; this config keeps standalone PostCSS
// runs consistent. autoprefixer adds vendor prefixes (e.g. -webkit-backdrop-filter).
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
