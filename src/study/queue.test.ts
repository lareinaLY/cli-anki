import { describe, expect, it } from 'vitest';
import { buildQueue } from './queue';
import type { Card } from '../content/types';
import type { CardProgress } from '../store/db';
import { newState, review, Rating } from '../srs/scheduler';

const card = (id: string): Card => ({ id, prompt: id, answer: id });

function progress(cardId: string, state: CardProgress['state']): CardProgress {
  return { cardId, deckId: 'git', state, reps: 1, lapses: 0 };
}

describe('buildQueue', () => {
  const now = new Date('2026-06-17T00:00:00Z');

  it('treats cards without progress as new, capped by newPerSession', () => {
    const cards = [card('a'), card('b'), card('c')];
    const q = buildQueue(cards, new Map(), now, { newPerSession: 2 });
    expect(q.newCount).toBe(2);
    expect(q.cards.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('includes due cards and excludes future cards', () => {
    const past = new Date('2026-06-10T00:00:00Z');
    const dueState = newState(past); // due ~= past => due now
    const futureState = review(newState(now), Rating.Easy, now); // due far in future

    const map = new Map<string, CardProgress>([
      ['a', progress('a', dueState)],
      ['b', progress('b', futureState)],
    ]);
    const q = buildQueue([card('a'), card('b')], map, now, { newPerSession: 0 });

    expect(q.cards.map((c) => c.id)).toEqual(['a']);
    expect(q.dueCount).toBe(1);
  });

  it('orders due cards before new cards', () => {
    const dueState = newState(new Date('2026-06-10T00:00:00Z'));
    const map = new Map<string, CardProgress>([['seen', progress('seen', dueState)]]);
    const q = buildQueue([card('new'), card('seen')], map, now, { newPerSession: 5 });
    expect(q.cards.map((c) => c.id)).toEqual(['seen', 'new']);
  });
});
