import type { SourcePlugin, SourceInfo, SearchFilters, SearchResult, Novel, Chapter } from '@/types';

// ─── Abstract Base Source ─────────────────────────────────────────────────────

export abstract class BaseSource implements SourcePlugin {
  abstract info: SourceInfo;

  abstract search(filters: SearchFilters): Promise<SearchResult>;
  abstract getNovelDetails(novelPath: string): Promise<Partial<Novel>>;
  abstract getChapterList(novelPath: string): Promise<Partial<Chapter>[]>;
  abstract getChapterContent(chapterPath: string): Promise<string>;
  abstract getPopular(page: number): Promise<SearchResult>;
  abstract getLatestUpdates(page: number): Promise<SearchResult>;

  // Utility: fetch with timeout and error handling
  protected async fetchHtml(url: string, options?: RequestInit): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
          ...options?.headers,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return res.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  // Utility: make absolute URL
  protected absoluteUrl(path: string): string {
    if (path.startsWith('http')) return path;
    if (path.startsWith('//')) return `https:${path}`;
    return `${this.info.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  // Utility: clean text
  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  }

  // Utility: make novel ID
  protected makeNovelId(novelPath: string): string {
    return `${this.info.id}:${novelPath}`;
  }

  // Utility: make chapter ID
  protected makeChapterId(novelId: string, chapterPath: string): string {
    return `${novelId}:${chapterPath}`;
  }
}

// ─── Source Registry ──────────────────────────────────────────────────────────

class SourceRegistry {
  private sources = new Map<string, SourcePlugin>();

  register(plugin: SourcePlugin): void {
    this.sources.set(plugin.info.id, plugin);
  }

  unregister(id: string): void {
    this.sources.delete(id);
  }

  get(id: string): SourcePlugin | undefined {
    return this.sources.get(id);
  }

  getAll(): SourcePlugin[] {
    return Array.from(this.sources.values());
  }

  getEnabled(enabledIds: string[]): SourcePlugin[] {
    return enabledIds.map(id => this.sources.get(id)).filter(Boolean) as SourcePlugin[];
  }
}

export const sourceRegistry = new SourceRegistry();
