import { describe, expect, it } from 'vitest';
import { scenarios } from './loader';
import { judge } from '../matcher/match';

describe('bundled scenarios', () => {
  it('load and validate against the schema', () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it('have globally unique scenario ids', () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  const steps = scenarios.flatMap((s) =>
    s.steps.map((step, i) => [`${s.id}#${i + 1}`, step] as const),
  );

  it.each(steps)('step "%s" judges its own answer as correct', (_id, step) => {
    const answers = [step.answer, ...(step.accept ?? [])];
    expect(judge(step.answer, answers).correct).toBe(true);
    for (const alt of step.accept ?? []) {
      expect(judge(alt, answers).correct).toBe(true);
    }
  });
});
