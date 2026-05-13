import { BaseSource } from './BaseSource';
import type { Novel, Chapter } from '@/types';
import { load } from 'cheerio';

export class AllNovel extends BaseSource {
  get id() { return 'allnovel'; }
  get name() { return 'AllNovel'; }
  get supportsSearch() { return true; }

  async fetchNovelDetails(url: string): Promise<Novel> {
    const res = await fetch(url);
    const html = await res.text();
    const $ = load(html);
    return {
      id: url,
      title: $('h1.entry-title').text().trim(),
      cover: $('.thumb img').attr('src') || '',
      description: $('.entry-content p').first().text().trim(),
      author: $('.author a').text().trim(),
      genre: $('.genres a').map((i, el) => $(el).text()).get(),
      status: $('.status').text().trim(),
      chapters: []
    };
  }

  async fetchChaptersList(novelUrl: string): Promise<Chapter[]> {
    const res = await fetch(novelUrl);
    const html = await res.text();
    const $ = load(html);
    const chapters: Chapter[] = [];
    $('.chapter-list a').each((i, el) => {
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
    const res = await fetch(url);
    const html = await res.text();
    const $ = load(html);
    return $('#chapter-content p').map((i, el) => $(el).text()).get().join('\n\n');
  }
}
