// ─── Novel & Chapter Types ───────────────────────────────────────────────────

export type NovelStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'unknown';
export type ReadingStatus = 'reading' | 'plan_to_read' | 'completed' | 'dropped' | 'on_hold';

export interface Novel {
  id: string;              // sourceId:novelPath
  sourceId: string;
  novelPath: string;       // source-specific identifier
  title: string;
  author?: string;
  artist?: string;
  coverUrl?: string;
  coverLocal?: string;     // local file path if downloaded
  description?: string;
  genres: string[];
  tags: string[];
  status: NovelStatus;
  language?: string;
  url: string;
  inLibrary: boolean;
  readingStatus?: ReadingStatus;
  lastReadChapterId?: string;
  lastReadAt?: number;     // timestamp
  addedToLibraryAt?: number;
  updatedAt?: number;
  totalChapters?: number;
  chaptersRead?: number;
  rating?: number;         // user rating 1-5
  userNote?: string;
}

export interface Chapter {
  id: string;              // novelId:chapterPath
  novelId: string;
  sourceId: string;
  chapterPath: string;
  title: string;
  number?: number;
  volume?: string;
  url: string;
  publishedAt?: number;
  isRead: boolean;
  readAt?: number;
  readProgress?: number;  // 0-1
  isDownloaded: boolean;
  downloadedAt?: number;
  localPath?: string;
  wordCount?: number;
  translator?: string;
}

export interface ChapterContent {
  chapterId: string;
  content: string;         // parsed HTML or plain text
  fetchedAt: number;
}

// ─── Bookmark & Annotation Types ─────────────────────────────────────────────

export interface Bookmark {
  id: string;
  novelId: string;
  chapterId: string;
  chapterTitle: string;
  novelTitle: string;
  position: number;        // character offset
  selectedText: string;
  note?: string;
  color?: BookmarkColor;
  createdAt: number;
}

export type BookmarkColor = 'yellow' | 'green' | 'blue' | 'pink' | 'purple';

export interface ReadingPosition {
  novelId: string;
  chapterId: string;
  position: number;        // scroll position or character offset
  updatedAt: number;
}

// ─── Source / Plugin Types ────────────────────────────────────────────────────

export interface SourceInfo {
  id: string;
  name: string;
  baseUrl: string;
  lang: string;
  version: string;
  iconUrl?: string;
  isEnabled: boolean;
  isNsfw: boolean;
  description?: string;
  maintainer?: string;
  categories: SourceCategory[];
}

export type SourceCategory = 'novels' | 'manhwa' | 'manhua' | 'manga' | 'fanfiction';

export interface SearchFilters {
  query?: string;
  genres?: string[];
  tags?: string[];
  status?: NovelStatus;
  language?: string;
  orderBy?: 'latest' | 'popular' | 'rating' | 'updated';
  page?: number;
}

export interface SearchResult {
  novels: Partial<Novel>[];
  hasNextPage: boolean;
  totalCount?: number;
}

export interface SourcePlugin {
  info: SourceInfo;
  search(filters: SearchFilters): Promise<SearchResult>;
  getNovelDetails(novelPath: string): Promise<Partial<Novel>>;
  getChapterList(novelPath: string): Promise<Partial<Chapter>[]>;
  getChapterContent(chapterPath: string): Promise<string>;
  getPopular(page: number): Promise<SearchResult>;
  getLatestUpdates(page: number): Promise<SearchResult>;
}

// ─── Reader Settings ──────────────────────────────────────────────────────────

export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'amoled' | 'custom';
export type ScrollDirection = 'vertical' | 'horizontal' | 'paged';
export type FontFamily = 'serif' | 'sans' | 'mono' | 'georgia' | 'palatino' | 'system';

export interface ReaderSettings {
  theme: ReaderTheme;
  customBg?: string;
  customText?: string;
  fontFamily: FontFamily;
  fontSize: number;        // 12-32
  lineHeight: number;      // 1.2-3.0
  marginHorizontal: number; // 8-64
  marginVertical: number;
  scrollDirection: ScrollDirection;
  autoScrollEnabled: boolean;
  autoScrollSpeed: number; // 1-10
  fullscreen: boolean;
  keepScreenOn: boolean;
  ttsEnabled: boolean;
  ttsSpeed: number;        // 0.5-2.0
  ttsPitch: number;        // 0.5-2.0
  ttsVoice?: string;
  showProgressBar: boolean;
  showChapterTitle: boolean;
  tapToScroll: boolean;
  volumeKeysScroll: boolean;
  swipeToChangePage: boolean;
  paragraphSpacing: number;
  textAlign: 'left' | 'justify' | 'right';
  fontWeight: '300' | '400' | '500' | '700';
}

// ─── Download Types ───────────────────────────────────────────────────────────

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';

export interface DownloadTask {
  id: string;
  chapterId: string;
  novelId: string;
  chapterTitle: string;
  novelTitle: string;
  status: DownloadStatus;
  progress: number;        // 0-1
  addedAt: number;
  completedAt?: number;
  error?: string;
}

// ─── App Settings ─────────────────────────────────────────────────────────────

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultReadingStatus: ReadingStatus;
  autoAddToLibrary: boolean;
  autoMarkRead: boolean;
  showNsfw: boolean;
  gridColumns: 2 | 3 | 4;
  coverAspectRatio: number;
  downloadOnWifiOnly: boolean;
  autoDownloadNewChapters: boolean;
  deleteReadChapters: boolean;
  backupEnabled: boolean;
  lastBackupAt?: number;
  notificationsEnabled: boolean;
  updateCheckInterval: 'manual' | 'daily' | 'weekly';
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  '(tabs)': undefined;
  'novel/[id]': { id: string; sourceId?: string };
  'reader/[novelId]/[chapterId]': { novelId: string; chapterId: string };
  'source/browse/[sourceId]': { sourceId: string };
  'search': { query?: string; sourceId?: string };
  'settings': undefined;
  'settings/reader': undefined;
  'settings/sources': undefined;
  'settings/download': undefined;
  'bookmarks': undefined;
  'history': undefined;
  'downloads': undefined;
  'stats': undefined;
};
