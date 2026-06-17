import { describe, expect, it } from 'vitest';
import { canonicalize, expandShortFlagClusters, tokenize } from './normalize';

describe('tokenize', () => {
  it('splits on whitespace', () => {
    expect(tokenize('git reset --soft HEAD~1')).toEqual(['git', 'reset', '--soft', 'HEAD~1']);
  });

  it('collapses extra whitespace', () => {
    expect(tokenize('  git   status  ')).toEqual(['git', 'status']);
  });

  it('strips matching quotes and preserves quoted spaces', () => {
    expect(tokenize('git commit -m "fix the bug"')).toEqual([
      'git',
      'commit',
      '-m',
      'fix the bug',
    ]);
  });

  it('treats single and double quotes equivalently', () => {
    expect(tokenize("commit -m 'x'")).toEqual(tokenize('commit -m "x"'));
  });
});

describe('expandShortFlagClusters', () => {
  it('expands a cluster of short flags', () => {
    expect(expandShortFlagClusters(['-la'])).toEqual(['-l', '-a']);
  });

  it('leaves long flags untouched', () => {
    expect(expandShortFlagClusters(['--soft'])).toEqual(['--soft']);
  });

  it('leaves value-bearing short options untouched', () => {
    expect(expandShortFlagClusters(['-n10'])).toEqual(['-n10']);
  });
});

describe('canonicalize', () => {
  it('is order-independent for flags', () => {
    expect(canonicalize('git reset HEAD~1 --soft')).toBe(canonicalize('git reset --soft HEAD~1'));
  });

  it('treats clustered and separate short flags as equal', () => {
    expect(canonicalize('ls -la')).toBe(canonicalize('ls -l -a'));
    expect(canonicalize('ls -la')).toBe(canonicalize('ls -a -l'));
  });

  it('ignores quoting differences', () => {
    expect(canonicalize('git commit -m "fix"')).toBe(canonicalize("git commit -m fix"));
  });

  it('keeps positional argument order significant', () => {
    expect(canonicalize('cp a b')).not.toBe(canonicalize('cp b a'));
  });
});
