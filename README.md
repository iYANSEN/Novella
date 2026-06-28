A full-featured web novel reader for Android & iOS built with Expo / React Native.

## Features (Phase 1)

- 📚 Library management with reading status (Reading, Plan to Read, Completed, Dropped, On Hold)
- 🔍 Multi-source browsing — Royal Road, Novel Updates (extensible via plugin system)
- 📖 Full reader with WebView rendering
  - Light / Sepia / Dark / AMOLED themes
  - Adjustable font, size, line height, margins, paragraph spacing
  - Vertical / horizontal / paged scroll modes
  - Auto-scroll with adjustable speed
  - Full-screen mode
  - Progress bar and position saving
- 🔊 Text-to-Speech (TTS) with paragraph highlighting, speed, pitch control
- ⬇️ Offline download — chapters stored in SQLite + file system
- 🔖 Bookmarks with highlights and personal notes
- 📅 Reading history
- 📊 Reading statistics
- 🔔 Chapter update checking for followed novels
- ⚙️ Full settings panel

## Stack

- **Expo SDK 51** + Expo Router v3 (file-based routing)
- **React Native 0.74**
- **SQLite** (`expo-sqlite`) — all data stored locally, no server needed
- **Zustand** + **Immer** — state management
- **MMKV** — fast settings persistence
- **TanStack Query** — async data fetching + caching
- **FlashList** — high-performance lists
- **WebView** — chapter rendering (supports full HTML, custom CSS)
- **Cheerio** — HTML parsing for source plugins


## Adding a New Source(its more complicated than that, jst give it to ai and gicve him a working plugin that i made, they gonna know the rest)

Create a file in `src/plugins/sources/YourSource.ts`:

```typescript
import { BaseSource } from '../BaseSource';
import type { SourceInfo, SearchFilters, SearchResult, Novel, Chapter } from '@/types';

export class YourSource extends BaseSource {
  info: SourceInfo = {
    id: 'yoursource',
    name: 'Your Source',
    baseUrl: 'https://yoursource.com',
    lang: 'en',
    version: '1.0.0',
    isEnabled: true,
    isNsfw: false,
    categories: ['novels'],
  };

  async getPopular(page: number): Promise<SearchResult> { /* ... */ }
  async getLatestUpdates(page: number): Promise<SearchResult> { /* ... */ }
  async search(filters: SearchFilters): Promise<SearchResult> { /* ... */ }
  async getNovelDetails(novelPath: string): Promise<Partial<Novel>> { /* ... */ }
  async getChapterList(novelPath: string): Promise<Partial<Chapter>[]> { /* ... */ }
  async getChapterContent(chapterPath: string): Promise<string> { /* ... */ }
}
```

Then register it in `src/plugins/index.ts`:
```typescript
import { YourSource } from './sources/YourSource';
sourceRegistry.register(new YourSource());
```

## Project Structure

```
novella/
├── app/                    # Expo Router pages
│   ├── (tabs)/             # Bottom tab screens
│   ├── novel/[id].tsx      # Novel detail
│   ├── reader/[novelId]/[chapterId].tsx
│   ├── search.tsx
│   ├── bookmarks.tsx
│   ├── history.tsx
│   ├── downloads.tsx
│   ├── stats.tsx
│   └── settings/
├── src/
│   ├── components/
│   │   ├── reader/         # ReaderMenu, ReaderSettingsPanel, TTSBar
│   │   └── library/        # NovelCard
│   ├── screens/            # Screen components
│   ├── plugins/            # Source plugin system
│   │   └── sources/        # RoyalRoad, NovelUpdates, ...
│   ├── store/              # Zustand stores
│   ├── hooks/              # useDownloadManager, useTTS
│   ├── utils/              # database.ts, contentParser.ts
│   ├── types/              # TypeScript types
│   └── constants/          # Colors, themes, defaults
└── assets/
```

## Phase 2 Roadmap

- [ ] User accounts + cloud sync
- [ ] Chapter comments & reviews
- [ ] Reading clubs / groups
- [ ] Dictionary lookup (tap word)
- [ ] Machine translation integration
- [ ] Export bookmarks/highlights
- [ ] Sleep timer
- [ ] Custom CSS theming
- [ ] Author dashboard
- [ ] Push notifications for new chapters
