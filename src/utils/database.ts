import * as SQLite from 'expo-sqlite';
import type { Novel, Chapter, Bookmark, ReadingPosition, DownloadTask } from '@/types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('novella.db');
  await initSchema(db);
  return db;
}

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS novels (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      novel_path TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT,
      artist TEXT,
      cover_url TEXT,
      cover_local TEXT,
      description TEXT,
      genres TEXT DEFAULT '[]',
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'unknown',
      language TEXT,
      url TEXT NOT NULL,
      in_library INTEGER DEFAULT 0,
      reading_status TEXT,
      last_read_chapter_id TEXT,
      last_read_at INTEGER,
      added_to_library_at INTEGER,
      updated_at INTEGER,
      total_chapters INTEGER,
      chapters_read INTEGER DEFAULT 0,
      rating REAL,
      user_note TEXT
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      novel_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      chapter_path TEXT NOT NULL,
      title TEXT NOT NULL,
      number REAL,
      volume TEXT,
      url TEXT NOT NULL,
      published_at INTEGER,
      is_read INTEGER DEFAULT 0,
      read_at INTEGER,
      read_progress REAL DEFAULT 0,
      is_downloaded INTEGER DEFAULT 0,
      downloaded_at INTEGER,
      local_path TEXT,
      word_count INTEGER,
      translator TEXT,
      FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapter_content (
      chapter_id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      novel_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      chapter_title TEXT NOT NULL,
      novel_title TEXT NOT NULL,
      position INTEGER NOT NULL,
      selected_text TEXT NOT NULL,
      note TEXT,
      color TEXT DEFAULT 'yellow',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reading_positions (
      novel_id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      position REAL NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS download_tasks (
      id TEXT PRIMARY KEY,
      chapter_id TEXT NOT NULL,
      novel_id TEXT NOT NULL,
      chapter_title TEXT NOT NULL,
      novel_title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      progress REAL DEFAULT 0,
      added_at INTEGER NOT NULL,
      completed_at INTEGER,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS reading_history (
      id TEXT PRIMARY KEY,
      novel_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      novel_title TEXT NOT NULL,
      chapter_title TEXT NOT NULL,
      cover_url TEXT,
      read_at INTEGER NOT NULL,
      duration_seconds INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_novel ON bookmarks(novel_id);
    CREATE INDEX IF NOT EXISTS idx_history_read_at ON reading_history(read_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chapters_read ON chapters(novel_id, is_read);
  `);
}

// ─── Novel Operations ─────────────────────────────────────────────────────────

export async function upsertNovel(novel: Partial<Novel> & { id: string; sourceId: string; novelPath: string; title: string; url: string }): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT INTO novels (id, source_id, novel_path, title, author, artist, cover_url, cover_local,
      description, genres, tags, status, language, url, in_library, reading_status,
      last_read_chapter_id, last_read_at, added_to_library_at, updated_at,
      total_chapters, chapters_read, rating, user_note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, author=excluded.author, artist=excluded.artist,
      cover_url=excluded.cover_url, description=excluded.description,
      genres=excluded.genres, tags=excluded.tags, status=excluded.status,
      language=excluded.language, url=excluded.url, updated_at=excluded.updated_at,
      total_chapters=excluded.total_chapters
  `, [
    novel.id, novel.sourceId, novel.novelPath, novel.title,
    novel.author ?? null, novel.artist ?? null, novel.coverUrl ?? null, novel.coverLocal ?? null,
    novel.description ?? null,
    JSON.stringify(novel.genres ?? []), JSON.stringify(novel.tags ?? []),
    novel.status ?? 'unknown', novel.language ?? null, novel.url,
    novel.inLibrary ? 1 : 0, novel.readingStatus ?? null,
    novel.lastReadChapterId ?? null, novel.lastReadAt ?? null,
    novel.addedToLibraryAt ?? null, novel.updatedAt ?? Date.now(),
    novel.totalChapters ?? null, novel.chaptersRead ?? 0,
    novel.rating ?? null, novel.userNote ?? null,
  ]);
}

export async function getNovel(id: string): Promise<Novel | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM novels WHERE id = ?', [id]);
  return row ? rowToNovel(row) : null;
}

export async function getLibrary(): Promise<Novel[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM novels WHERE in_library = 1 ORDER BY last_read_at DESC');
  return rows.map(rowToNovel);
}

export async function addToLibrary(novelId: string, status = 'reading'): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE novels SET in_library = 1, reading_status = ?, added_to_library_at = ? WHERE id = ?',
    [status, Date.now(), novelId]
  );
}

export async function removeFromLibrary(novelId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE novels SET in_library = 0, reading_status = NULL WHERE id = ?', [novelId]);
}

export async function updateNovelRating(novelId: string, rating: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE novels SET rating = ? WHERE id = ?', [rating, novelId]);
}

export async function updateNovelNote(novelId: string, note: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE novels SET user_note = ? WHERE id = ?', [note, novelId]);
}

function rowToNovel(row: any): Novel {
  return {
    ...row,
    sourceId: row.source_id,
    novelPath: row.novel_path,
    coverUrl: row.cover_url,
    coverLocal: row.cover_local,
    genres: JSON.parse(row.genres || '[]'),
    tags: JSON.parse(row.tags || '[]'),
    inLibrary: row.in_library === 1,
    readingStatus: row.reading_status,
    lastReadChapterId: row.last_read_chapter_id,
    lastReadAt: row.last_read_at,
    addedToLibraryAt: row.added_to_library_at,
    updatedAt: row.updated_at,
    totalChapters: row.total_chapters,
    chaptersRead: row.chapters_read,
  };
}

// ─── Chapter Operations ───────────────────────────────────────────────────────

export async function upsertChapters(chapters: Array<Partial<Chapter> & { id: string; novelId: string; sourceId: string; chapterPath: string; title: string; url: string }>): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const ch of chapters) {
      await db.runAsync(`
        INSERT INTO chapters (id, novel_id, source_id, chapter_path, title, number, volume,
          url, published_at, is_read, read_at, read_progress, is_downloaded, downloaded_at,
          local_path, word_count, translator)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
          title=excluded.title, number=excluded.number, url=excluded.url,
          published_at=excluded.published_at, translator=excluded.translator
      `, [
        ch.id, ch.novelId, ch.sourceId, ch.chapterPath, ch.title,
        ch.number ?? null, ch.volume ?? null, ch.url,
        ch.publishedAt ?? null, ch.isRead ? 1 : 0,
        ch.readAt ?? null, ch.readProgress ?? 0,
        ch.isDownloaded ? 1 : 0, ch.downloadedAt ?? null,
        ch.localPath ?? null, ch.wordCount ?? null, ch.translator ?? null,
      ]);
    }
  });
}

