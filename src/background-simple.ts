export {};

// Simple agent runtime using Prompt API or Gemini fallback
// Connect with popup through a long-lived Port channel (name: 'agent')
chrome.runtime.onConnect.addListener(port => {
  if (port.name !== 'agent') return;

  port.onMessage.addListener(async msg => {
    try {
      if (msg?.type === 'user_message') {
        const text: string = msg.text ?? '';
        const reply = await runModel(text);
        port.postMessage({ type: 'assistant_message', text: reply });
      } else if (msg?.type === 'traverse_tabs') {
        const summary = await traverseAndSummarizeTabs();
        port.postMessage({ type: 'assistant_message', text: summary });
      }
    } catch (e: any) {
      port.postMessage({ type: 'assistant_message', text: e?.message || 'Error' });
    }
  });
});

// Fallback summarize for one-off message from popup button
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'summarize_current_tab') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ ok: false, error: 'No active tab' });
      return true;
    }
    chrome.tabs.sendMessage(tabId, { type: 'get_page_text' }, response => {
      if (!response?.ok) return sendResponse(response);
      sendResponse({ ok: true, title: response.title, text: response.text });
    });
    return true;
  }
});

async function runModel(prompt: string): Promise<string> {
  // Prefer on-device Prompt API if available
  try {
    // @ts-ignore experimental
    if ('ai' in globalThis && (globalThis as any).ai?.createTextSession) {
      const session = await (globalThis as any).ai.createTextSession({ temperature: 0.2 });
      return await session.prompt(prompt);
    }
  } catch {}

  // Else use Gemini with key from storage
  const { geminiApiKey } = await chrome.storage.sync.get(['geminiApiKey']);
  if (!geminiApiKey) throw new Error('No Prompt API and no Gemini key set in Settings.');
  const model = 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    geminiApiKey,
  )}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${text}`);
  }
  const data: any = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text || '[no response]';
}

async function traverseAndSummarizeTabs(): Promise<string> {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const summaries: string[] = [];
  for (const tab of tabs) {
    if (!tab.id) continue;
    const page = await getPageText(tab.id);
    if (page) {
      const s = await runModel(`Summarize in 2 bullets. Title: ${page.title}\n\nContent: ${page.text.slice(0, 4000)}`);
      summaries.push(`- ${page.title}:\n${s}`);
    }
  }
  return summaries.join('\n\n');
}

function getPageText(tabId: number): Promise<{ title: string; text: string } | null> {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { type: 'get_page_text' }, response => {
      if (!response?.ok) return resolve(null);
      resolve({ title: response.title, text: response.text });
    });
  });
}
