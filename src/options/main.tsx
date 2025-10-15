import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

function Options() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    chrome.storage.sync.get(['geminiApiKey'], (res) => {
      if (res?.geminiApiKey) setApiKey(res.geminiApiKey);
    });
  }, []);

  function save() {
    setError('');
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError('API key is required.');
      return;
    }
    chrome.storage.sync.set({ geminiApiKey: trimmed }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div style={{ maxWidth: 720, margin: '24px auto', fontFamily: 'Inter, system-ui, Arial', color: 'var(--text)' }}>
      <div className="nm-panel">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-[color:var(--primary)]/20 border border-[color:var(--primary)]" />
            <span className="font-semibold">Settings</span>
          </div>
          {saved && <span className="text-sm text-[color:var(--muted)]">Saved ✓</span>}
        </div>

        <label htmlFor="key" className="text-sm opacity-80">Gemini API Key</label>
        <input
          id="key"
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="AIza..."
          className="nm-input mt-1"
        />
        {error && <div className="text-sm mt-1" style={{ color: '#ffb4b4' }}>{error}</div>}

        <div className="mt-3 flex gap-2">
          <button className="nm-btn" onClick={save}>Save</button>
          <a className="nm-link" href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noreferrer">Get an API key</a>
        </div>

        <p className="text-sm mt-3 text-[color:var(--muted)]">
          Stored locally via chrome.storage.sync. Used only from your device.
        </p>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);


