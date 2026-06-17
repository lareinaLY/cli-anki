import { describe, expect, it } from 'vitest';
import { decks } from './loader';
import { judge } from '../matcher/match';

describe('bundled decks', () => {
  it('load and validate against the schema', () => {
    expect(decks.length).toBeGreaterThan(0);
  });

  const allCards = decks.flatMap((d) => d.cards);

  it('have globally unique card ids', () => {
    const ids = allCards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(allCards.map((c) => [c.id, c] as const))(
    'card "%s" judges its own answer as correct',
    (_id, card) => {
      const answers = [card.answer, ...(card.accept ?? [])];
      expect(judge(card.answer, answers).correct).toBe(true);
      for (const alt of card.accept ?? []) {
        expect(judge(alt, answers).correct).toBe(true);
      }
    },
  );
});
