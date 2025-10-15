// Minimal wrapper supporting both the new Prompt API (LanguageModel)
// and the legacy experimental ai.createTextSession().

declare const ai: any;
declare const LanguageModel: any;

export async function runGeminiPrompt(prompt: string): Promise<string> {
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


