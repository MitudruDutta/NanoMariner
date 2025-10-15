declare const ai: any

async function getPageText(): Promise<string> {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const parts: string[] = []
  let node: Node | null
  // eslint-disable-next-line no-cond-assign
  while ((node = walker.nextNode())) {
    const text = node.textContent?.trim()
    if (text) parts.push(text)
  }
  return parts.join('\n')
}

async function summarizePage(): Promise<string> {
  if (!('ai' in globalThis) || !ai.summarizer) {
    return 'Summarizer API not available in this Chrome build.'
  }
  const text = await getPageText()
  try {
    const caps = await ai.summarizer.capabilities()
    if (caps?.available !== 'readily') {
      return `Summarizer not ready: ${caps?.available}`
    }
    const summary = await ai.summarizer.summarize(text)
    return String(summary ?? '')
  } catch (e: any) {
    return e?.message ?? String(e)
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'summarizePage') {
    summarizePage().then((summary) => sendResponse({ summary }))
    return true
  }
  if (message?.action === 'perform') {
    ;(async () => {
      try {
        const result = await performAction(message.payload)
        sendResponse({ ok: true, log: result })
      } catch (e: any) {
        sendResponse({ ok: false, error: e?.message ?? String(e) })
      }
    })()
    return true
  }
})

type Performable = any

async function performAction(action: Performable): Promise<string> {
  switch (action?.type) {
    case 'navigate': {
      window.location.href = action.url
      return `Navigating to ${action.url}`
    }
    case 'wait': {
      await new Promise((r) => setTimeout(r, action.ms ?? 1000))
      return `Waited ${action.ms}ms`
    }
    case 'click': {
      const el = document.querySelector(action.selector)
      if (!el) throw new Error(`No element for selector ${action.selector}`)
      ;(el as HTMLElement).click()
      return `Clicked ${action.selector}`
    }
    case 'type': {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(action.selector)
      if (!el) throw new Error(`No element for selector ${action.selector}`)
      el.focus()
      el.value = action.text
      el.dispatchEvent(new Event('input', { bubbles: true }))
      if (action.submit) {
        el.form?.submit()
      }
      return `Typed into ${action.selector}`
    }
    case 'starGithubRepo': {
      const { owner, repo } = action
      // Navigate to stargazers URL triggers auth/intent to star
      const target = `https://github.com/${owner}/${repo}`
      if (!location.href.startsWith(target)) {
        window.location.href = target
        await new Promise((r) => setTimeout(r, 2000))
      }
      // Try clicking the star button
      const starSel = 'button[aria-label^="Star this repository"], button[aria-label^="Unstar this repository"], .js-social-form button[aria-label*="Star"]'
      const starBtn = document.querySelector<HTMLButtonElement>(starSel)
      if (!starBtn) throw new Error('GitHub Star button not found')
      starBtn.click()
      return 'Toggled star on repository'
    }
    default:
      throw new Error(`Unknown action: ${JSON.stringify(action)}`)
  }
}

