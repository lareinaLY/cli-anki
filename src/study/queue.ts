import type { Card } from '../content/types';
import type { CardProgress } from '../store/db';
import { isDue } from '../srs/scheduler';

export interface QueueOptions {
  /** Maximum number of never-seen cards to introduce this session. */
  newPerSession: number;
}

export interface StudyQueue {
  cards: Card[];
  dueCount: number;
  newCount: number;
}

/**
 * Build the ordered study queue: all cards currently due, followed by up to
 * `newPerSession` brand-new cards. Cards whose next review is in the future are
 * excluded.
 */
export function buildQueue(
  cards: readonly Card[],
  progress: ReadonlyMap<string, CardProgress>,
  now: Date,
  opts: QueueOptions,
): StudyQueue {
  const due: Card[] = [];
  const fresh: Card[] = [];

  for (const card of cards) {
    const p = progress.get(card.id);
    if (!p) {
      fresh.push(card);
    } else if (isDue(p.state, now)) {
      due.push(card);
    }
  }

  const introduced = fresh.slice(0, Math.max(0, opts.newPerSession));
  return {
    cards: [...due, ...introduced],
    dueCount: due.length,
    newCount: introduced.length,
  };
}
