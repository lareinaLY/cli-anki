import { State } from 'ts-fsrs';
import type { Card } from '../content/types';
import type { CardProgress } from '../store/db';

/**
 * Mastery buckets for the wordbook overview, derived live from FSRS state:
 * - new      未学：还没复习过
 * - learning 学习中：处于学习/重新学习步骤
 * - young    巩固中：进入复习，但记忆还不牢（stability 较短）
 * - mature   已掌握：复习状态且 stability 已经很长
 */
export type Mastery = 'new' | 'learning' | 'young' | 'mature';

export const MASTERY_ORDER: readonly Mastery[] = ['new', 'learning', 'young', 'mature'];

/** Anki's convention: a card is "mature" once its interval reaches 21 days. */
const MATURE_STABILITY_DAYS = 21;

export interface WordbookEntry {
  card: Card;
  mastery: Mastery;
  /** Next review date, or null if never studied. */
  due: Date | null;
  /** FSRS difficulty (1–10, higher = harder for you), or null if new. */
  difficulty: number | null;
  reps: number;
}

export interface WordbookGroup {
  mastery: Mastery;
  entries: WordbookEntry[];
}

export function classifyMastery(progress: CardProgress | undefined): Mastery {
  if (!progress) return 'new';
  const { state, stability } = progress.state;
  if (state === State.New) return 'new';
  if (state === State.Learning || state === State.Relearning) return 'learning';
  return stability >= MATURE_STABILITY_DAYS ? 'mature' : 'young';
}

/** Group a deck's cards into mastery buckets (in display order). */
export function buildWordbook(
  cards: readonly Card[],
  progress: ReadonlyMap<string, CardProgress>,
): WordbookGroup[] {
  const buckets: Record<Mastery, WordbookEntry[]> = {
    new: [],
    learning: [],
    young: [],
    mature: [],
  };

  for (const card of cards) {
    const p = progress.get(card.id);
    const mastery = classifyMastery(p);
    buckets[mastery].push({
      card,
      mastery,
      due: p ? p.state.due : null,
      difficulty: p ? p.state.difficulty : null,
      reps: p?.reps ?? 0,
    });
  }

  return MASTERY_ORDER.map((mastery) => ({ mastery, entries: buckets[mastery] }));
}
