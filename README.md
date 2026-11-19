# tinkrum-site

The Tinkrum portal: static pages (`index.html`, `make.html` + `styles.css`), no build step, no third-party requests. `index.html` has no JavaScript; `make.html` runs the app-file checker locally in the browser.

- Preview: `python3 -m http.server 8830` in this folder, then open http://127.0.0.1:8830/
- Fonts (Sora, Karla) are the app's own, subset and self-hosted in `assets/fonts/`.
- Screens in `assets/img/` are simulator screenshots of the app (sample data), resized to WebP.
- `assets/apps/` holds the downloadable app files (copies of `packages/core/src/fixtures/portal-apps/` in the app repo).
  The Museum has no file: it is built around pictures the user picks, and app files carry no images.
- `assets/agent/` holds what other AIs need to write an app file (guide, JSON Schema, example) and `checker.js`,
  the same checks Tinkrum runs on import. Do not edit them here: in the app repo run
  `node scripts/build-agent-kit.mjs ../tinkrum-site` (from the repo root) after the guide changes.
