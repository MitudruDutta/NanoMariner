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
})


