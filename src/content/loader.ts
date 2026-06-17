import yaml from 'js-yaml';
import { DeckSchema, type Deck } from './types';
import gitRaw from './git.yaml?raw';

/** Parse and validate a raw YAML deck string. Throws if it fails the schema. */
export function loadDeck(raw: string): Deck {
  return DeckSchema.parse(yaml.load(raw));
}

/** All decks bundled with the app. Add new decks (e.g. bash) here. */
export const decks: readonly Deck[] = [loadDeck(gitRaw)];

export function getDeck(id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}
