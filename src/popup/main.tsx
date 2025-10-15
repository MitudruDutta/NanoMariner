import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

declare global {
  interface Window {
    ai?: any;
  }
}

function App() {
  const [input, setInput] = useState('Write a friendly greeting.');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'error'>('idle');
  const [log, setLog] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);
  const [tab, setTab] = useState<'chat' | 'tasks' | 'history'>('chat');

  function ensurePort() {
    if (port) return port;
    const p = chrome.runtime.connect({ name: 'agent' });
    p.onMessage.addListener(msg => {
      if (msg?.type === 'assistant_message') {
        setLog(prev => [...prev, { role: 'assistant', text: msg.text }]);
        setOutput(msg.text);
      }
    });
    setPort(p);
    return p;
  }

  function createGenAI(apiKey: string) {
    try {
      // Prefer explicit v1 if the SDK supports config object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new (GoogleGenerativeAI as any)({ apiKey, apiVersion: 'v1' });
    } catch (_) {
      return new GoogleGenerativeAI(apiKey);
    }
  }

  async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
    const genAI = createGenAI(apiKey);
    const candidates = [
      'gemini-2.0-flash-exp', 'gemini-2.5-flash', 'gemini-2.5-pro',
      'gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gemini-1.5-pro',
      'gemini-pro',
    ];
    let lastError: any = null;
    for (const modelId of candidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelId });
        const resp = await model.generateContent(prompt);
        return resp.response.text();
      } catch (err: any) {
        lastError = err;
        // Try next candidate on 404/unsupported
        const msg = String(err?.message || '');
        if (!/404|not found|not supported/i.test(msg)) {
          break;
        }
      }
    }
    // Fallback: discover models via REST and retry once
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`);
      if (res.ok) {
        const body = await res.json();
        const models: Array<any> = body?.models || [];
        const usable = models.filter(m => Array.isArray(m?.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));
        const preferredOrder = [
          'gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-flash-latest',
          'gemini-1.5-pro', 'gemini-1.5-pro-002', 'gemini-1.5-pro-latest', 'gemini-pro', 'gemini-pro-latest'
        ];
        let chosen: string | null = null;
        for (const pref of preferredOrder) {
          const hit = usable.find(m => String(m.name || '').endsWith(pref));
          if (hit) { chosen = pref; break; }
        }
        if (!chosen && usable.length > 0) {
          const first = String(usable[0].name || '');
          chosen = first.startsWith('models/') ? first.substring('models/'.length) : first;
        }
        if (chosen) {
          // First try SDK again with chosen
          try {
            const model = genAI.getGenerativeModel({ model: chosen });
            const resp = await model.generateContent(prompt);
            return resp.response.text();
          } catch (err2: any) {
            lastError = err2;
            // Direct REST v1 fallback
            try {
              const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(chosen)}:generateContent?key=${encodeURIComponent(apiKey)}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                  })
                }
              );
              if (resp.ok) {
                const data = await resp.json();
                const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
                if (text) return text;
                lastError = new Error('Empty response from REST v1 generateContent');
              } else {
                const msg = await resp.text();
                lastError = new Error(`REST v1 error ${resp.status}: ${msg}`);
              }
            } catch (err3: any) {
              lastError = err3;
            }
          }
        }
      }
    } catch (_) {}
    const hint = 'Model not available for your API key or API version. Ensure your key is valid and has access to Gemini 1.5, or configure Chrome on-device AI.';
    throw new Error(lastError?.message ? `${lastError.message} — ${hint}` : hint);
  }

  async function runPromptAPI() {
    try {
      setStatus('running');
      setLog(prev => [...prev, { role: 'user', text: input }]);
      const p = ensurePort();
      p.postMessage({ type: 'user_message', text: input });
      // Prefer Chrome on-device AI if available; otherwise rely on background agent only
      if (!('ai' in window) || !window.ai?.createTextSession) {
        setOutput('Sent to agent. Waiting for response...');
        return;
      }
      const session = await window.ai.createTextSession({ topK: 1, temperature: 0.2 });
      const response: string = await session.prompt(input);
      setOutput(response);
    } catch (e: any) {
      setStatus('error');
      setOutput(e?.message || 'Error');
    } finally {
      setStatus('idle');
    }
  }

  async function summarizeCurrentTab() {
    setStatus('running');
    chrome.runtime.sendMessage({ type: 'summarize_current_tab' }, async (resp) => {
      if (!resp?.ok) {
        setOutput(resp?.error || 'Failed to summarize');
      } else {
        // Skip cloud Gemini fallback to avoid API version issues; show snippet instead
        const snippet = (resp.text || '').slice(0, 500);
        setOutput(`Title: ${resp.title}\n\n${snippet}`);
      }
      setStatus('idle');
    });
  }

  return (
    <div className="w-[380px] p-3 text-[color:var(--text)]" style={{ fontFamily: 'Inter, system-ui, Arial' }}>
      <div className="nm-panel">
        <div className="nm-header">
          <div className="nm-brand">
            <div className="nm-badge" />
            <span className="font-semibold">NanoMariner</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="nm-tabs">
              <button className={`nm-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>Chat</button>
              <button className={`nm-tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>Tasks</button>
              <button className={`nm-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
            </div>
            <button className="nm-link" onClick={() => chrome.runtime.openOptionsPage()}>Settings</button>
          </div>
        </div>

        {tab === 'chat' && (
          <div className="space-y-2">
            <textarea
              className="nm-input resize-none" rows={4}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything…"
            />
            <div className="flex gap-2">
              <button className="nm-btn" onClick={runPromptAPI} disabled={status === 'running'}>Send</button>
              <button className="nm-btn" onClick={summarizeCurrentTab} disabled={status === 'running'}>Summarize tab</button>
            </div>

            {(output || log.length > 0) && (
              <div className="mt-2 space-y-2 max-h-56 overflow-auto pr-1">
                {log.map((m, i) => (
                  <div key={i} className={m.role === 'user' ? 'text-[color:var(--muted)]' : ''}>
                    <pre className="whitespace-pre-wrap text-sm">{m.text}</pre>
                  </div>
                ))}
                {output && <pre className="whitespace-pre-wrap text-sm">{output}</pre>}
              </div>
            )}

            <div className="nm-footer">
              <div className="flex items-center gap-3 text-sm">
                <button className="nm-link" onClick={() => setInput('Give me 3 ideas to improve this page.')}>Ideas</button>
                <button className="nm-link" onClick={() => setInput('Summarize key points from this page.')}>Summarize</button>
                <button className="nm-link" onClick={() => setInput('Write a concise reply to the selected text.')}>Reply</button>
              </div>
              <div className="text-xs text-[color:var(--muted)]">
                <span className="nm-kbd">Ctrl</span> + <span className="nm-kbd">Enter</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="text-sm text-[color:var(--muted)]">
            No tasks yet. Actions you run will appear here.
          </div>
        )}

        {tab === 'history' && (
          <div className="text-sm text-[color:var(--muted)]">
            Conversation history will show here.
          </div>
        )}
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);



