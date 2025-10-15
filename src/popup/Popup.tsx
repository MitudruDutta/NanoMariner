import React, { useCallback, useState } from 'react'
import { runGeminiPrompt } from '../gemini'

export default function Popup() {
  const [prompt, setPrompt] = useState('Summarize this page in two sentences.')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onRun = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await runGeminiPrompt(prompt)
      setResponse(res)
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally {
      setIsLoading(false)
    }
  }, [prompt])

  return (
    <div className="w-[360px] max-w-full p-3 space-y-3">
      <h1 className="text-lg font-semibold">NanoMariner</h1>
      <textarea
        className="w-full h-28 p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt for Gemini Nano"
      />
      <button
        className="inline-flex items-center justify-center px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={isLoading}
        onClick={onRun}
      >
        {isLoading ? 'Running…' : 'Run with Gemini Nano'}
      </button>
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {response && (
        <pre className="whitespace-pre-wrap text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700">
          {response}
        </pre>
      )}
    </div>
  )
}


