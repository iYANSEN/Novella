import { sourceRegistry } from './BaseSource';
import { RoyalRoadSource } from './sources/RoyalRoad';
import { NovelUpdatesSource } from './sources/NovelUpdates';

import { NovelUpdatesSource } from './sources/NovelUpdates';
import { AllNovelSource } from './sources/AllNovel';
import { AllNovelFullSource } from './sources/AllNovelFull';
import { LightNovelPubSource } from './sources/LightNovelPub';
import { LightNovelHeavenSource } from './sources/LightNovelHeaven';
import { NovelBinSource } from './sources/NovelBin';
import { NovelFireSource } from './sources/NovelFire';

let initialized = false;

export function initSources(): void {
  if (initialized) return;
  initialized = true;
  try {
    sourceRegistry.register(new RoyalRoadSource());
    sourceRegistry.register(new NovelUpdatesSource());
    
    sourceRegistry.register(new AllNovelSource());
    sourceRegistry.register(new AllNovelFullSource());
    sourceRegistry.register(new LightNovelPubSource());
    sourceRegistry.register(new LightNovelHeavenSource());
    sourceRegistry.register(new NovelBinSource());
  } catch (e) {
    console.warn('Source init failed:', e);
  }
}


export { sourceRegistry };
export * from './BaseSource';
