/**
 * AI settings, stored locally in the browser only. The OpenAI API key never
 * leaves this machine except in the direct request to OpenAI — it is not
 * bundled in source and not committed. (For a public deployment you'd move the
 * key behind a backend proxy instead; see README.)
 */
export interface AiConfig {
  apiKey: string;
  model: string;
  baseURL: string;
}

const STORAGE_KEY = 'cli-anki.ai-config';

export const AI_DEFAULTS = {
  model: 'gpt-4o-mini',
  baseURL: 'https://api.openai.com/v1',
} as const;

/** Returns the saved config, or null if no API key has been entered. */
export function getAiConfig(): AiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    if (!parsed.apiKey) return null;
    return {
      apiKey: parsed.apiKey,
      model: parsed.model?.trim() || AI_DEFAULTS.model,
      baseURL: parsed.baseURL?.trim() || AI_DEFAULTS.baseURL,
    };
  } catch {
    return null;
  }
}

export function saveAiConfig(cfg: AiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearAiConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
