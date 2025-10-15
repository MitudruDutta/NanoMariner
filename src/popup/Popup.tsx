import React, { useCallback, useEffect, useState } from 'react'
import { runGeminiPrompt } from '../gemini'
import { getApiKey, saveApiKey, getChatHistory, saveChatHistory, ChatMessage } from '../storage'

export default function Popup() {
  const [prompt, setPrompt] = useState('Go to https://github.com/google/generative-ai-js and star the repo.')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([])

  useEffect(() => {
    ;(async () => {
      const key = await getApiKey()
      if (key) setApiKey(key)
      const history = await getChatHistory()
      setChat(history)
    })()
  }, [])

  const onSaveKey = useCallback(async () => {
    await saveApiKey(apiKey.trim())
  }, [apiKey])

  const onRun = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const userMsg: ChatMessage = { role: 'user', content: prompt, timestamp: Date.now() }
      const plan = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'agent.planAndRun', command: prompt }, (res) => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
          if (res?.error) return reject(new Error(res.error))
          resolve(res)
        })
      })
      const text = typeof plan?.plan?.rationale === 'string' ? plan.plan.rationale : JSON.stringify(plan, null, 2)
      setResponse(text)
      const assistantMsg: ChatMessage = { role: 'assistant', content: text, timestamp: Date.now() }
      const nextChat = [...chat, userMsg, assistantMsg]
      setChat(nextChat)
      await saveChatHistory(nextChat)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setIsLoading(false)
    }
  }, [prompt, chat])

  return (
    <div className="w-[360px] max-w-full p-3 space-y-3">
      <h1 className="text-lg font-semibold">NanoMariner</h1>
      <div className="flex items-center justify-between">
        <button className="text-sm text-blue-600 hover:underline" onClick={() => setShowSettings(v => !v)}>
          {showSettings ? 'Hide Settings' : 'Settings'}
        </button>
      </div>
      {showSettings && (
        <div className="space-y-2 p-2 rounded-md border border-gray-300 dark:border-gray-700">
          <label className="text-sm font-medium">Gemini API Key (optional)</label>
          <input
            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70"
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-800"
            onClick={onSaveKey}
          >
            Save Key
          </button>
        </div>
      )}
      <textarea
        className="w-full h-28 p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what to automate..."
      />
      <button
        className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={isLoading}
        onClick={onRun}
      >
        {isLoading ? 'Running…' : 'Plan + Run'}
      </button>
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="space-y-2 max-h-64 overflow-auto">
        {chat.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-sm' : 'text-sm text-gray-700 dark:text-gray-300'}>
            <span className="font-medium">{m.role === 'user' ? 'You' : 'Agent'}:</span> {m.content}
          </div>
        ))}
        {response && (
          <pre className="whitespace-pre-wrap text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
            {response}
          </pre>
        )}
      </div>
    </div>
  )
}


