import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateCard } from './generate';
import type { AiConfig } from './config';

const config: AiConfig = {
  apiKey: 'sk-test',
  model: 'gpt-4o-mini',
  baseURL: 'https://api.openai.com/v1',
};

function mockResponse(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

describe('generateCard', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('parses a valid generated card and requests JSON output', async () => {
    const card = {
      prompt: '交互式地[变基]最近三个 {commit}',
      accept: ['git rebase --interactive HEAD~3'],
      explanation: '`-i` = **interactive**，逐个挑选要保留/合并的提交。',
      tags: ['rebase'],
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(JSON.stringify(card)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateCard('git rebase -i HEAD~3', config);
    expect(result.prompt).toContain('变基');
    expect(result.accept).toEqual(['git rebase --interactive HEAD~3']);

    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as { response_format?: unknown };
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('tolerates JSON wrapped in a ```json code fence', async () => {
    const fenced = '```json\n{"prompt":"[查看]{状态}","explanation":"x"}\n```';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse(fenced)));

    const result = await generateCard('git status', config);
    expect(result.prompt).toBe('[查看]{状态}');
  });

  it('throws when the model returns non-JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse('抱歉，我无法处理')));
    await expect(generateCard('git status', config)).rejects.toThrow('不是合法 JSON');
  });

  it('throws when required fields are missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse('{"prompt":"只有题干"}')));
    await expect(generateCard('git status', config)).rejects.toThrow();
  });
});
