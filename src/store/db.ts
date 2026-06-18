import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ReviewState } from '../srs/scheduler';
import type { Card } from '../content/types';

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

/** A user-added card (the "生词本"). Extends Card with creation metadata. */
export interface UserCardRecord extends Card {
  createdAt: number;
}

interface CliAnkiDB extends DBSchema {
  progress: {
    key: string;
    value: CardProgress;
    indexes: { 'by-deck': string };
  };
  userCards: {
    key: string;
    value: UserCardRecord;
  };
}

const DB_NAME = 'cli-anki';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<CliAnkiDB>> | null = null;

function getDb(): Promise<IDBPDatabase<CliAnkiDB>> {
  dbPromise ??= openDB<CliAnkiDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const store = db.createObjectStore('progress', { keyPath: 'cardId' });
        store.createIndex('by-deck', 'deckId');
      }
      if (oldVersion < 2) {
        db.createObjectStore('userCards', { keyPath: 'id' });
      }
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

/** Save a new user card, assigning it a stable id and creation timestamp. */
export async function addUserCard(card: Omit<Card, 'id'>): Promise<UserCardRecord> {
  const record: UserCardRecord = {
    ...card,
    id: `user-${crypto.randomUUID()}`,
    createdAt: Date.now(),
  };
  await (await getDb()).put('userCards', record);
  return record;
}

/** All user cards, newest first. */
export async function getAllUserCards(): Promise<UserCardRecord[]> {
  const all = await (await getDb()).getAll('userCards');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteUserCard(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('userCards', id);
  // Drop its review progress too, so it fully disappears from the queue.
  await db.delete('progress', id);
}
