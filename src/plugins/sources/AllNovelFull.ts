import { BaseSource } from './BaseSource';
import type { SourceInfo, Novel, Chapter } from '@/types';
import { load } from 'cheerio';

export class AllNovelFull extends BaseSource {
  get id() { return 'all-novel-full'; }
  get name() { return 'All Novel Full'; }
  get supportsSearch() { return true; }

  async fetchNovelDetails(url: string): Promise<Novel> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);
    return {
      id: url,
      title: $('.article-title').text().trim(),
      cover: $('.summary_image img').attr('src') || '',
      description: $('.summary__content').text().trim(),
      author: $('.author-content a').text().trim(),
      genre: $('.genres-content a').map((i, el) => $(el).text()).get(),
      status: $('.status-content').text().trim(),
      chapters: []
    };
  }

  async fetchChaptersList(novelUrl: string): Promise<Chapter[]> {
    const response = await fetch(novelUrl);
    const html = await response.text();
    const $ = load(html);
    const chapters: Chapter[] = [];
    $('.wp-manga-chapter a').each((i, el) => {
      chapters.push({
        id: $(el).attr('href')!,
        title: $(el).text().trim(),
        url: $(el).attr('href')!,
        index: i
      });
    });
    return chapters.reverse();
  }

  async fetchChapterContent(url: string): Promise<string> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);
    return $('.reading-content p').map((i, el) => $(el).text()).get().join('\n\n');
  }
}