export async function getChapters(novelId: string): Promise<Chapter[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM chapters WHERE novel_id = ? ORDER BY number ASC NULLS LAST, published_at ASC',
    [novelId]
  );
  return rows.map(rowToChapter);
}

export async function getChapter(id: string): Promise<Chapter | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM chapters WHERE id = ?', [id]);
  return row ? rowToChapter(row) : null;
}

export async function markChapterRead(chapterId: string, novelId: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.runAsync(
    'UPDATE chapters SET is_read = 1, read_at = ?, read_progress = 1 WHERE id = ?',
    [now, chapterId]
  );
  await db.runAsync(
    'UPDATE novels SET last_read_chapter_id = ?, last_read_at = ?, chapters_read = (SELECT COUNT(*) FROM chapters WHERE novel_id = ? AND is_read = 1) WHERE id = ?',
    [chapterId, now, novelId, novelId]
  );
}

export async function updateChapterProgress(chapterId: string, progress: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE chapters SET read_progress = ? WHERE id = ?', [progress, chapterId]);
}

function rowToChapter(row: any): Chapter {
  return {
    ...row,
    novelId: row.novel_id,
    sourceId: row.source_id,
    chapterPath: row.chapter_path,
    publishedAt: row.published_at,
    isRead: row.is_read === 1,
    readAt: row.read_at,
    readProgress: row.read_progress,
    isDownloaded: row.is_downloaded === 1,
    downloadedAt: row.downloaded_at,
    localPath: row.local_path,
    wordCount: row.word_count,
  };
}

// ─── Chapter Content ──────────────────────────────────────────────────────────

export async function saveChapterContent(chapterId: string, content: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO chapter_content (chapter_id, content, fetched_at) VALUES (?,?,?)',
    [chapterId, content, Date.now()]
  );
}

export async function getChapterContent(chapterId: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT content FROM chapter_content WHERE chapter_id = ?',
    [chapterId]
  );
  return row?.content ?? null;
}

