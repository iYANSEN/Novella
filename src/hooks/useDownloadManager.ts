import { useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { useDownloadsStore } from '@/store';
import { sourceRegistry } from '@/plugins';
import { saveChapterContent, addDownloadTask, updateDownloadTask, getChapterContent } from '@/utils/database';
import type { Chapter, Novel, DownloadTask } from '@/types';
import { MAX_CONCURRENT_DOWNLOADS, DOWNLOAD_DIR } from '@/constants';

const downloadDir = `${FileSystem.documentDirectory}${DOWNLOAD_DIR}/`;

async function ensureDir(path: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
}

export function useDownloadManager() {
  const { queue, active, addToQueue, updateTask, removeTask } = useDownloadsStore();

  const downloadChapter = useCallback(async (chapter: Chapter, novel: Novel): Promise<void> => {
    if (chapter.isDownloaded) return;
    if (queue.find(t => t.chapterId === chapter.id)) return;

    const task: DownloadTask = {
      id: `dl_${chapter.id}`,
      chapterId: chapter.id,
      novelId: chapter.novelId,
      chapterTitle: chapter.title,
      novelTitle: novel.title,
      status: 'pending',
      progress: 0,
      addedAt: Date.now(),
    };

    addToQueue(task);
    await addDownloadTask(task);
    processQueue();
  }, [queue]);

  const downloadChapters = useCallback(async (chapters: Chapter[], novel: Novel): Promise<void> => {
    for (const ch of chapters) {
      if (ch.isDownloaded) continue;
      const task: DownloadTask = {
        id: `dl_${ch.id}`,
        chapterId: ch.id,
        novelId: ch.novelId,
        chapterTitle: ch.title,
        novelTitle: novel.title,
        status: 'pending',
        progress: 0,
        addedAt: Date.now(),
      };
      addToQueue(task);
      await addDownloadTask(task);
    }
    processQueue();
  }, [queue]);

  const processQueue = useCallback(async (): Promise<void> => {
    const { queue, active } = useDownloadsStore.getState();
    const available = MAX_CONCURRENT_DOWNLOADS - active.length;
    if (available <= 0) return;

    const pending = queue.filter(t => t.status === 'pending').slice(0, available);

    for (const task of pending) {
      executeDownload(task);
    }
  }, []);

  const executeDownload = async (task: DownloadTask): Promise<void> => {
    updateTask(task.id, { status: 'downloading', progress: 0.1 });
    await updateDownloadTask(task.id, { status: 'downloading', progress: 0.1 });

    try {
      const source = sourceRegistry.get(task.chapterId.split(':')[0]);
      if (!source) throw new Error('Source not found');

      const chapterPath = task.chapterId.split(':').slice(1).join(':');
      updateTask(task.id, { progress: 0.3 });

      const content = await source.getChapterContent(chapterPath);
      updateTask(task.id, { progress: 0.7 });

      // Save to SQLite
      await saveChapterContent(task.chapterId, content);

      // Optionally save to file for large content
      await ensureDir(`${downloadDir}${task.novelId}/`);
      const filePath = `${downloadDir}${task.novelId}/${task.chapterId.replace(/[:/]/g, '_')}.html`;
      await FileSystem.writeAsStringAsync(filePath, content, { encoding: FileSystem.EncodingType.UTF8 });

      updateTask(task.id, { status: 'completed', progress: 1 });
      await updateDownloadTask(task.id, { status: 'completed', progress: 1 });

      // Process next in queue
      processQueue();
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      updateTask(task.id, { status: 'failed', error });
      await updateDownloadTask(task.id, { status: 'failed' });
      processQueue();
    }
  };

  const retryFailed = useCallback(() => {
    const { queue } = useDownloadsStore.getState();
    queue.filter(t => t.status === 'failed').forEach(t => {
      updateTask(t.id, { status: 'pending', progress: 0, error: undefined });
    });
    processQueue();
  }, []);

  const cancelDownload = useCallback((taskId: string) => {
    removeTask(taskId);
  }, []);

  return {
    queue,
    active,
    downloadChapter,
    downloadChapters,
    retryFailed,
    cancelDownload,
  };
}

// Check if a chapter is available offline
export async function isChapterOffline(chapterId: string): Promise<boolean> {
  const content = await getChapterContent(chapterId);
  if (content) return true;
  const filePath = `${downloadDir}${chapterId.replace(/[:/]/g, '_')}.html`;
  const info = await FileSystem.getInfoAsync(filePath);
  return info.exists;
}

// Get chapter content (offline-first)
export async function getChapterContentOfflineFirst(chapterId: string, chapterPath: string, sourceId: string): Promise<string> {
  // Try DB first
  const cached = await getChapterContent(chapterId);
  if (cached) return cached;

  // Try file system
  const parts = chapterId.split(':');
  const novelId = parts.slice(0, 2).join(':');
  const filePath = `${downloadDir}${novelId}/${chapterId.replace(/[:/]/g, '_')}.html`;
  const info = await FileSystem.getInfoAsync(filePath);
  if (info.exists) {
    const content = await FileSystem.readAsStringAsync(filePath);
    await saveChapterContent(chapterId, content); // cache in DB
    return content;
  }

  // Fetch from source
  const source = sourceRegistry.get(sourceId);
  if (!source) throw new Error(`Source ${sourceId} not available`);
  const content = await source.getChapterContent(chapterPath);
  await saveChapterContent(chapterId, content);
  return content;
}
