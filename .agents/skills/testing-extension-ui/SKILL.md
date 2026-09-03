---
name: testing-extension-ui
description: How to load and end-to-end test the Acronym Decoder Chrome extension (popup, options page, content-script lookup) in the sandbox Chrome.
---

# Testing the Acronym Decoder extension UI

## Build & load
1. `source ~/.nvm/nvm.sh && nvm use 22 && npm run build` (Angular CLI 22 needs Node 22).
2. `cp dist/background.js dist/content-script.js dist/browser/` (webpack emits the MV3 scripts one level above the Angular output).
3. In the already-running Chrome: `chrome://extensions` -> Developer mode -> Load unpacked. In the GTK file dialog, click a sidebar entry (e.g. Home) first, then `ctrl+L`, type the absolute path to `dist/browser` and click **Open**. Beware: the path field autocompletes `assets/` — remove it before clicking Open. If Open is disabled, click the sidebar entry again and retype.
4. After rebuilding, click the Reload icon on the extension card instead of loading again.

## Pages (replace EXT_ID with the ID shown on the card)
- Popup: `chrome-extension://EXT_ID/index.html#/popup` (must include `index.html`; F5 on the rewritten `#/popup` URL gives ERR_FILE_NOT_FOUND).
- Options: `chrome-extension://EXT_ID/index.html#/homepage` (also reachable via the gear icon in the popup).
- Config values come from `dist/browser/config.json` (logo paths, contactEmail, extensionInfoPageLink=https://google.com).
- Glossary terms for local lookup: `dist/browser/glossary.json` (`TERM`, `ACRONYM`).

## Content-script lookup
- Default modifier is Command+Double Click; set "Mouse click modifier" to "Only Double Click" in the options page and Save, then double-click a word on any http(s) page (serve a local page: `python3 -m http.server 8765` in a dir with an index.html; file:// pages are not matched).
- The first double-click right after an extension reload may show nothing (MV3 service worker cold start); retry once before concluding failure.

## Change-detection gotcha (Angular 22)
- In Angular 22 `ChangeDetectionStrategy.Eager` is a real member and OnPush is the default. Components must keep `changeDetection: ChangeDetectionStrategy.Eager` (or Default), otherwise async HttpClient results (config/version/lookup results) render only after an unrelated click. Symptom: empty logo `src=""`, version `v`, spinner stuck on "Looking up definitions...".

## Devin Secrets Needed
None.