export async function deleteChapterContent(chapterId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM chapter_content WHERE chapter_id = ?', [chapterId]);
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function addBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT INTO bookmarks (id, novel_id, chapter_id, chapter_title, novel_title, position, selected_text, note, color, created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `, [
    bookmark.id, bookmark.novelId, bookmark.chapterId, bookmark.chapterTitle,
    bookmark.novelTitle, bookmark.position, bookmark.selectedText,
    bookmark.note ?? null, bookmark.color ?? 'yellow', bookmark.createdAt,
  ]);
}

export async function getBookmarks(novelId?: string): Promise<Bookmark[]> {
  const db = await getDatabase();
  const rows = novelId
    ? await db.getAllAsync<any>('SELECT * FROM bookmarks WHERE novel_id = ? ORDER BY created_at DESC', [novelId])
    : await db.getAllAsync<any>('SELECT * FROM bookmarks ORDER BY created_at DESC');
  return rows.map(r => ({ ...r, novelId: r.novel_id, chapterId: r.chapter_id, chapterTitle: r.chapter_title, novelTitle: r.novel_title, selectedText: r.selected_text, createdAt: r.created_at }));
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
}

export async function updateBookmarkNote(id: string, note: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE bookmarks SET note = ? WHERE id = ?', [note, id]);
}

// ─── Reading Position ─────────────────────────────────────────────────────────

export async function saveReadingPosition(pos: ReadingPosition): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO reading_positions (novel_id, chapter_id, position, updated_at) VALUES (?,?,?,?)',
    [pos.novelId, pos.chapterId, pos.position, pos.updatedAt]
  );
}

export async function getReadingPosition(novelId: string): Promise<ReadingPosition | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM reading_positions WHERE novel_id = ?',
    [novelId]
  );
  return row ? { novelId: row.novel_id, chapterId: row.chapter_id, position: row.position, updatedAt: row.updated_at } : null;
}

// ─── Reading History ──────────────────────────────────────────────────────────

export async function addToHistory(entry: { novelId: string; chapterId: string; novelTitle: string; chapterTitle: string; coverUrl?: string; durationSeconds?: number }): Promise<void> {
  const db = await getDatabase();
  const id = `${entry.novelId}_${entry.chapterId}_${Date.now()}`;
  await db.runAsync(`
    INSERT OR REPLACE INTO reading_history (id, novel_id, chapter_id, novel_title, chapter_title, cover_url, read_at, duration_seconds)
    VALUES (?,?,?,?,?,?,?,?)
  `, [id, entry.novelId, entry.chapterId, entry.novelTitle, entry.chapterTitle, entry.coverUrl ?? null, Date.now(), entry.durationSeconds ?? 0]);
  // keep only last 500 entries
  await db.runAsync('DELETE FROM reading_history WHERE id NOT IN (SELECT id FROM reading_history ORDER BY read_at DESC LIMIT 500)');
}

export async function getHistory(limit = 50): Promise<any[]> {
  const db = await getDatabase();
  return db.getAllAsync<any>(
    'SELECT DISTINCT novel_id, novel_title, chapter_title, cover_url, MAX(read_at) as read_at FROM reading_history GROUP BY novel_id ORDER BY read_at DESC LIMIT ?',
    [limit]
  );
}

export async function clearHistory(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reading_history');
}

// ─── Download Tasks ───────────────────────────────────────────────────────────

export async function addDownloadTask(task: DownloadTask): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`
    INSERT OR IGNORE INTO download_tasks (id, chapter_id, novel_id, chapter_title, novel_title, status, progress, added_at)
    VALUES (?,?,?,?,?,?,?,?)
  `, [task.id, task.chapterId, task.novelId, task.chapterTitle, task.novelTitle, task.status, task.progress, task.addedAt]);
}

export async function updateDownloadTask(id: string, update: Partial<DownloadTask>): Promise<void> {
  const db = await getDatabase();
  if (update.status) await db.runAsync('UPDATE download_tasks SET status = ?, progress = ? WHERE id = ?', [update.status, update.progress ?? 0, id]);
}

export async function getPendingDownloads(): Promise<DownloadTask[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM download_tasks WHERE status IN (\'pending\', \'downloading\') ORDER BY added_at ASC');
  return rows.map(r => ({ ...r, chapterId: r.chapter_id, novelId: r.novel_id, chapterTitle: r.chapter_title, novelTitle: r.novel_title, addedAt: r.added_at, completedAt: r.completed_at }));
}

export async function getDownloadTasks(): Promise<DownloadTask[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM download_tasks ORDER BY added_at DESC LIMIT 200');
  return rows.map(r => ({ ...r, chapterId: r.chapter_id, novelId: r.novel_id, chapterTitle: r.chapter_title, novelTitle: r.novel_title, addedAt: r.added_at, completedAt: r.completed_at }));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getReadingStats(): Promise<{
  totalChaptersRead: number;
  totalNovelsStarted: number;
  totalNovelsCompleted: number;
  totalReadingDays: number;
  estimatedWordsRead: number;
}> {
  const db = await getDatabase();
  const chaptersRead = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM chapters WHERE is_read = 1');
  const novelsStarted = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM novels WHERE chapters_read > 0');
  const novelsCompleted = await db.getFirstAsync<any>('SELECT COUNT(*) as count FROM novels WHERE reading_status = \'completed\'');
  const readingDays = await db.getFirstAsync<any>('SELECT COUNT(DISTINCT date(read_at/1000, \'unixepoch\')) as count FROM chapters WHERE is_read = 1 AND read_at IS NOT NULL');
  const words = await db.getFirstAsync<any>('SELECT SUM(word_count) as total FROM chapters WHERE is_read = 1');

  return {
    totalChaptersRead: chaptersRead?.count ?? 0,
    totalNovelsStarted: novelsStarted?.count ?? 0,
    totalNovelsCompleted: novelsCompleted?.count ?? 0,
    totalReadingDays: readingDays?.count ?? 0,
    estimatedWordsRead: words?.total ?? 0,
  };
}
