# tinkrum-site

The Tinkrum portal: one static page (`index.html` + `styles.css`), no build step, no JavaScript, no third-party requests.

- Preview: `python3 -m http.server 8830` in this folder, then open http://127.0.0.1:8830/
- Fonts (Sora, Karla) are the app's own, subset and self-hosted in `assets/fonts/`.
- Screens in `assets/img/` are simulator screenshots of the app (sample data), resized to WebP.
- `assets/apps/` holds the downloadable app files (copies of `packages/core/src/fixtures/portal-apps/` in the app repo).
  The Museum has no file: it is built around pictures the user picks, and app files carry no images.
