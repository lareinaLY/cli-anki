import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs';

/**
 * Thin wrapper around ts-fsrs (the algorithm Anki uses by default). The rest of
 * the app talks to this module instead of ts-fsrs directly, so the scheduling
 * library stays swappable and `now` is always injected (keeps it testable).
 */

// Fuzz disabled so intervals are deterministic — nicer for tests and previews.
const engine = fsrs(generatorParameters({ enable_fuzz: false }));

/** Per-card scheduling state we persist. Re-exported so storage can type it. */
export type ReviewState = FsrsCard;

/** The four grades a user can give an answer (excludes the internal "Manual"). */
export { Rating };
export type ReviewGrade = Grade;

/** Fresh state for a never-seen card. */
export function newState(now: Date): ReviewState {
  return createEmptyCard(now);
}

/** Apply a grade and return the next scheduling state. */
export function review(state: ReviewState, grade: ReviewGrade, now: Date): ReviewState {
  return engine.next(state, now, grade).card;
}

/** Whether a card with this state is due for review at `now`. */
export function isDue(state: ReviewState, now: Date): boolean {
  return state.due.getTime() <= now.getTime();
}

/**
 * Preview the next due date for each grade without committing — used to show
 * "下次复习: 3天 / 7天 / 15天" hints under the grade buttons.
 */
export function previewIntervals(state: ReviewState, now: Date): Record<ReviewGrade, Date> {
  const log = engine.repeat(state, now);
  return {
    [Rating.Again]: log[Rating.Again].card.due,
    [Rating.Hard]: log[Rating.Hard].card.due,
    [Rating.Good]: log[Rating.Good].card.due,
    [Rating.Easy]: log[Rating.Easy].card.due,
  };
}
