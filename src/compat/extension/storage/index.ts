export enum ProviderTypeEnum {
  OpenAI = 'openai',
  Google = 'google',
  Anthropic = 'anthropic',
  Groq = 'groq',
  XAI = 'xai',
  AzureOpenAI = 'azure-openai',
  Ollama = 'ollama',
  Cerebras = 'cerebras',
  DeepSeek = 'deepseek',
}

export interface ProviderConfig {
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface ModelConfig {
  provider: ProviderTypeEnum;
  model: string;
}

export const llmProviderStore = {
  async getAllProviders(): Promise<Record<string, ProviderConfig>> {
    const data = await chrome.storage.sync.get(['providers']);
    return (data.providers as Record<string, ProviderConfig>) || {};
  },
};

export const agentModelStore = {
  async getAllAgentModels(): Promise<Record<string, ModelConfig>> {
    const data = await chrome.storage.sync.get(['agentModels']);
    return (data.agentModels as Record<string, ModelConfig>) || {};
  },
  async cleanupLegacyValidatorSettings(): Promise<void> {
    return;
  },
};

export const generalSettingsStore = {
  async getSettings(): Promise<{
    minWaitPageLoad: number;
    displayHighlights: boolean;
    maxSteps: number;
    maxFailures: number;
    maxActionsPerStep: number;
    useVision: boolean;
    planningInterval: number;
    replayHistoricalTasks?: boolean;
  }> {
    const data = await chrome.storage.sync.get(['generalSettings']);
    return (
      (data.generalSettings as any) || {
        minWaitPageLoad: 1500,
        displayHighlights: true,
        maxSteps: 15,
        maxFailures: 3,
        maxActionsPerStep: 3,
        useVision: false,
        planningInterval: 2,
        replayHistoricalTasks: false,
      }
    );
  },
};

export const firewallStore = {
  async getFirewall(): Promise<{ enabled: boolean; allowList: string[]; denyList: string[] }> {
    const data = await chrome.storage.sync.get(['firewall']);
    return (
      (data.firewall as any) || {
        enabled: false,
        allowList: [],
        denyList: [],
      }
    );
  },
};

export const analyticsSettingsStore = {
  async getSettings(): Promise<{ enabled: boolean; anonymousUserId?: string }> {
    const data = await chrome.storage.sync.get(['analyticsSettings']);
    return (data.analyticsSettings as any) || { enabled: false };
  },
  subscribe(callback: () => void): void {
    chrome.storage.onChanged.addListener(changes => {
      if (changes.analyticsSettings) callback();
    });
  },
};

export enum AgentNameEnum {
  Navigator = 'navigator',
  Planner = 'planner',
}


