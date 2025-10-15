// Background router for popup <-> content and agent execution
import { planActionsFromCommand, BrowserAction } from './agent'

async function ensureActiveTab(): Promise<number> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  const tab = tabs[0]
  if (!tab?.id) throw new Error('No active tab')
  return tab.id
}

async function runActionsOnTab(tabId: number, actions: BrowserAction[]): Promise<{ ok: boolean, logs: string[] }>{
  const logs: string[] = []
  for (const action of actions) {
    logs.push(`Run: ${JSON.stringify(action)}`)
    const response = await chrome.tabs.sendMessage(tabId, { action: 'perform', payload: action })
    if (response?.error) {
      logs.push(`Error: ${response.error}`)
      return { ok: false, logs }
    }
    if (response?.log) logs.push(response.log)
  }
  return { ok: true, logs }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return

  if (message.action === 'summarizePage') {
    if (sender.tab?.id == null) return
    chrome.tabs.sendMessage(sender.tab.id, { action: 'summarizePage' }, (response) => {
      sendResponse(response)
    })
    return true
  }

  if (message.action === 'agent.planAndRun') {
    const { command } = message
    ;(async () => {
      try {
        const plan = await planActionsFromCommand(command)
        const tabId = await ensureActiveTab()
        const result = await runActionsOnTab(tabId, plan.actions)
        sendResponse({ plan, ...result })
      } catch (e: any) {
        sendResponse({ error: e?.message ?? String(e) })
      }
    })()
    return true
  }
})


