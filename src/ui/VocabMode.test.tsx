// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VocabMode } from './VocabMode';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    'cli-anki.ai-config',
    JSON.stringify({ apiKey: 'sk-test', model: 'gpt-4o-mini', baseURL: 'https://api.openai.com/v1' }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('VocabMode', () => {
  it('generates a card from a pasted command and saves it to the 生词本', async () => {
    const generated = {
      prompt: '交互式地[变基]最近三个 {commit}',
      explanation: '`-i` = **interactive**，逐个挑选提交。',
      accept: ['git rebase --interactive HEAD~3'],
      tags: ['rebase'],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(generated) } }] }), {
          status: 200,
        }),
      ),
    );

    const user = userEvent.setup();
    render(<VocabMode />);

    await user.type(screen.getByPlaceholderText(/粘贴一条命令/), 'git rebase -i HEAD~3');
    await user.click(screen.getByRole('button', { name: '生成讲解' }));

    // Preview shows the command echo and a save button.
    await screen.findByRole('button', { name: '加入生词本' });
    expect(screen.getByText('git rebase -i HEAD~3', { selector: '.cmd-echo' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '加入生词本' }));

    // It lands in the list.
    await waitFor(() => expect(screen.getByText(/已收录 1 条/)).toBeTruthy());
  });

  it('asks the user to connect OpenAI when no key is configured', async () => {
    localStorage.clear(); // no config
    const user = userEvent.setup();
    render(<VocabMode />);

    await user.type(screen.getByPlaceholderText(/粘贴一条命令/), 'git status');
    await user.click(screen.getByRole('button', { name: '生成讲解' }));

    expect(screen.getByText(/请先在右侧/)).toBeTruthy();
  });
});
