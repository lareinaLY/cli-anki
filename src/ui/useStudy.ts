import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Deck, Card } from '../content/types';
import { judge, type JudgeResult } from '../matcher/match';
import {
  newState,
  previewIntervals,
  review,
  type ReviewGrade,
  type ReviewState,
} from '../srs/scheduler';
import { buildQueue } from '../study/queue';
import {
  clearAllProgress,
  getAllProgress,
  getAllUserCards,
  putProgress,
  type CardProgress,
} from '../store/db';

const NEW_PER_SESSION = 10;

export type Phase = 'input' | 'graded';
export type Status = 'loading' | 'studying' | 'done' | 'empty';

export interface StudyApi {
  status: Status;
  deckTitle: string;
  dueCount: number;
  newCount: number;
  /** Cards remaining in the current queue, including the current one. */
  remaining: number;
  current: Card | null;
  phase: Phase;
  result: JudgeResult | null;
  /** Next-review date per grade, available once an answer is submitted. */
  intervals: Record<ReviewGrade, Date> | null;
  submit: (input: string) => void;
  grade: (grade: ReviewGrade) => void;
  restart: () => void;
  reset: () => Promise<void>;
  /** Live review state per card id, for the wordbook overview. */
  progress: ReadonlyMap<string, CardProgress>;
}

function answersFor(card: Card): string[] {
  return [card.answer, ...(card.accept ?? [])];
}

export function useStudy(deck: Deck): StudyApi {
  const [progress, setProgress] = useState<Map<string, CardProgress>>(new Map());
  const [userCards, setUserCards] = useState<Card[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [queue, setQueue] = useState<Card[]>([]);
  const [meta, setMeta] = useState({ dueCount: 0, newCount: 0 });
  const [index, setIndex] = useState(0);

  const [phase, setPhase] = useState<Phase>('input');
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [intervals, setIntervals] = useState<Record<ReviewGrade, Date> | null>(null);
  // State of the card currently being answered (its FSRS state before grading).
  const [currentState, setCurrentState] = useState<ReviewState | null>(null);

  // The review pool: bundled deck cards plus the user's 生词本 cards.
  const pool = useMemo<Card[]>(() => [...deck.cards, ...userCards], [deck.cards, userCards]);
  const userIds = useMemo(() => new Set(userCards.map((c) => c.id)), [userCards]);

  const buildFrom = useCallback((source: Map<string, CardProgress>, poolCards: Card[]) => {
    const q = buildQueue(poolCards, source, new Date(), { newPerSession: NEW_PER_SESSION });
    setQueue(q.cards);
    setMeta({ dueCount: q.dueCount, newCount: q.newCount });
    setIndex(0);
    setPhase('input');
    setResult(null);
    setIntervals(null);
  }, []);

  // Load persisted progress and user cards, then build the first session.
  useEffect(() => {
    let cancelled = false;
    void Promise.all([getAllProgress(), getAllUserCards()]).then(([records, ucards]) => {
      if (cancelled) return;
      const map = new Map(records.map((r) => [r.cardId, r]));
      const cards: Card[] = ucards;
      setProgress(map);
      setUserCards(cards);
      setLoaded(true);
      buildFrom(map, [...deck.cards, ...cards]);
    });
    return () => {
      cancelled = true;
    };
  }, [deck.cards, buildFrom]);

  const current = queue[index] ?? null;

  const submit = useCallback(
    (input: string) => {
      if (!current || phase !== 'input') return;
      const state = progress.get(current.id)?.state ?? newState(new Date());
      setCurrentState(state);
      setResult(judge(input, answersFor(current)));
      setIntervals(previewIntervals(state, new Date()));
      setPhase('graded');
    },
    [current, phase, progress],
  );

  const grade = useCallback(
    (g: ReviewGrade) => {
      if (!current || phase !== 'graded' || !currentState) return;
      const now = new Date();
      const nextState = review(currentState, g, now);
      const prev = progress.get(current.id);
      const record: CardProgress = {
        cardId: current.id,
        deckId: userIds.has(current.id) ? 'user' : deck.id,
        state: nextState,
        reps: (prev?.reps ?? 0) + 1,
        lapses: nextState.lapses,
      };
      void putProgress(record);

      setProgress((map) => new Map(map).set(current.id, record));
      setIndex((i) => i + 1);
      setPhase('input');
      setResult(null);
      setIntervals(null);
      setCurrentState(null);
    },
    [current, phase, currentState, progress, deck.id, userIds],
  );

  const restart = useCallback(() => buildFrom(progress, pool), [buildFrom, progress, pool]);

  const reset = useCallback(async () => {
    await clearAllProgress();
    const empty = new Map<string, CardProgress>();
    setProgress(empty);
    buildFrom(empty, pool);
  }, [buildFrom, pool]);

  const status: Status = useMemo(() => {
    if (!loaded) return 'loading';
    if (queue.length === 0) return 'empty';
    if (index >= queue.length) return 'done';
    return 'studying';
  }, [loaded, queue.length, index]);

  return {
    status,
    deckTitle: deck.title,
    dueCount: meta.dueCount,
    newCount: meta.newCount,
    remaining: Math.max(0, queue.length - index),
    current,
    phase,
    result,
    intervals,
    submit,
    grade,
    restart,
    reset,
    progress,
  };
}
