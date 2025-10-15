// Simple chrome.storage wrapper for API key and chat history

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

const KEY_API = 'geminiApiKey'
const KEY_CHAT = 'chatHistory'

export async function saveApiKey(key: string): Promise<void> {
  await chrome.storage.sync.set({ [KEY_API]: key })
}

export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.sync.get(KEY_API)
  return (result?.[KEY_API] as string) ?? null
}

export async function saveChatHistory(history: ChatMessage[]): Promise<void> {
  await chrome.storage.local.set({ [KEY_CHAT]: history })
}

export async function getChatHistory(): Promise<ChatMessage[]> {
  const result = await chrome.storage.local.get(KEY_CHAT)
  return (result?.[KEY_CHAT] as ChatMessage[]) ?? []
}


