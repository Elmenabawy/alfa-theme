/**
 * build-css.mjs — cross-platform CSS build.
 * Sets BROWSERSLIST_IGNORE_OLD_DATA before spawning the toolchain so child
 * processes (Tailwind → autoprefixer → browserslist) inherit it and skip the
 * spurious "caniuse-lite is outdated" notice (we already ship the newest data;
 * it only fires because the data's publish date trails the system clock).
 *
 * Pure Node built-ins — no extra dependency. `node scripts/build-css.mjs`
 * builds once; pass `--watch` to rebuild on change.
 */
import { spawnSync, spawn } from 'node:child_process';

process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';

const watch = process.argv.includes('--watch');
const SRC = 'src/assets/styles/app.scss';
const TMP = 'src/assets/styles/.app.compiled.css';
const OUT = 'src/assets/styles/app.css';

// shell:true lets the OS resolve the node_modules/.bin shims (.cmd on Windows,
// which Node refuses to spawn directly). Our paths contain no spaces, so the
// shell-joined command is safe.
const opts = { stdio: 'inherit', env: process.env, shell: true };
const sassArgs = [SRC, TMP, '--no-source-map', '--load-path=src/assets/styles'];
const twArgs = ['-i', TMP, '-o', OUT, '--minify'];

if (watch) {
  spawn('sass', ['--watch', ...sassArgs], opts);
  spawn('tailwindcss', [...twArgs, '--watch'], opts);
} else {
  const sass = spawnSync('sass', sassArgs, opts);
  if (sass.status !== 0) process.exit(sass.status ?? 1);
  const tw = spawnSync('tailwindcss', twArgs, opts);
  process.exit(tw.status ?? 0);
}
