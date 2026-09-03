# Angular → React migration

Tracking document for the Angular 19 → React 19 migration of the Acronym Decoder Chrome extension.
Child sessions update their row in the status table and post a summary back to the managing session.

## Status

| Component | Owner | Branch | Status | Results |
|---|---|---|---|---|
| Foundation: Vite/Vitest toolchain, models, `ConfigurationService`, `DefinitionService`, `ServicesProvider` context, `App` hash router, placeholders, `MIGRATION.md` | Managing session | `devin/*-react-foundation` | done | 16 Vitest tests pass; `npm run build` produces loadable `dist/browser` |
| `LookupComponent` → `src/app/lookup/Lookup.tsx` (+ `background.ts` / `content-script` injection via React) | Child A | `devin/1788407595-react-lookup` | done | `Lookup.tsx` + `Lookup.test.tsx` (2 tests; 18 total pass); `background.ts` sends `{lookupWord, definitions, coord}`; `content-script/runtime-listener.tsx` mounts `<Lookup>` via `createRoot` in the closed shadow root and unmounts on removal; popup styles moved to `lookup-styles.ts` (string injected into shadow root; no `.css` import because webpack has no CSS loader and page CSS can't reach the shadow root). typecheck/test/build pass; React bundled in `dist/browser/content-script.js`. |
| `HomepageComponent` → `src/app/homepage/Homepage.tsx` (options page) | Child B | _pending_ | pending | |
| `PopupComponent` → `src/app/popup/Popup.tsx` (search popup) | Child C | _pending_ | pending | |
| Remove Angular artifacts (`*.module.ts`, `*.component.*`, `*.spec.ts`, `angular.json`, Karma, `@angular/*` deps) and verify extension loads | Managing session | | pending | |

Status values: `pending` / `in-progress` / `blocked` / `done`.

## Foundation (what child sessions build on)

### Toolchain
- UI (popup + options page): **Vite 6** + `@vitejs/plugin-react`, config in `vite.config.mts`, root `src/`, entry `src/index.html` → `src/main.tsx`. Output: `dist/browser/` (`index.html`, `bundle/*`, plus `manifest.json`, `config.json`, `glossary.json`, `assets/` copied by the `copy-extension-assets` plugin).
- Background service worker + content script: existing **webpack 5** + `ts-loader` (`webpack.config.js`, `tsconfig.webpack.json`), now also emitting into `dist/browser/` so the folder is directly loadable as an unpacked extension.
- Tests: **Vitest** + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event`, jsdom environment, globals enabled. Test files are `*.test.ts(x)` next to the component. Setup file `src/testing/setup-tests.ts` installs a `chrome.*` mock (`src/testing/chrome-mock.ts`).
- Scripts: `npm run build` (vite + webpack), `npm test` / `npm run test:ci`, `npm run typecheck` (strict TS; also aliased as `npm run lint`), `npm run test:karma` (legacy Angular specs, kept only until cleanup).
- TypeScript: root `tsconfig.json` is `strict` (`strictPropertyInitialization` off so the model classes stay as-is). Legacy Angular `*.component.ts` / `*.module.ts` / `*.spec.ts` files are excluded from typechecking.

### Shared code
- Models in `src/app/models/*` are unchanged and reused as-is.
- `src/app/core/configuration/configuration.service.ts` — `ConfigurationService`: plain class, Promise-based (`getJsonFileContent<T>(file)`, `getExtensionVersion()`, `getConfiguration()`), uses `fetch(chrome.runtime.getURL(file))`, caches manifest/config, keeps `static isBackendOnline`. Constructor accepts an optional `fetch` for tests.
- `src/app/core/definition/definition.service.ts` — `DefinitionService`: Promise-based `lookupTerm(term, LookupSource)`, `lookupTermLocally`, `lookupTermRemotely` (rejects on non-OK), `previousSearchTerm`, `gaLookupEvent` no-op.
- `src/app/core/services-context.tsx` — `ServicesProvider` (replaces Angular DI / `CoreModule`), hooks `useServices()`, `useConfigurationService()`, `useDefinitionService()`.
- `src/app/App.tsx` — `App` = `ServicesProvider` + `HashRouter`; `AppRoutes` has `/homepage`, `/popup`, `*` → redirect to `/homepage` (matches the old `useHash: true` routing; `manifest.json` still points at `index.html#/popup` and `index.html#/homepage`).
- Test helpers in `src/testing/render-with-services.tsx`: `testConfig`, `createTestServices({config, version, glossary})` (real services over a fetch stub), `renderWithServices(ui, services)`.

### UI library mapping (use consistently)
No Angular Material / ng-bootstrap / flex-layout equivalents are added; use **Bootstrap 5 CSS** (already a dependency, imported globally via `src/styles.scss`) plus the small theme in `src/decoder-theme.scss`.

| Angular | React replacement |
|---|---|
| `mat-button` / `mat-raised-button` | `<button className="btn ...">`; colors: `btn-ad-primary` (green, was `color="primary"`), `btn-ad-accent` (indigo, was `color="accent"`). Existing helper classes `button-border`, `input-suffix` still exist in `styles.scss`. |
| `<mat-icon>name</mat-icon>` | `<span className="material-icons">name</span>` (Material Icons font is linked in `index.html`) |
| `<mat-spinner [diameter]="n">` | `<div className="spinner-border text-ad-accent" role="status" style={{width: n, height: n}} />` |
| `<mat-form-field><mat-select [(value)]>` + `<mat-option>` | `<select className="form-select" value onChange>` + `<option>` (use `String()`/parse for boolean & enum values) |
| `fxLayout="row" fxLayoutAlign="space-evenly center"` | Bootstrap utilities: `d-flex flex-row justify-content-evenly align-items-center`; `fxFlex="50%"` → `w-50` |
| `[(ngModel)]` / `(ngSubmit)` | controlled `useState` + `<form onSubmit>` |
| `*ngIf` / `*ngFor` | `&&` / `.map()` |
| `DomSanitizer.bypassSecurityTrustUrl` | validate the URL scheme (allow-list `slack:`/`https:`) and pass the string to `href`; React escapes attribute values |
| `ViewEncapsulation.None` scss | import the component's `.scss` from the component file (Vite bundles it globally; no encapsulation, same as before) |
| Component `.css` (emulated encapsulation) | import the `.css` from the component file; keep selectors scoped under the component's root class/id |
| `ChangeDetectorRef` | not needed |

### Conventions for child sessions
- One component per branch; touch only your component's files, its `.test.tsx`, and (Child A only) `src/background.ts` / `content-script/*`.
- Replace the placeholder file at the fixed path (`Homepage.tsx`, `Popup.tsx`, `Lookup.tsx`) and keep the exported name — the router already imports it, so no routing edits are needed.
- Keep the legacy `.component.ts/.html/.css/.spec.ts` files in place; the managing session deletes them during cleanup.
- Preserve DOM ids/classes used by the old templates and styles (`#searchInput`, `#resultsBody`, `.decoder`, `#decoderOptions`, ...).
- Must pass: `npm run typecheck`, `npm run test:ci`, `npm run build`.
- Report: files created/modified/deleted, test results, and any behaviour that could not be preserved 1:1.
