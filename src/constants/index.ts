import type { ReaderSettings, AppSettings } from '@/types';

// ─── App Colors ───────────────────────────────────────────────────────────────

export const COLORS = {
  primary: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryDark: '#5b21b6',

  dark: {
    bg: '#0d0d14',
    card: '#16151f',
    border: '#2a2840',
    text: '#f0eeff',
    textMid: '#9b95c4',
    textDim: '#4e4a6b',
    surface: '#1e1c2e',
    accent: '#7c3aed',
  },
  light: {
    bg: '#f8f7ff',
    card: '#ffffff',
    border: '#e8e5f5',
    text: '#1a1828',
    textMid: '#5c5880',
    textDim: '#9b98b8',
    surface: '#f0eeff',
    accent: '#7c3aed',
  },
} as const;

// ─── Reader Themes ────────────────────────────────────────────────────────────

export const READER_THEMES = {
  light: {
    bg: '#ffffff',
    text: '#1a1a1a',
    ui: '#f5f5f5',
    uiText: '#333',
  },
  sepia: {
    bg: '#f8f0e3',
    text: '#3d2b1f',
    ui: '#ede0cd',
    uiText: '#5c3d2e',
  },
  dark: {
    bg: '#1a1a2e',
    text: '#e0deff',
    ui: '#16213e',
    uiText: '#a0a8d8',
  },
  amoled: {
    bg: '#000000',
    text: '#e8e8e8',
    ui: '#111111',
    uiText: '#aaaaaa',
  },
} as const;

// ─── Font Families ────────────────────────────────────────────────────────────

export const FONT_FAMILIES = {
  serif: 'serif',
  sans: 'sans-serif',
  mono: 'monospace',
  georgia: 'Georgia',
  palatino: 'Palatino',
  system: undefined,
} as const;

// ─── Default Settings ─────────────────────────────────────────────────────────

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: 'dark',
  fontFamily: 'serif',
  fontSize: 17,
  lineHeight: 1.8,
  marginHorizontal: 20,
  marginVertical: 16,
  scrollDirection: 'vertical',
  autoScrollEnabled: false,
  autoScrollSpeed: 3,
  fullscreen: false,
  keepScreenOn: true,
  ttsEnabled: false,
  ttsSpeed: 1.0,
  ttsPitch: 1.0,
  showProgressBar: true,
  showChapterTitle: true,
  tapToScroll: false,
  volumeKeysScroll: true,
  swipeToChangePage: true,
  paragraphSpacing: 16,
  textAlign: 'left',
  fontWeight: '400',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  defaultReadingStatus: 'reading',
  autoAddToLibrary: true,
  autoMarkRead: true,
  showNsfw: false,
  gridColumns: 3,
  coverAspectRatio: 1.5,
  downloadOnWifiOnly: true,
  autoDownloadNewChapters: false,
  deleteReadChapters: false,
  backupEnabled: false,
  notificationsEnabled: true,
  updateCheckInterval: 'daily',
};

// ─── Genre Tags ───────────────────────────────────────────────────────────────

export const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Isekai', 'Josei', 'Martial Arts', 'Mature', 'Mecha', 'Mystery',
  'Psychological', 'Romance', 'School Life', 'Sci-Fi', 'Seinen',
  'Shoujo', 'Shounen', 'Slice of Life', 'Sports', 'Supernatural',
  'Tragedy', 'Wuxia', 'Xianxia', 'Xuanhuan', 'Yaoi', 'Yuri',
] as const;

export const DOWNLOAD_DIR = 'novella_downloads';
export const COVERS_DIR = 'novella_covers';
export const BACKUP_DIR = 'novella_backups';

export const MAX_CONCURRENT_DOWNLOADS = 3;
export const CACHE_STALE_TIME = 1000 * 60 * 5; // 5 min
export const CHAPTER_CACHE_TIME = 1000 * 60 * 60; // 1 hour
