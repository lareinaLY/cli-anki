import { describe, expect, it } from 'vitest';
import { State } from 'ts-fsrs';
import { buildWordbook, classifyMastery } from './wordbook';
import type { Card } from '../content/types';
import type { CardProgress } from '../store/db';
import { newState, type ReviewState } from '../srs/scheduler';

const now = new Date('2026-06-18T00:00:00Z');
const card = (id: string): Card => ({ id, prompt: id, answer: id });

function progress(over: Partial<ReviewState>): CardProgress {
  return { cardId: 'x', deckId: 'git', state: { ...newState(now), ...over }, reps: 1, lapses: 0 };
}

describe('classifyMastery', () => {
  it('treats a card with no progress as new', () => {
    expect(classifyMastery(undefined)).toBe('new');
  });

  it('classifies learning/relearning state as learning', () => {
    expect(classifyMastery(progress({ state: State.Learning }))).toBe('learning');
    expect(classifyMastery(progress({ state: State.Relearning }))).toBe('learning');
  });

  it('splits review state by stability into young vs mature', () => {
    expect(classifyMastery(progress({ state: State.Review, stability: 5 }))).toBe('young');
    expect(classifyMastery(progress({ state: State.Review, stability: 30 }))).toBe('mature');
  });
});

describe('buildWordbook', () => {
  it('groups cards into buckets in display order and counts them', () => {
    const cards = [card('a'), card('b'), card('c')];
    const map = new Map<string, CardProgress>([
      ['a', progress({ state: State.Review, stability: 40 })], // mature
      ['b', progress({ state: State.Learning })], // learning
      // c: no progress -> new
    ]);

    const groups = buildWordbook(cards, map);
    expect(groups.map((g) => g.mastery)).toEqual(['new', 'learning', 'young', 'mature']);
    expect(groups.find((g) => g.mastery === 'new')?.entries.map((e) => e.card.id)).toEqual(['c']);
    expect(groups.find((g) => g.mastery === 'mature')?.entries[0]?.difficulty).toBeTypeOf('number');
    expect(groups.find((g) => g.mastery === 'young')?.entries).toEqual([]);
  });
});
