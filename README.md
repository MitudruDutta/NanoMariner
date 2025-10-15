# NanoMariner

NanoMariner is a local-first Chrome extension (Manifest V3) that demonstrates browser automation and on-device AI features. It uses Vite + React + TypeScript + Tailwind for the popup UI and leverages Chrome extension APIs (background service worker, content scripts, sidePanel support). The project includes integrations for both on-device AI (Gemini Nano / Prompt API) and optional summarization flows.

Badges
------
[![version](https://img.shields.io/badge/version-0.1.0-lightgrey)](#) [![license](https://img.shields.io/badge/license-MIT-blue)](#)

Quick summary
-------------
- Frontend: React + Vite + TypeScript
- Styling: TailwindCSS
- Background: service worker (background.iife.js / background.js built by Vite)
- Content script: `contentScript` entry (runs on page frames, exposes a `get_page_text` message)
- Build: Vite multi-entry; outputs `dist/` with `manifest.json`, popup, background, content script and assets

Prerequisites
-------------
- Node.js (recommended v18+)
- npm
- Chrome 128+ or Chrome Canary (for on-device AI features and sidePanel support)

Install
-------
```bash
npm install
```

Development
-----------
Start the Vite dev server (serves popup UI during development):

```bash
npm run dev
```

To build the extension for testing in Chrome (produces `dist/`):

```bash
npm run build
```

Loading in Chrome (development / manual testing)
-----------------------------------------------
1. Run `npm run build` to generate `dist/`.
2. Open Chrome and go to chrome://extensions.
3. Enable *Developer mode*.
4. Click *Load unpacked* and select the repository's `dist/` folder.

Notes about the build and manifest
----------------------------------
- `vite.config.ts` contains a build plugin which generates a static `manifest.json` into `dist/` during the build step. The rollup inputs include:
  - popup (`index.html`)
  - background (`src/background-simple.ts`)
  - contentScript (`src/contentScript.ts`)
  - options (`options.html`)

- The project also contains a JavaScript manifest generator at the root (`manifest` code) which produces a manifest programmatically (side-panel and Opera sidebar helpers). The generated manifest used by Vite is simplified and written to `dist/`.

What the extension does
----------------------
- Popup UI: creates short Gemini text sessions using `ai.createTextSession()` (when on-device APIs are available) and displays responses.
- Content script: listens for messages (e.g. `get_page_text`) and returns page text and title; it can also attempt to run summarization using Chrome's Summarizer API if enabled.
- Background service worker: coordinates long-running tasks, manages an Executor for automation tasks (see `src/background/index.ts`), initializes analytics, and integrates with the `sidePanel` connection.
- Agent system: under `src/background/agent` there's an agent runtime (executor, planner, navigator) that can run automated tasks on pages using provider-configured LLMs and local browser automation.

Key commands
------------
- npm run dev — start Vite dev server
- npm run build — build extension into `dist/`
- npm run preview — preview the built site (Vite preview)

Project layout (high level)
--------------------------
- `manifest.json` / manifest generator — extension metadata and permissions
- `vite.config.ts` — Vite config and build manifest generator
- `index.html` — popup HTML entry
- `options.html` — options page HTML
- `public/` — static public assets (icons, permission pages, helper scripts)
- `src/` — main source code
  - `background/` — background service worker code and agent system (executor, agents, prompts, messages)
  - `background-simple.ts` — small background entry used for the Vite build
  - `contentScript.ts` — content script entry (responds to `get_page_text`)
  - `popup/` and `options/` — UI React components
  - `compat/` — shimbed Node/browser modules used in the extension build
  - `services/` — analytics, speech-to-text and other services
  - `browser/` — helpers for page interaction, DOM views, and context management
  - `styles/` — Tailwind CSS entry
- `CONTRIBUTING.md` — contribution guidelines

Permissions & runtime notes
---------------------------
The manifest requests several broad permissions needed for automation and page interaction:
- `storage`, `scripting`, `tabs`, `activeTab`, `debugger`, `unlimitedStorage`, `webNavigation` and host permissions for `<all_urls>`.

Side panel and Opera / Firefox support
-------------------------------------
- The project includes helpers to add a `side_panel` (Chrome) and an `sidebar_action` for Opera. These are conditionally added by the manifest generator. Firefox does not support sidePanel.

On-device AI (Gemini) and Summarizer
-----------------------------------
- The code references on-device APIs (Prompt API and Summarizer API). These are experimental and require a Chrome build and flags. If the popup reports "Gemini not ready", make sure the on-device model is downloaded and Chrome's AI settings/flags are enabled.

Troubleshooting
---------------
- Build errors: ensure `npm install` completed and Node version is compatible with project deps.
- "Gemini not ready": ensure on-device model is installed and Chrome flags are set. The Summarizer API may require additional flags or Chrome Canary.
- Content script access errors: when testing local files, ensure the loaded page matches the `content_scripts` matches or use the `activeTab` flow.

Contributing
------------
See `CONTRIBUTING.md` for the recommended workflow. Short summary:

1. Fork and create a feature branch.
2. Keep PRs small and focused.
3. Run `npm install` and `npm run dev` to test UI changes; use `npm run build` to produce `dist/` for extension testing.

License
-------
No LICENSE file is included by default. If you want an open-source license, common choices are MIT or Apache-2.0 — tell me which and I'll add a `LICENSE` file.

Contact / help
---------------
If you'd like, I can:
- Add a `TROUBLESHOOTING.md` that lists the exact Chrome flags and steps to enable on-device AI.
- Generate a real set of badges (publish/NPM/CI) once you have CI or a package registry configured.
- Create a small GitHub Action to build `dist/` for releases.

