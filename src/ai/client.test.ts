import { afterEach, describe, expect, it, vi } from 'vitest';
import { askAI, buildMessages, buildSystemPrompt, type ChatMessage } from './client';
import type { Card } from '../content/types';
import type { AiConfig } from './config';

const card: Card = {
  id: 'git-reset-soft',
  prompt: '撤销最近一次 commit，但保留改动',
  answer: 'git reset --soft HEAD~1',
  explanation: '--soft 只移动 HEAD。',
};

const config: AiConfig = {
  apiKey: 'sk-test',
  model: 'gpt-4o-mini',
  baseURL: 'https://api.openai.com/v1',
};

describe('buildSystemPrompt', () => {
  it('injects card context when a card is present', () => {
    const p = buildSystemPrompt(card);
    expect(p).toContain('git reset --soft HEAD~1');
    expect(p).toContain(card.prompt);
  });

  it('falls back to a generic prompt without a card', () => {
    const p = buildSystemPrompt(null);
    expect(p).not.toContain('任务：');
    expect(p).toContain('命令行');
  });
});

describe('buildMessages', () => {
  it('orders system, history, then the new question', () => {
    const history: ChatMessage[] = [
      { role: 'user', content: '之前的问题' },
      { role: 'assistant', content: '之前的回答' },
    ];
    const msgs = buildMessages(card, history, '新问题');
    expect(msgs[0].role).toBe('system');
    expect(msgs.slice(1, 3)).toEqual(history);
    expect(msgs.at(-1)).toEqual({ role: 'user', content: '新问题' });
  });
});

describe('askAI', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends auth + model and returns the assistant content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '答案' } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const reply = await askAI(config, [{ role: 'user', content: 'hi' }]);
    expect(reply).toBe('答案');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer sk-test');
    expect(JSON.parse(init.body as string)).toMatchObject({ model: 'gpt-4o-mini' });
  });

  it('throws a helpful error on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('rate limited', { status: 429 })),
    );
    await expect(askAI(config, [{ role: 'user', content: 'hi' }])).rejects.toThrow('429');
  });
});
