import { runGeminiPrompt } from './gemini'

export type BrowserAction =
  | { type: 'navigate', url: string }
  | { type: 'click', selector: string }
  | { type: 'type', selector: string, text: string, submit?: boolean }
  | { type: 'wait', ms: number }
  | { type: 'starGithubRepo', owner: string, repo: string }

export type AgentPlan = {
  actions: BrowserAction[]
  rationale?: string
}

const SYSTEM_INSTRUCTIONS = `You are a browser automation planner.
Given a user request, output a minimal JSON action plan to accomplish it in Chrome.
Rules:
- Respond with ONLY JSON matching {"actions":[...],"rationale":string}.
- Prefer robust CSS selectors for click/type when possible.
- For GitHub starring, use a special {"type":"starGithubRepo","owner":"...","repo":"..."} action.
- Use {"type":"navigate","url":"..."} to open a page.
- Use {"type":"wait","ms":N} when the page needs to settle.
- Do not include comments or markdown.
`

export async function planActionsFromCommand(command: string): Promise<AgentPlan> {
  const prompt = `${SYSTEM_INSTRUCTIONS}\nUser: ${command}\nJSON:`
  const raw = await runGeminiPrompt(prompt)
  try {
    const jsonStart = raw.indexOf('{')
    const jsonEnd = raw.lastIndexOf('}')
    const json = raw.slice(jsonStart, jsonEnd + 1)
    const parsed = JSON.parse(json)
    if (!parsed?.actions || !Array.isArray(parsed.actions)) throw new Error('Invalid plan')
    return parsed as AgentPlan
  } catch (e) {
    return { actions: [], rationale: `Failed to parse plan: ${String(e)}\nRaw: ${raw}` }
  }
}


