import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReaderSettings, AppSettings, DownloadTask, SourceInfo } from '@/types';
import { DEFAULT_READER_SETTINGS, DEFAULT_APP_SETTINGS } from '@/constants';

function persist<T>(key: string, value: T): void {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

function hydrate<T>(key: string, fallback: T): T {
  // Sync hydration is not possible with AsyncStorage; return fallback.
  return fallback;
}

async function hydrateAsync<T>(key: string, fallback: T): Promise<T> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

// ─── Reader Store ─────────────────────────────────────────────────────────────

interface ReaderState {
  settings: ReaderSettings;
  _hydrated: boolean;
  updateSettings: (partial: Partial<ReaderSettings>) => void;
  resetSettings: () => void;
  ttsActive: boolean;
  ttsParagraphIndex: number;
  setTtsActive: (active: boolean) => void;
  setTtsParagraphIndex: (index: number) => void;
  autoScrollActive: boolean;
  setAutoScrollActive: (active: boolean) => void;
  sleepTimerEnd: number | null;
  setSleepTimer: (minutes: number | null) => void;
  hydrate: () => Promise<void>;
}

export const useReaderStore = create<ReaderState>()(
  immer((set, get) => ({
    settings: { ...DEFAULT_READER_SETTINGS },
    _hydrated: false,
    updateSettings: (partial) => set((s) => {
      Object.assign(s.settings, partial);
      persist('reader_settings', s.settings);
    }),
    resetSettings: () => set((s) => {
      s.settings = { ...DEFAULT_READER_SETTINGS };
      persist('reader_settings', s.settings);
    }),
    ttsActive: false,
    ttsParagraphIndex: 0,
    setTtsActive: (active) => set((s) => { s.ttsActive = active; }),
    setTtsParagraphIndex: (idx) => set((s) => { s.ttsParagraphIndex = idx; }),
    autoScrollActive: false,
    setAutoScrollActive: (active) => set((s) => { s.autoScrollActive = active; }),
    sleepTimerEnd: null,
    setSleepTimer: (minutes) => set((s) => {
      s.sleepTimerEnd = minutes ? Date.now() + minutes * 60 * 1000 : null;
    }),
    hydrate: async () => {
      const settings = await hydrateAsync('reader_settings', DEFAULT_READER_SETTINGS);
      set((s) => { s.settings = settings; s._hydrated = true; });
    },
  }))
);

// ─── App Settings Store ───────────────────────────────────────────────────────

interface AppSettingsState {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  hydrate: () => Promise<void>;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  immer((set) => ({
    settings: { ...DEFAULT_APP_SETTINGS },
    updateSettings: (partial) => set((s) => {
      Object.assign(s.settings, partial);
      persist('app_settings', s.settings);
    }),
    hydrate: async () => {
      const settings = await hydrateAsync('app_settings', DEFAULT_APP_SETTINGS);
      set((s) => { s.settings = settings; });
    },
  }))
);

// ─── Sources Store ────────────────────────────────────────────────────────────

interface SourcesState {
  installed: SourceInfo[];
  enabled: string[];
  addSource: (info: SourceInfo) => void;
  removeSource: (id: string) => void;
  toggleSource: (id: string) => void;
  setInstalled: (sources: SourceInfo[]) => void;
}

export const useSourcesStore = create<SourcesState>()(
  immer((set) => ({
    installed: hydrate('installed_sources', []),
    enabled: hydrate('enabled_sources', []),
    addSource: (info) => set((s) => {
      const idx = s.installed.findIndex(x => x.id === info.id);
      if (idx >= 0) s.installed[idx] = info;
      else s.installed.push(info);
      if (!s.enabled.includes(info.id)) s.enabled.push(info.id);
      persist('installed_sources', s.installed);
      persist('enabled_sources', s.enabled);
    }),
    removeSource: (id) => set((s) => {
      s.installed = s.installed.filter(x => x.id !== id);
      s.enabled = s.enabled.filter(x => x !== id);
      persist('installed_sources', s.installed);
      persist('enabled_sources', s.enabled);
    }),
    toggleSource: (id) => set((s) => {
      const idx = s.enabled.indexOf(id);
      if (idx >= 0) s.enabled.splice(idx, 1);
      else s.enabled.push(id);
      persist('enabled_sources', s.enabled);
    }),
    setInstalled: (sources) => set((s) => {
      s.installed = sources;
      persist('installed_sources', sources);
    }),
  }))
);

// ─── Downloads Store ──────────────────────────────────────────────────────────

interface DownloadsState {
  queue: DownloadTask[];
  active: string[];
  addToQueue: (task: DownloadTask) => void;
  updateTask: (id: string, update: Partial<DownloadTask>) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
}

export const useDownloadsStore = create<DownloadsState>()(
  immer((set) => ({
    queue: [],
    active: [],
    addToQueue: (task) => set((s) => {
      if (!s.queue.find(t => t.id === task.id)) s.queue.push(task);
    }),
    updateTask: (id, update) => set((s) => {
      const task = s.queue.find(t => t.id === id);
      if (task) Object.assign(task, update);
      if (update.status === 'downloading' && !s.active.includes(id)) s.active.push(id);
      if (['completed', 'failed', 'paused'].includes(update.status ?? '')) {
        s.active = s.active.filter(x => x !== id);
      }
    }),
    removeTask: (id) => set((s) => {
      s.queue = s.queue.filter(t => t.id !== id);
      s.active = s.active.filter(x => x !== id);
    }),
    clearCompleted: () => set((s) => {
      s.queue = s.queue.filter(t => t.status !== 'completed');
    }),
  }))
);

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIState {
  readerMenuVisible: boolean;
  readerSettingsVisible: boolean;
  setReaderMenuVisible: (v: boolean) => void;
  setReaderSettingsVisible: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  readerMenuVisible: false,
  readerSettingsVisible: false,
  setReaderMenuVisible: (v) => set({ readerMenuVisible: v }),
  setReaderSettingsVisible: (v) => set({ readerSettingsVisible: v }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}));