// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyView } from './StudyView';
import { Rating } from '../srs/scheduler';
import type { Card } from '../content/types';
import type { JudgeResult } from '../matcher/match';

const card: Card = { id: 'git-status', prompt: '查看状态', answer: 'git status' };

const gradedResult: JudgeResult = {
  correct: true,
  matchedAnswer: 'git status',
  diff: [
    { text: 'git', ok: true },
    { text: 'status', ok: true },
  ],
};

afterEach(cleanup);

describe('StudyView command input', () => {
  it('does not submit on Enter while the IME is composing, but does on a plain Enter', async () => {
    const onSubmit = vi.fn();
    render(
      <StudyView
        card={card}
        phase="input"
        result={null}
        intervals={null}
        onSubmit={onSubmit}
        onGrade={vi.fn()}
      />,
    );

    const input = screen.getByPlaceholderText(/输入命令/);
    await userEvent.type(input, 'git status');

    // Enter fired as part of IME composition — must be ignored.
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();

    // A real Enter submits.
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('git status');
  });
});

describe('StudyView difficulty grading', () => {
  it('does NOT grade on Enter — difficulty must be chosen explicitly', () => {
    const onGrade = vi.fn();
    render(
      <StudyView
        card={card}
        phase="graded"
        result={gradedResult}
        intervals={null}
        onSubmit={vi.fn()}
        onGrade={onGrade}
      />,
    );
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onGrade).not.toHaveBeenCalled();
  });

  it('grades when a difficulty number key (3 = 记住了) is pressed', () => {
    const onGrade = vi.fn();
    render(
      <StudyView
        card={card}
        phase="graded"
        result={gradedResult}
        intervals={null}
        onSubmit={vi.fn()}
        onGrade={onGrade}
      />,
    );
    fireEvent.keyDown(window, { key: '3' });
    expect(onGrade).toHaveBeenCalledWith(Rating.Good);
  });
});
