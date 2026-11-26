# tinkrum-site

The Tinkrum portal: static pages (`index.html`, `make.html` + `styles.css`), no build step, no third-party requests. `index.html` has no JavaScript; `make.html` runs the app-file checker locally in the browser, and `preview.js` draws a clickable sketch of a file that passes (one phone frame, the app's own colours, its pages and bar).

- Preview: `python3 -m http.server 8830` in this folder, then open http://127.0.0.1:8830/
- Fonts (Sora, Karla) are the app's own, subset and self-hosted in `assets/fonts/`.
- Screens in `assets/img/` are simulator screenshots of the app (sample data), resized to WebP.
- `/privacy` and `/support` are the addresses the app stores ask for. The privacy policy states what the app does with data: change it when that changes.
- `assets/apps/` holds the downloadable app files (copies of `packages/core/src/fixtures/portal-apps/` in the app repo).
  The Museum has no file: it is built around pictures the user picks, and app files carry no images.
- `assets/agent/` holds what other AIs need to write an app file (guide, JSON Schema, example), `checker.js`
  for the checker page and `tinkrum-check.js` for an AI to run itself (`node tinkrum-check.js app.json`): both are
  the same checks Tinkrum runs on import. Do not edit them here: in the app repo run
  `node scripts/build-agent-kit.mjs ../tinkrum-site` (from the repo root) after the guide changes.

- `/open` (`open.html` + `open.js`, routed by `_redirects`) reads a compressed app or setup from `#a=`, checks it with the same `checker.js`, and reuses `preview.js` before offering the native import link. The fragment never enters an HTTP request. English, Chinese and French follow the browser language and can be selected on the page. There is no network API or analytics. The iPhone store entry awaits a published App Store URL.
