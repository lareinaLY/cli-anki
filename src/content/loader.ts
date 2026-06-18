import yaml from 'js-yaml';
import { DeckSchema, ScenarioFileSchema, type Deck, type Scenario } from './types';
import gitRaw from './git.yaml?raw';
import shellRaw from './shell.yaml?raw';
import scenariosRaw from './scenarios.yaml?raw';

/** Parse and validate a raw YAML deck string. Throws if it fails the schema. */
export function loadDeck(raw: string): Deck {
  return DeckSchema.parse(yaml.load(raw));
}

/** All decks bundled with the app. */
export const decks: readonly Deck[] = [loadDeck(gitRaw), loadDeck(shellRaw)];

export function getDeck(id: string): Deck | undefined {
  return decks.find((d) => d.id === id);
}

/** Parse and validate a raw YAML scenarios file. */
export function loadScenarios(raw: string): Scenario[] {
  return ScenarioFileSchema.parse(yaml.load(raw)).scenarios;
}

/** All scenario walkthroughs bundled with the app. */
export const scenarios: readonly Scenario[] = loadScenarios(scenariosRaw);

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}
