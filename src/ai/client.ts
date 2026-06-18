import type { Card } from '../content/types';
import type { AiConfig } from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Build the system prompt. When a card is in view its content is injected so
 * the assistant can answer in context ("为什么是 --soft 而不是 --mixed？")
 * without the user re-explaining.
 */
export function buildSystemPrompt(card: Card | null): string {
  const base =
    '你是一个帮助用户学习命令行（CLI）的中文助教。回答要简洁、准确，必要时给出可直接运行的示例命令，并用 Markdown 的行内代码标记命令和参数。';
  if (!card) return base;

  const lines = [
    base,
    '',
    '用户当前正在学习这张卡片，请结合它的语境作答：',
    `- 任务：${card.prompt}`,
    `- 标准答案：${card.answer}`,
  ];
  if (card.explanation) {
    lines.push(`- 已有解释：${card.explanation.replace(/\s+/g, ' ').trim()}`);
  }
  return lines.join('\n');
}

/** Assemble the full message list sent to the API: system + history + question. */
export function buildMessages(
  card: Card | null,
  history: readonly ChatMessage[],
  question: string,
): ChatMessage[] {
  return [
    { role: 'system', content: buildSystemPrompt(card) },
    ...history,
    { role: 'user', content: question },
  ];
}

export interface AskOptions {
  signal?: AbortSignal;
}

/** Call OpenAI's chat completions endpoint and return the assistant's text. */
export async function askAI(
  config: AiConfig,
  messages: readonly ChatMessage[],
  opts: AskOptions = {},
): Promise<string> {
  const res = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model: config.model, messages, temperature: 0.3 }),
    ...(opts.signal ? { signal: opts.signal } : {}),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`OpenAI 请求失败（${res.status}）：${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI 返回了空内容');
  return content;
}
