# NanoMariner

A Chrome Extension (MV3) built with Vite + React + TypeScript and TailwindCSS that uses Chrome's on-device Gemini Nano via the Prompt API. Includes optional page summarization via the Summarizer API.

## Features
- Popup UI to prompt Gemini Nano with Chrome's `ai.createTextSession()`
- Content script supports `{ action: "summarizePage" }` using `ai.summarizer.summarize()`
- Background service worker routes messages between popup and content
- Vite multi-entry build outputs `[name].js` bundles

## Requirements
- Chrome 128+ (or Canary) with on-device AI enabled (Prompt API / Summarizer API)
- No external API key required

## Install & Run
```bash
npm install
npm run dev
npm run build
```

Then load the extension:
- Open Chrome → Extensions → Enable Developer Mode → Load unpacked → select the `dist/` folder.

## Project Structure
```
nanomariner/
├── manifest.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── background.ts
│   ├── contentScript.ts
│   ├── gemini.ts
│   ├── popup/Popup.tsx
│   └── styles/index.css
```

## Notes
- If the popup shows an error like "Gemini not ready", ensure the on-device model is downloaded and the Prompt API flag is enabled.
- The Summarizer API may be behind flags; if unavailable the content script returns a friendly message.
# NanoMariner
