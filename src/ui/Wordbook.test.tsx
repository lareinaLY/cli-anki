// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Wordbook } from './Wordbook';
import type { WordbookGroup } from '../study/wordbook';

afterEach(cleanup);

const groups: WordbookGroup[] = [
  {
    mastery: 'new',
    entries: [{ card: { id: 'a', prompt: '[查看]{状态}', answer: 'git status' }, mastery: 'new', due: null, difficulty: null, reps: 0 }],
  },
  { mastery: 'learning', entries: [] },
  { mastery: 'young', entries: [] },
  {
    mastery: 'mature',
    entries: [{ card: { id: 'b', prompt: '[初始化]', answer: 'git init' }, mastery: 'mature', due: new Date('2026-07-18'), difficulty: 4.2, reps: 5 }],
  },
];

describe('Wordbook', () => {
  it('shows the total, per-bucket counts, and commands with their difficulty', () => {
    render(<Wordbook groups={groups} />);

    expect(screen.getByText('共 2 个命令')).toBeTruthy();
    expect(screen.getByText('git status')).toBeTruthy();
    expect(screen.getByText('git init')).toBeTruthy();
    // difficulty badge for the reviewed card
    expect(screen.getByText('难度 4.2')).toBeTruthy();
    // prompt markup is stripped for display
    expect(screen.getByText('查看状态')).toBeTruthy();
  });

  it('omits empty buckets from the grouped sections', () => {
    render(<Wordbook groups={groups} />);
    // "巩固中" (young) is empty -> no group heading, but the summary pill still shows it.
    expect(screen.getByText(/巩固中 0/)).toBeTruthy(); // summary pill
    expect(screen.queryByRole('heading', { name: /巩固中/ })).toBeNull();
  });
});
