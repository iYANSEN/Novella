import { BaseSource } from './BaseSource';
import type { SourceInfo, SearchFilters, SearchResult, Novel, Chapter } from '@/types';
import { load } from 'cheerio';

export class RoyalRoadSource extends BaseSource {
  info: SourceInfo = {
    id: 'royalroad',
    name: 'Royal Road',
    baseUrl: 'https://www.royalroad.com',
    lang: 'en',
    version: '1.0.0',
    iconUrl: 'https://www.royalroad.com/favicon.ico',
    isEnabled: true,
    isNsfw: false,
    description: 'Western web fiction platform with original stories',
    maintainer: 'Novella',
    categories: ['novels'],
  };

  async getPopular(page: number): Promise<SearchResult> {
    const html = await this.fetchHtml(`${this.info.baseUrl}/fictions/best-rated?page=${page}`);
    return this.parseNovelList(html);
  }

  async getLatestUpdates(page: number): Promise<SearchResult> {
    const html = await this.fetchHtml(`${this.info.baseUrl}/fictions/latest-updates?page=${page}`);
    return this.parseNovelList(html);
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    const params = new URLSearchParams();
    if (filters.query) params.set('title', filters.query);
    if (filters.status === 'completed') params.set('status', 'COMPLETED');
    if (filters.status === 'ongoing') params.set('status', 'ONGOING');
    params.set('page', String(filters.page ?? 1));
    const html = await this.fetchHtml(`${this.info.baseUrl}/fictions/search?${params}`);
    return this.parseNovelList(html);
  }

  async getNovelDetails(novelPath: string): Promise<Partial<Novel>> {
    const url = this.absoluteUrl(novelPath);
    const html = await this.fetchHtml(url);
    const $ = load(html);

    const title = $('h1.font-white').first().text().trim();
    const author = $('span[property="name"]').first().text().trim();
    const cover = $('img.thumbnail').first().attr('src') ?? $('div.cover-art img').first().attr('src');
    const description = $('div.description').find('p').map((_, el) => $(el).text().trim()).get().join('\n\n');
    const genres = $('span.tags a').map((_, el) => $(el).text().trim()).get();
    const statusText = $('span.label-default').text().toLowerCase();
    const status = statusText.includes('complete') ? 'completed' : statusText.includes('hiatus') ? 'hiatus' : 'ongoing';

    return {
      id: this.makeNovelId(novelPath),
      sourceId: this.info.id,
      novelPath,
      title: this.cleanText(title),
      author: this.cleanText(author),
      coverUrl: cover ? this.absoluteUrl(cover) : undefined,
      description: this.cleanText(description),
      genres,
      tags: [],
      status: status as any,
      url,
    };
  }

  async getChapterList(novelPath: string): Promise<Partial<Chapter>[]> {
    // RoyalRoad has chapters on the novel page in a table
    const url = this.absoluteUrl(novelPath);
    const html = await this.fetchHtml(url);
    const $ = load(html);
    const novelId = this.makeNovelId(novelPath);

    const chapters: Partial<Chapter>[] = [];
    $('table#chapters tbody tr').each((i, el) => {
      const link = $(el).find('a').first();
      const href = link.attr('href');
      if (!href) return;
      const title = link.text().trim();
      const dateText = $(el).find('time').attr('datetime') ?? '';
      chapters.push({
        id: this.makeChapterId(novelId, href),
        novelId,
        sourceId: this.info.id,
        chapterPath: href,
        title: this.cleanText(title),
        number: i + 1,
        url: this.absoluteUrl(href),
        publishedAt: dateText ? new Date(dateText).getTime() : undefined,
        isRead: false,
        isDownloaded: false,
      });
    });

    return chapters;
  }

  async getChapterContent(chapterPath: string): Promise<string> {
    const url = this.absoluteUrl(chapterPath);
    const html = await this.fetchHtml(url);
    const $ = load(html);

    // Remove ads and unwanted elements
    $('script, style, .ads, .advertisement, iframe, .author-note-portlet .well .bold').remove();

    const content = $('div.chapter-content');
    // Wrap paragraphs properly
    content.find('p').each((_, el) => {
      const text = $(el).html() ?? '';
      $(el).html(text);
    });

    return content.html() ?? '';
  }

  private parseNovelList(html: string): SearchResult {
    const $ = load(html);
    const novels: Partial<Novel>[] = [];

    $('div.fiction-list-item, div.row.fiction-item').each((_, el) => {
      const link = $(el).find('h2 a, h3 a').first();
      const href = link.attr('href');
      if (!href) return;

      const title = link.text().trim();
      const cover = $(el).find('img').first().attr('src');
      const author = $(el).find('span.author, .by-author').text().replace('by', '').trim();
      const tags = $(el).find('span.tags a, .fiction-tag').map((_, t) => $(t).text().trim()).get();
      const descEl = $(el).find('div.fiction-description, .description');
      const description = descEl.text().trim();

      novels.push({
        id: this.makeNovelId(href),
        sourceId: this.info.id,
        novelPath: href,
        title: this.cleanText(title),
        author: this.cleanText(author),
        coverUrl: cover ? this.absoluteUrl(cover) : undefined,
        description: this.cleanText(description).slice(0, 300),
        genres: tags,
        tags: [],
        status: 'unknown',
        url: this.absoluteUrl(href),
        inLibrary: false,
      });
    });

    const hasNext = $('li.next:not(.disabled), a[rel="next"]').length > 0;
    return { novels, hasNextPage: hasNext };
  }
}
