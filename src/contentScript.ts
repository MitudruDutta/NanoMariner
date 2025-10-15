export {};

function getPagePayload() {
  const title = document.title || '';
  let text = '';
  try {
    text = document.body?.innerText || '';
  } catch {
    text = '';
  }
  return { ok: true, title, text };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'get_page_text') {
    sendResponse(getPagePayload());
    return true;
  }
});


