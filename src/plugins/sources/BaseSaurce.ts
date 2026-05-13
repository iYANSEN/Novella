import type { SourceInfo, SearchFilters, SearchResult, Novel, Chapter } from '@/types';

export abstract class BaseSource {
  abstract get id(): string;
  abstract get name(): string;
  abstract get supportsSearch(): boolean;
  
  abstract fetchNovelDetails(url: string): Promise<Novel>;
  abstract fetchChapterContent(url: string): Promise<string>;
  abstract fetchChaptersList(novelUrl: string): Promise<Chapter[]>;
  
  async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    // Default implementation – override if needed
    return [];
  }
}
