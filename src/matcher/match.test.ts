import { describe, expect, it } from 'vitest';
import { judge } from './match';

describe('judge', () => {
  const answers = ['git reset --soft HEAD~1', 'git reset --soft HEAD^'];

  it('accepts the exact primary answer', () => {
    expect(judge('git reset --soft HEAD~1', answers).correct).toBe(true);
  });

  it('accepts a flag-reordered answer', () => {
    expect(judge('git reset HEAD~1 --soft', answers).correct).toBe(true);
  });

  it('accepts a declared equivalent from accept[]', () => {
    const r = judge('git reset --soft HEAD^', answers);
    expect(r.correct).toBe(true);
    expect(r.matchedAnswer).toBe('git reset --soft HEAD^');
  });

  it('rejects a wrong flag', () => {
    expect(judge('git reset --hard HEAD~1', answers).correct).toBe(false);
  });

  it('rejects an undeclared (even if semantically similar) variant', () => {
    // Not in accept[]; the matcher must not guess semantics.
    expect(judge('git reset --soft HEAD~2', answers).correct).toBe(false);
  });

  it('produces a token diff highlighting the wrong token', () => {
    const r = judge('git reset --hard HEAD~1', answers);
    const hard = r.diff.find((d) => d.text === '--hard');
    expect(hard?.ok).toBe(false);
    expect(r.diff.find((d) => d.text === 'git')?.ok).toBe(true);
  });
});
