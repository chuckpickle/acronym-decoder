---
name: testing-chrome-extension
description: Build Acronym-Decoder and load it in Chrome to verify the options page, popup, and content script behavior. Use for any UI-driven testing of this extension.
---

# Testing the Acronym-Decoder extension locally

## Build

Node 22 is required (Angular 22 CLI needs >= 22.22.3):

```bash
source ~/.nvm/nvm.sh && nvm use 22
npm install   # .npmrc already sets legacy-peer-deps=true
npm run build # ng build (-> dist/browser) + webpack (-> dist/background.js, dist/content-script.js)
```

## Load in Chrome

`manifest.json` expects the webpack bundles next to `index.html`, but they are emitted at the `dist/` root:

```bash
cp dist/background.js dist/content-script.js dist/browser/
```

Then `chrome://extensions` -> Developer mode -> "Load unpacked" -> select `dist/browser`.

Do NOT use `ng serve` for verification: the `chrome.*` APIs are unavailable outside an extension context, so the options page fails to read stored options and the popup can't call `chrome.runtime`.

## Navigating

Routes are hash-based. Use full URLs including `index.html`, e.g.
`chrome-extension://<id>/index.html#/homepage` (options page) and
`chrome-extension://<id>/index.html#/popup`. Reloading a hash URL without
`index.html` gives `ERR_FILE_NOT_FOUND`.

## Forcing the popup loading state

The local glossary lookup resolves in a few milliseconds and DevTools network
throttling does not apply to `chrome-extension://` requests. To see the spinner,
temporarily add `.pipe(delay(4000))` to the lookup observable in
`src/app/popup/popup.component.ts`, rebuild, then revert.

## Unit tests

```bash
npm run test:ci   # Karma + ChromeHeadlessNoSandbox
```
