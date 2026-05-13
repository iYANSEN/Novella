import { sourceRegistry } from './BaseSource';
import { RoyalRoadSource } from './sources/RoyalRoad';
import { NovelUpdatesSource } from './sources/NovelUpdates';

let initialized = false;

export function initSources(): void {
  if (initialized) return;
  initialized = true;
  sourceRegistry.register(new RoyalRoadSource());
  sourceRegistry.register(new NovelUpdatesSource());
}

export { sourceRegistry };
export * from './BaseSource';
