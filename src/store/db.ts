import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ReviewState } from '../srs/scheduler';

/**
 * Local-first persistence. All review progress lives in IndexedDB in the
 * browser — no account, no network. (A sync backend can be layered on later
 * without changing this interface.)
 */

export interface CardProgress {
  /** Card id (primary key). */
  cardId: string;
  deckId: string;
  /** Serialized ts-fsrs state; Dates survive IndexedDB structured clone. */
  state: ReviewState;
  /** Lifetime counters, for stats. */
  reps: number;
  lapses: number;
}

interface CliAnkiDB extends DBSchema {
  progress: {
    key: string;
    value: CardProgress;
    indexes: { 'by-deck': string };
  };
}

const DB_NAME = 'cli-anki';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CliAnkiDB>> | null = null;

function getDb(): Promise<IDBPDatabase<CliAnkiDB>> {
  dbPromise ??= openDB<CliAnkiDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore('progress', { keyPath: 'cardId' });
      store.createIndex('by-deck', 'deckId');
    },
  });
  return dbPromise;
}

export async function getProgress(cardId: string): Promise<CardProgress | undefined> {
  return (await getDb()).get('progress', cardId);
}

export async function getAllProgress(): Promise<CardProgress[]> {
  return (await getDb()).getAll('progress');
}

export async function putProgress(progress: CardProgress): Promise<void> {
  await (await getDb()).put('progress', progress);
}

/** Remove all stored progress — used by a "重置进度" action. */
export async function clearAllProgress(): Promise<void> {
  await (await getDb()).clear('progress');
}
