import { useState } from 'react';
import { scenarios } from '../content/loader';
import type { Card } from '../content/types';
import { AiPanel } from './AiPanel';
import { ScenarioRunner } from './ScenarioRunner';

function ScenarioList({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="scenario-list">
      <h2 className="list-title">场景练习</h2>
      <p className="list-sub">把零散命令串成真实工作流，跟着剧情一步步走完。</p>
      <div className="scenario-grid">
        {scenarios.map((s) => (
          <button key={s.id} className="scenario-card" onClick={() => onPick(s.id)}>
            <span className="sc-title">{s.title}</span>
            <span className="sc-intro">{s.intro}</span>
            <span className="sc-meta">{s.steps.length} 步 →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 场景练习 mode: pick a scenario, then step through it as a guided workflow. */
export function ScenarioMode() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const active = scenarios.find((s) => s.id === activeId) ?? null;

  const start = (id: string) => {
    setActiveId(id);
    setStepIndex(0);
  };
  const exit = () => {
    setActiveId(null);
    setStepIndex(0);
  };

  // The current step, exposed to the AI panel as a card so questions are in context.
  const contextCard: Card | null =
    active && stepIndex < active.steps.length
      ? { id: `${active.id}#${stepIndex}`, ...active.steps[stepIndex] }
      : null;

  return (
    <>
      <section className="mode-col">
        {active ? (
          <ScenarioRunner
            scenario={active}
            stepIndex={stepIndex}
            onAdvance={() => setStepIndex((i) => i + 1)}
            onExit={exit}
          />
        ) : (
          <ScenarioList onPick={start} />
        )}
      </section>

      <AiPanel card={contextCard} />
    </>
  );
}
