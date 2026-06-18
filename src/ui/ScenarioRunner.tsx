import { useEffect, useRef, useState } from 'react';
import type { Scenario, Step } from '../content/types';
import { judge, type JudgeResult } from '../matcher/match';
import { PromptView } from './PromptView';
import { Explanation } from './Explanation';

function StepView({ step, isLast, onNext }: { step: Step; isLast: boolean; onNext: () => void }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<JudgeResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const submit = () => {
    if (!input.trim() || result) return;
    setResult(judge(input, [step.answer, ...(step.accept ?? [])]));
  };

  const retry = () => {
    setResult(null);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <>
      <PromptView prompt={step.prompt} constraint={step.constraint} />

      <div className={`terminal ${result ? (result.correct ? 'ok' : 'bad') : ''}`}>
        <span className="dollar">$</span>
        {!result ? (
          <input
            ref={inputRef}
            className="cmd-input"
            value={input}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="输入命令，回车提交"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'Enter' && input.trim()) submit();
            }}
          />
        ) : (
          <span className="cmd-echo">
            {result.diff.map((t, i) => (
              <span key={i} className={t.ok ? 'tok-ok' : 'tok-bad'}>
                {t.text}{' '}
              </span>
            ))}
          </span>
        )}
      </div>

      {!result && (
        <button className="submit" disabled={!input.trim()} onClick={submit}>
          提交 ⏎
        </button>
      )}

      {result && (
        <div className="feedback">
          <p className={`verdict ${result.correct ? 'ok' : 'bad'}`}>
            {result.correct ? '✓ 正确' : '✗ 不对'}
          </p>
          {!result.correct && (
            <p className="answer">
              正确答案：<code>{step.answer}</code>
            </p>
          )}
          {step.explanation && <Explanation>{step.explanation}</Explanation>}
          {result.correct && step.narration && <p className="narration">{step.narration}</p>}

          <div className="step-actions">
            {!result.correct && (
              <button className="ghost" onClick={retry}>
                再试一次
              </button>
            )}
            <button className="submit" onClick={onNext}>
              {isLast ? '完成 ✓' : '下一步 →'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ScenarioRunner({
  scenario,
  stepIndex,
  onAdvance,
  onExit,
}: {
  scenario: Scenario;
  stepIndex: number;
  onAdvance: () => void;
  onExit: () => void;
}) {
  const total = scenario.steps.length;

  if (stepIndex >= total) {
    return (
      <div className="stage">
        <div className="done">
          <p className="done-emoji">🎉</p>
          <p>「{scenario.title}」完成！</p>
          <button className="submit" onClick={onExit}>
            返回场景列表
          </button>
        </div>
      </div>
    );
  }

  const step = scenario.steps[stepIndex];

  return (
    <div className="scenario">
      <div className="scenario-head">
        <button className="icon-btn" onClick={onExit}>
          ← 返回
        </button>
        <span className="scenario-title">{scenario.title}</span>
        <span className="scenario-progress">
          步骤 {stepIndex + 1} / {total}
        </span>
      </div>

      {stepIndex === 0 && <p className="scenario-intro">{scenario.intro}</p>}

      <StepView key={stepIndex} step={step} isLast={stepIndex === total - 1} onNext={onAdvance} />
    </div>
  );
}
