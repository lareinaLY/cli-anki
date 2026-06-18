// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiPanel } from './AiPanel';
import type { Card } from '../content/types';

const card: Card = { id: 'git-init', prompt: '初始化仓库', answer: 'git init' };

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('AiPanel onboarding', () => {
  it('shows a chat shell with a connect CTA (not a bare form) before configuring', () => {
    render(<AiPanel card={card} />);
    expect(screen.getByRole('button', { name: /接入 OpenAI/ })).toBeTruthy();
    // The chat input is visible but disabled until a key is provided.
    const input = screen.getByPlaceholderText('请先接入 OpenAI');
    expect(input.hasAttribute('disabled')).toBe(true);
  });

  it('validates an empty key instead of silently disabling Save', async () => {
    const user = userEvent.setup();
    render(<AiPanel card={card} />);
    await user.click(screen.getByRole('button', { name: /接入 OpenAI/ }));

    // Save is clickable; clicking with no key shows an inline error.
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('请先填入 API Key')).toBeTruthy();
    expect(screen.getByPlaceholderText('sk-...')).toBeTruthy(); // still on the form
  });

  it('connects with a key and then enables the chat input', async () => {
    const user = userEvent.setup();
    render(<AiPanel card={card} />);
    await user.click(screen.getByRole('button', { name: /接入 OpenAI/ }));
    await user.type(screen.getByPlaceholderText('sk-...'), 'sk-test-key');
    await user.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.queryByPlaceholderText('sk-...')).toBeNull();
    const input = screen.getByPlaceholderText(/回车发送/);
    expect(input.hasAttribute('disabled')).toBe(false);
  });
});
