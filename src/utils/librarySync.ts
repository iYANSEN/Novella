import { getLibrary, upsertNovel, upsertChapters, getChapters } from './database';
import { sourceRegistry } from '@/plugins';
import type { Novel } from '@/types';

export interface SyncResult {
  novelId: string;
  novelTitle: string;
  newChapters: number;
  error?: string;
}

export interface SyncProgress {
  total: number;
  done: number;
  current: string;
}

/**
 * Syncs all library novels across all registered sources.
 * Detects new chapters, updates metadata, merges duplicates
 * (same novel from multiple sources by title matching).
 */
export async function syncLibrary(
  onProgress?: (p: SyncProgress) => void
): Promise<SyncResult[]> {
  const library = await getLibrary();
  const reading = library.filter(n => n.readingStatus === 'reading' || n.readingStatus === 'plan_to_read');
  const results: SyncResult[] = [];

  for (let i = 0; i < reading.length; i++) {
    const novel = reading[i];
    onProgress?.({ total: reading.length, done: i, current: novel.title });

    try {
      const source = sourceRegistry.get(novel.sourceId);
      if (!source) {
        results.push({ novelId: novel.id, novelTitle: novel.title, newChapters: 0, error: 'Source not available' });
        continue;
      }

      // Fetch fresh chapter list
      const [existing, fresh] = await Promise.all([
        getChapters(novel.id),
        source.getChapterList(novel.novelPath),
      ]);

      const existingPaths = new Set(existing.map(c => c.chapterPath));
      const newChapters = fresh.filter(c => !existingPaths.has((c as any).chapterPath));

      if (newChapters.length > 0) {
        await upsertChapters(newChapters as any);
        await upsertNovel({
          ...novel,
          totalChapters: existing.length + newChapters.length,
          updatedAt: Date.now(),
        });
      }

      results.push({ novelId: novel.id, novelTitle: novel.title, newChapters: newChapters.length });
    } catch (e) {
      results.push({ novelId: novel.id, novelTitle: novel.title, newChapters: 0, error: String(e) });
    }
  }

  onProgress?.({ total: reading.length, done: reading.length, current: '' });
  return results;
}

/**
 * Detects duplicate novels across sources (same title, different sourceId)
 * and merges them — keeping the one with more chapters as primary,
 * copying reading progress over.
 */
export async function detectAndMergeDuplicates(): Promise<number> {
  const library = await getLibrary();
  const byTitle = new Map<string, Novel[]>();

  for (const novel of library) {
    const key = novel.title.toLowerCase().trim();
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(novel);
  }

  let merged = 0;
  for (const [, group] of byTitle) {
    if (group.length < 2) continue;

    // Primary = most chapters or most recently read
    const primary = group.sort((a, b) =>
      (b.totalChapters ?? 0) - (a.totalChapters ?? 0) ||
      (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0)
    )[0];

    for (const duplicate of group.slice(1)) {
      // Copy reading progress to primary if duplicate is further ahead
      if ((duplicate.chaptersRead ?? 0) > (primary.chaptersRead ?? 0)) {
        await upsertNovel({
          ...primary,
          chaptersRead: duplicate.chaptersRead,
          lastReadChapterId: duplicate.lastReadChapterId,
          lastReadAt: duplicate.lastReadAt,
          readingStatus: duplicate.readingStatus,
        });
      }
      // Remove duplicate from library (don't delete, just un-library)
      await upsertNovel({ ...duplicate, inLibrary: false });
      merged++;
    }
  }
  return merged;
}