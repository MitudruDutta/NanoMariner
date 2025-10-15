// Simple message router between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return
  if (message.action === 'summarizePage') {
    if (sender.tab?.id == null) return
    chrome.tabs.sendMessage(sender.tab.id, { action: 'summarizePage' }, (response) => {
      sendResponse(response)
    })
    return true
  }
})


