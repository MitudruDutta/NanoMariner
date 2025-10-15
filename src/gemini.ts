// Minimal wrapper supporting both the new Prompt API (LanguageModel)
// and the legacy experimental ai.createTextSession().

declare const ai: any;
declare const LanguageModel: any;
import { getApiKey } from './storage'

export async function runGeminiPrompt(prompt: string): Promise<string> {
  // If user set an API key, prefer cloud Gemini via REST
  const apiKey = await getApiKey()
  if (apiKey) {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + encodeURIComponent(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }]}]
      })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Gemini API error: ${res.status} ${text}`)
    }
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    if (text) return String(text)
  }

  // Preferred: new Prompt API
  if ('LanguageModel' in globalThis && typeof (LanguageModel?.availability) === 'function') {
    const available = await LanguageModel.availability();
    if (available === 'unavailable') {
      throw new Error('Gemini not available. Ensure flags are enabled and model downloaded.');
    }
    const session = await LanguageModel.create();
    const result = await session.prompt(prompt);
    return String(result ?? '');
  }

  // Fallback: legacy experimental API
  if ('ai' in globalThis) {
    const status = await ai.canCreateTextSession?.();
    if (status !== 'readily') {
      throw new Error(`Gemini not ready: ${status}`);
    }
    const session = await ai.createTextSession();
    const result = await session.prompt(prompt);
    return String(result ?? '');
  }

  throw new Error('Chrome Prompt API not available. Use Chrome 128+ with flags enabled.');
}

export async function summarizeText(text: string): Promise<string> {
  if (!('ai' in globalThis) || !ai.summarizer) {
    throw new Error('Summarizer API not available in this Chrome build.');
  }
  const availability = await ai.summarizer.capabilities();
  if (availability?.available !== 'readily') {
    throw new Error(`Summarizer not ready: ${availability?.available}`);
  }
  const summary = await ai.summarizer.summarize(text);
  return String(summary ?? '');
}


