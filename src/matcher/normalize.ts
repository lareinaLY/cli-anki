/**
 * Normalization pipeline for shell-command answers.
 *
 * The matcher only performs *mechanical* normalization (whitespace, quoting,
 * short-flag clusters, flag ordering). It deliberately does NOT attempt to
 * understand semantics — semantically equivalent answers are declared
 * explicitly by content authors via a card's `accept[]` list. This keeps
 * judging predictable and free of false positives.
 */

/**
 * Split a command line into tokens, honoring single/double quotes.
 * Surrounding quotes are stripped, so `"fix"`, `'fix'` and `fix` all yield
 * the same token. Quoted whitespace is preserved within a token.
 */
export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let hasContent = false;
  let quote: '"' | "'" | null = null;

  for (const ch of input.trim()) {
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      hasContent = true; // an empty "" is still a real (empty) token
    } else if (ch === ' ' || ch === '\t' || ch === '\n') {
      if (hasContent) {
        tokens.push(current);
        current = '';
        hasContent = false;
      }
    } else {
      current += ch;
      hasContent = true;
    }
  }

  if (hasContent) {
    tokens.push(current);
  }
  return tokens;
}

/**
 * Expand a clustered short-flag token into individual flags.
 * `-la` -> `-l -a`. Only applies to single-dash tokens of two or more
 * letters with no embedded `=` (so `--soft` and `--max-count=3` are untouched,
 * and a value-bearing short option like `-n10` is left intact).
 */
export function expandShortFlagClusters(tokens: string[]): string[] {
  const out: string[] = [];
  for (const token of tokens) {
    if (/^-[A-Za-z]{2,}$/.test(token)) {
      for (const letter of token.slice(1)) {
        out.push('-' + letter);
      }
    } else {
      out.push(token);
    }
  }
  return out;
}

/**
 * Produce a canonical string for a command line such that two answers that
 * differ only by flag ordering or short-flag clustering compare equal.
 *
 * Strategy: keep non-flag tokens (command words + positional arguments) in
 * their original order, and sort flag tokens (anything starting with `-`).
 * Flag *values* written as separate tokens (e.g. the message in `-m "fix"`)
 * are treated as positionals and therefore keep their order — which is
 * correct as long as both sides are written the same way.
 */
export function canonicalize(input: string): string {
  const tokens = expandShortFlagClusters(tokenize(input));
  const flags: string[] = [];
  const positionals: string[] = [];

  for (const token of tokens) {
    if (token.startsWith('-') && token !== '-') {
      flags.push(token);
    } else {
      positionals.push(token);
    }
  }

  flags.sort();
  return [...positionals, ...flags].join(' ');
}
