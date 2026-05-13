import { BaseSource } from './BaseSource';
import type { Novel, Chapter } from '@/types';
import { load } from 'cheerio';

export class LightNovelHeaven extends BaseSource {
  get id() { return 'light-novel-heaven'; }
  get name() { return 'Light Novel Heaven'; }
  get supportsSearch() { return true; }

  async fetchNovelDetails(url: string): Promise<Novel> {
    const res = await fetch(url);
    const html = await res.text();
    const $ = load(html);
    return {
      id: url,
      title: $('.single-title').text().trim(),
      cover: $('.summary img').attr('src') || '',
      description: $('.description').text().trim(),
      author: $('.author').text().replace('Author:', '').trim(),
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
    return $('.reading-content p').map((i, el) => $(el).text()).get().join('\n\n');
  }
}
