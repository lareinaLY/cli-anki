import { z } from 'zod';

/**
 * A single study card. `answer` is the canonical solution; `accept` holds any
 * additional, author-declared equivalent solutions (e.g. `git switch` vs
 * `git checkout`). The matcher compares against `answer` + `accept` only.
 */
export const CardSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  answer: z.string().min(1),
  accept: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type Card = z.infer<typeof CardSchema>;

export const DeckSchema = z.object({
  /** Stable deck identifier, e.g. "git". */
  id: z.string().min(1),
  /** Human-facing deck title. */
  title: z.string().min(1),
  cards: z.array(CardSchema).min(1),
});

export type Deck = z.infer<typeof DeckSchema>;
