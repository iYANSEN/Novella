import { BaseSource } from '../BaseSource';
import type { SourceInfo, SearchFilters, SearchResult, Novel, Chapter } from '@/types';
import { load } from 'cheerio';

export class NovelUpdatesSource extends BaseSource {
  info: SourceInfo = {
    id: 'novelupdates',
    name: 'Novel Updates',
    baseUrl: 'https://www.novelupdates.com',
    lang: 'en',
    version: '1.0.0',
    iconUrl: 'https://www.novelupdates.com/favicon.ico',
    isEnabled: true,
    isNsfw: false,
    description: 'Asian novel translations hub — LN, WN, and more',
    maintainer: 'Novella',
    categories: ['novels'],
  };

  async getPopular(page: number): Promise<SearchResult> {
    const html = await this.fetchHtml(`${this.info.baseUrl}/series-ranking/?rank=week&pg=${page}`);
    return this.parseSeriesList(html);
  }

  async getLatestUpdates(page: number): Promise<SearchResult> {
    const html = await this.fetchHtml(`${this.info.baseUrl}/latest-series/?pg=${page}`);
    return this.parseSeriesList(html);
  }

  async search(filters: SearchFilters): Promise<SearchResult> {
    const params = new URLSearchParams({ action: 'wp-manga-search-manga', title: filters.query ?? '' });
    const res = await fetch(`${this.info.baseUrl}/wp-admin/admin-ajax.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
      body: params.toString(),
    });
    const html = await res.text();
    return this.parseSeriesList(html, filters.page ?? 1);
  }

  async getNovelDetails(novelPath: string): Promise<Partial<Novel>> {
    const url = this.absoluteUrl(novelPath);
    const html = await this.fetchHtml(url);
    const $ = load(html);

    const title = $('div.seriestitlenu').text().trim();
    const author = $('div#showauthors a').map((_, el) => $(el).text().trim()).get().join(', ');
    const cover = $('div.seriesimg img').attr('src');
    const description = $('div#editdescription').text().trim();

    const genres = $('div#seriesgenre a').map((_, el) => $(el).text().trim()).get();
    const tags = $('div#showtags a').map((_, el) => $(el).text().trim()).get();
    const statusText = $('div#editstatus').text().toLowerCase();
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
      tags,
      status: status as any,
      language: 'en',
      url,
    };
  }

  async getChapterList(novelPath: string): Promise<Partial<Chapter>[]> {
    // NU links to external translators — we get translation groups
    const url = this.absoluteUrl(novelPath);
    const html = await this.fetchHtml(url);
    const $ = load(html);
    const novelId = this.makeNovelId(novelPath);

    // Get chapter list via the extender table
    const postId = $('input#mypostid').val() as string;
    if (!postId) return [];

    const chapHtml = await this.fetchHtml(`${this.info.baseUrl}/wp-admin/admin-ajax.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `action=nd_getchapters&mypostid=${postId}&mypostid2=0`,
    });

    const $c = load(chapHtml);
    const chapters: Partial<Chapter>[] = [];

    $c('li.sp_li_chp').each((i, el) => {
      const link = $c(el).find('a[href]').last();
      const href = link.attr('href');
      if (!href) return;
      const title = link.text().trim() || `Chapter ${i + 1}`;
      chapters.push({
        id: this.makeChapterId(novelId, href),
        novelId,
        sourceId: this.info.id,
        chapterPath: href,
        title: this.cleanText(title),
        number: chapters.length + 1,
        url: href,
        isRead: false,
        isDownloaded: false,
      });
    });

    return chapters.reverse();
  }

  async getChapterContent(chapterPath: string): Promise<string> {
    // NU links to external sites. We fetch the external chapter directly.
    const html = await this.fetchHtml(chapterPath);
    const $ = load(html);

    // Try common selectors for popular translator sites
    const selectors = [
      'div.entry-content', 'div#chapter-content', 'div.chapter-content',
      'div.post-content', 'div#content', 'article.post', 'div.reading-content',
      'div[itemprop="articleBody"]',
    ];

    for (const sel of selectors) {
      const el = $(sel);
      if (el.length && el.text().trim().length > 200) {
        $(`${sel} script, ${sel} style, ${sel} .ads, ${sel} .advertisement`).remove();
        return el.html() ?? '';
      }
    }

    // Fallback: get body text
    $('script, style, nav, footer, header, .ads').remove();
    return $('body').html() ?? '';
  }

  private parseSeriesList(html: string, _page = 1): SearchResult {
    const $ = load(html);
    const novels: Partial<Novel>[] = [];

    $('div.search_main_box_nu, div.col-lg-6.col-md-12').each((_, el) => {
      const link = $(el).find('div.search_title a, a.font-red-sunglo').first();
      const href = link.attr('href');
      if (!href) return;

      const title = link.text().trim();
      const cover = $(el).find('img').first().attr('src');
      const genres = $(el).find('div.search_genre a, div.genre_items a').map((_, g) => $(g).text().trim()).get();
      const desc = $(el).find('div.search_body_nu, div.desc').text().trim();

      novels.push({
        id: this.makeNovelId(href),
        sourceId: this.info.id,
        novelPath: href,
        title: this.cleanText(title),
        coverUrl: cover ? this.absoluteUrl(cover) : undefined,
        description: this.cleanText(desc).slice(0, 300),
        genres,
        tags: [],
        status: 'unknown',
        url: href,
        inLibrary: false,
      });
    });

    const hasNext = $('a.next_page, li.next a').length > 0;
    return { novels, hasNextPage: hasNext };
  }
}
