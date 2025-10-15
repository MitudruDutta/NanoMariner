export interface AgentStepHistoryRecord {
  id: string;
  history: string; // JSON string
}

const KEY = 'agentStepHistory';

export const chatHistoryStore = {
  async storeAgentStepHistory(sessionId: string, _task: string, historyJson: string): Promise<void> {
    const data = await chrome.storage.local.get([KEY]);
    const existing: Record<string, AgentStepHistoryRecord> = data[KEY] || {};
    existing[sessionId] = { id: sessionId, history: historyJson };
    await chrome.storage.local.set({ [KEY]: existing });
  },
  async loadAgentStepHistory(sessionId: string): Promise<AgentStepHistoryRecord | null> {
    const data = await chrome.storage.local.get([KEY]);
    const existing: Record<string, AgentStepHistoryRecord> = data[KEY] || {};
    return existing[sessionId] || null;
  },
};


