## NanoMariner

NanoMariner is a Chrome extension (Manifest V3) built with Vite, React, TypeScript and Tailwind CSS. It demonstrates using Chrome's on-device Gemini Nano via the Prompt API to run short text-generation tasks from a popup UI, and optionally uses the Summarizer API from a content script to summarize web pages.

The extension is intended as a small, local-first example of integrating on-device AI features in a browser extension without needing an external API key.

## Key features

- Popup UI that creates text sessions with the on-device Gemini Nano (via `ai.createTextSession()`)
- Content script action to summarize the current page using `ai.summarizer.summarize()` (when available)
- Background service worker to route messages between the popup and content script
- Vite multi-entry build that outputs per-entry bundles for the extension

## Requirements

- Chrome 128+ (or Chrome Canary) with on-device AI enabled and the relevant flags for Prompt API / Summarizer API.
- No external API key required; the extension uses only Chrome's on-device APIs.

NOTE: On-device models and preview APIs are behind feature flags and may change. If a feature doesn't work, check Chrome flags and that the on-device model is downloaded.

## Quick start (development)

1. Install dependencies

```bash
npm install
```

2. Start the dev server (Vite)

```bash
npm run dev
```

3. Load the extension in Chrome (development flow)

- Build or generate the `dist/` output (Vite dev server may already provide assets at a local URL):

```bash
npm run build
```

- Open Chrome → chrome://extensions → enable Developer mode → Load unpacked → choose the `dist/` folder inside this repository.

On successful load you'll see the extension icon in the toolbar. Open the popup to interact with Gemini Nano.

## Build for production

```bash
npm run build
```

The production-ready extension files will be in the `dist/` folder (configured via Vite). Use that folder when loading the unpacked extension.

## Project layout

Files and folders you'll commonly work with:

- `manifest.json` — extension manifest (MV3)
- `index.html` — Vite entry HTML
- `vite.config.ts` — Vite configuration and multi-entry setup
- `src/main.tsx` — main popup or UI entry (React)
- `src/popup/Popup.tsx` — Popup React component
- `src/background.ts` — background service worker (message routing)
- `src/contentScript.ts` — content script (page summarization action)
- `src/gemini.ts` — helper utilities for interacting with Chrome's AI APIs
- `src/styles/index.css` — Tailwind entry styles

## Troubleshooting

- "Gemini not ready" in popup: make sure the on-device model is downloaded. Visit chrome://settings/ai or chrome://flags to check on-device AI settings (flag names may change).
- Summarizer API errors: the Summarizer API may be experimental or behind flags. If it fails, the content script will return a friendly fallback message.
- Build/load errors: ensure `npm install` completed successfully and that you point Chrome at the `dist/` directory after running `npm run build`.

## Contributing

Contributions are welcome. Small improvements that help others run the project locally are especially appreciated (docs, clearer error messages, and simple test coverage).

Suggested steps:

1. Fork the repo and create a feature branch.
2. Make your change, add tests where appropriate.
3. Open a pull request describing the change.

## License

Specify license information here (e.g. MIT) or add a LICENSE file to the repo.

---

If you'd like, I can also:

- Add a short CONTRIBUTING.md with a recommended development flow.
- Wire up a simple automated build script or GitHub Action to produce the `dist/` artifacts.
- Add a troubleshooting section that lists the exact Chrome flags and where to enable on-device AI (if you want me to look them up).
