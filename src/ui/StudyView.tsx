import { useEffect, useRef, useState } from 'react';
import type { Card } from '../content/types';
import { Rating, type ReviewGrade } from '../srs/scheduler';
import type { JudgeResult } from '../matcher/match';
import { formatDue } from './format';

interface GradeButton {
  grade: ReviewGrade;
  label: string;
  hint: string;
  key: string;
}

const GRADES: Omit<GradeButton, 'hint'>[] = [
  { grade: Rating.Again, label: '重来', key: '1' },
  { grade: Rating.Hard, label: '有点难', key: '2' },
  { grade: Rating.Good, label: '记住了', key: '3' },
  { grade: Rating.Easy, label: '太简单', key: '4' },
];

interface Props {
  card: Card;
  phase: 'input' | 'graded';
  result: JudgeResult | null;
  intervals: Record<ReviewGrade, Date> | null;
  onSubmit: (input: string) => void;
  onGrade: (grade: ReviewGrade) => void;
}

export function StudyView({ card, phase, result, intervals, onSubmit, onGrade }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset the field and refocus whenever a new card appears.
  useEffect(() => {
    setInput('');
    inputRef.current?.focus();
  }, [card.id]);

  // After grading, allow 1–4 to pick a grade and Enter to take the default
  // (记住了 when correct, 重来 when wrong).
  useEffect(() => {
    if (phase !== 'graded' || !result) return;
    const handler = (e: KeyboardEvent) => {
      const hit = GRADES.find((g) => g.key === e.key);
      if (hit) {
        e.preventDefault();
        onGrade(hit.grade);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onGrade(result.correct ? Rating.Good : Rating.Again);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, result, onGrade]);

  const now = new Date();

  return (
    <section className="card">
      <p className="prompt">{card.prompt}</p>

      <div className={`terminal ${phase === 'graded' ? (result?.correct ? 'ok' : 'bad') : ''}`}>
        <span className="dollar">$</span>
        {phase === 'input' ? (
          <input
            ref={inputRef}
            className="cmd-input"
            value={input}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="在此输入命令，回车提交"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim()) onSubmit(input);
            }}
          />
        ) : (
          <span className="cmd-echo">
            {result?.diff.map((t, i) => (
              <span key={i} className={t.ok ? 'tok-ok' : 'tok-bad'}>
                {t.text}{' '}
              </span>
            ))}
          </span>
        )}
      </div>

      {phase === 'input' && (
        <button className="submit" disabled={!input.trim()} onClick={() => onSubmit(input)}>
          提交 ⏎
        </button>
      )}

      {phase === 'graded' && result && (
        <div className="feedback">
          <p className={`verdict ${result.correct ? 'ok' : 'bad'}`}>
            {result.correct ? '✓ 正确' : '✗ 不对'}
          </p>
          {!result.correct && (
            <p className="answer">
              正确答案：<code>{card.answer}</code>
            </p>
          )}
          {card.explanation && <p className="explanation">{card.explanation}</p>}

          <div className="grades">
            {GRADES.map((g) => (
              <button
                key={g.key}
                className={`grade grade-${g.key}`}
                onClick={() => onGrade(g.grade)}
              >
                <span className="grade-label">{g.label}</span>
                <span className="grade-hint">
                  {intervals ? formatDue(intervals[g.grade], now) : ''}
                </span>
                <span className="grade-key">{g.key}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
