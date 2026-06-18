// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyMode } from './StudyMode';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('StudyMode deck picker', () => {
  it('offers the git, shell, and 生词本 decks', () => {
    render(<StudyMode />);
    expect(screen.getByRole('option', { name: 'Git 基础' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '命令行基础 · zsh' })).toBeTruthy();
    expect(screen.getByRole('option', { name: '生词本（0）' })).toBeTruthy();
  });

  it('shows the wordbook for the selected deck', async () => {
    const user = userEvent.setup();
    render(<StudyMode />);
    await user.click(screen.getByRole('button', { name: '单词本' }));
    // The git deck ships 15 cards.
    expect(screen.getByText('共 15 个命令')).toBeTruthy();
  });
});
