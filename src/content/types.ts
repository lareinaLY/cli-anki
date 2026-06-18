import { z } from 'zod';

/**
 * A single study card. `answer` is the canonical solution; `accept` holds any
 * additional, author-declared equivalent solutions (e.g. `git switch` vs
 * `git checkout`). The matcher compares against `answer` + `accept` only.
 */
export const CardSchema = z.object({
  id: z.string().min(1),
  /** Task line; may use role markup: `[动作]` verb, `{对象}` object. */
  prompt: z.string().min(1),
  /** Optional secondary "约束条件" line, dimmed under the prompt. Same markup. */
  constraint: z.string().optional(),
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

/**
 * One step in a scenario walkthrough. Like a card, but positional (no id) and
 * with an optional `narration` shown after a correct answer to set up the next
 * step ("现在多了个 .git 目录…").
 */
export const StepSchema = z.object({
  prompt: z.string().min(1),
  constraint: z.string().optional(),
  answer: z.string().min(1),
  accept: z.array(z.string()).optional(),
  explanation: z.string().optional(),
  narration: z.string().optional(),
});

export type Step = z.infer<typeof StepSchema>;

/** An ordered, story-driven workflow practiced start-to-finish. */
export const ScenarioSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Sets the scene before step 1. */
  intro: z.string().min(1),
  steps: z.array(StepSchema).min(1),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

export const ScenarioFileSchema = z.object({
  scenarios: z.array(ScenarioSchema).min(1),
});
