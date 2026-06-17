import { canonicalize, tokenize } from './normalize';

export interface TokenDiff {
  /** A token from the user's input. */
  text: string;
  /** Whether this token appears (by multiset membership) in the expected answer. */
  ok: boolean;
}

export interface JudgeResult {
  correct: boolean;
  /** The canonical answer that matched, if any. */
  matchedAnswer: string | null;
  /** Per-token diff of the user's raw input against the closest answer, for UI. */
  diff: TokenDiff[];
}

/**
 * Judge a user's input against one or more acceptable answers.
 *
 * @param input    Raw text the user typed.
 * @param answers  The canonical answer plus any author-declared equivalents.
 */
export function judge(input: string, answers: readonly string[]): JudgeResult {
  const canonicalInput = canonicalize(input);
  const matchedAnswer = answers.find((a) => canonicalize(a) === canonicalInput) ?? null;

  // Build a token diff against the first (primary) answer for feedback.
  const expectedTokens = tokenize(answers[0] ?? '');
  const remaining = new Map<string, number>();
  for (const t of expectedTokens) {
    remaining.set(t, (remaining.get(t) ?? 0) + 1);
  }

  const diff: TokenDiff[] = tokenize(input).map((text) => {
    const count = remaining.get(text) ?? 0;
    if (count > 0) {
      remaining.set(text, count - 1);
      return { text, ok: true };
    }
    return { text, ok: false };
  });

  return { correct: matchedAnswer !== null, matchedAnswer, diff };
}
