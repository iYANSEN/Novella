// Parses raw HTML chapter content into clean paragraphs and renders to RN

export interface ParsedContent {
  paragraphs: string[];       // clean text paragraphs for TTS
  html: string;               // sanitized HTML for WebView rendering
  wordCount: number;
}

// Clean and sanitize HTML for the reader WebView
export function parseChapterContent(raw: string): ParsedContent {
  if (!raw || raw.trim().length === 0) {
    return { paragraphs: [], html: '<p>No content available.</p>', wordCount: 0 };
  }

  let html = raw;

  // Remove dangerous tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  html = html.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
  html = html.replace(/<form[^>]*>.*?<\/form>/gi, '');

  // Remove ad-like elements by common class/id patterns
  html = html.replace(/<[^>]*(class|id)="[^"]*(?:ad[s]?|advertisement|sponsor|banner|popup|overlay)[^"]*"[^>]*>.*?<\/[^>]+>/gi, '');

  // Normalize breaks
  html = html.replace(/<br\s*\/?>/gi, '\n');
  html = html.replace(/&nbsp;/gi, ' ');

  // Extract text paragraphs for TTS
  const textContent = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const paragraphs = html
    .split(/<p[^>]*>|<\/p>|<br\s*\/?>|\n{2,}/gi)
    .map(p => p.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 10);

  const wordCount = textContent.split(/\s+/).filter(Boolean).length;

  return { paragraphs, html, wordCount };
}

// Build the full HTML document for WebView rendering
export function buildReaderHtml(content: string, settings: {
  theme: string;
  bg: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  marginH: number;
  marginV: number;
  paragraphSpacing: number;
  textAlign: string;
  fontWeight: string;
  ttsIndex?: number;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0">
<style>
  * { box-sizing: border-box; -webkit-text-size-adjust: none; }
  html, body {
    margin: 0; padding: 0;
    background-color: ${settings.bg};
    color: ${settings.textColor};
  }
  body {
    font-family: ${settings.fontFamily === 'system' ? '-apple-system, BlinkMacSystemFont, sans-serif' : settings.fontFamily};
    font-size: ${settings.fontSize}px;
    line-height: ${settings.lineHeight};
    font-weight: ${settings.fontWeight};
    text-align: ${settings.textAlign};
    padding: ${settings.marginV}px ${settings.marginH}px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  p {
    margin: 0 0 ${settings.paragraphSpacing}px 0;
    text-indent: 0;
  }
  p:first-child { margin-top: 0; }
  h1, h2, h3, h4, h5, h6 {
    color: ${settings.textColor};
    line-height: 1.3;
    margin: ${settings.paragraphSpacing * 1.5}px 0 ${settings.paragraphSpacing}px;
  }
  hr {
    border: none;
    border-top: 1px solid ${settings.textColor}30;
    margin: ${settings.paragraphSpacing * 2}px auto;
    width: 60%;
  }
  em { font-style: italic; }
  strong { font-weight: 700; }
  a { color: inherit; text-decoration: underline; pointer-events: none; }
  img { max-width: 100%; height: auto; display: block; margin: 8px auto; }
  blockquote {
    border-left: 3px solid ${settings.textColor}40;
    margin: ${settings.paragraphSpacing}px 0;
    padding-left: 16px;
    font-style: italic;
    color: ${settings.textColor}aa;
  }
  .tts-highlight {
    background-color: ${settings.textColor}20;
    border-radius: 2px;
  }
  /* Bottom padding for last paragraph */
  body::after {
    content: '';
    display: block;
    height: 80px;
  }
</style>
</head>
<body>
${content}
<script>
  // Communicate scroll position to React Native
  let lastPos = 0;
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const pos = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (Math.abs(pos - lastPos) > 0.01) {
        lastPos = pos;
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'scroll', position: pos }));
      }
    }, 200);
  });

  // Word tap for dictionary
  document.addEventListener('click', (e) => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'selection', text: sel.toString().trim() }));
    }
  });

  // Notify ready
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'ready' }));

  // Restore scroll position
  window.restorePosition = (pos) => {
    window.scrollTo(0, pos * (document.body.scrollHeight - window.innerHeight));
  };

  // TTS highlight
  window.highlightParagraph = (idx) => {
    document.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
    const paras = document.querySelectorAll('p');
    if (paras[idx]) {
      paras[idx].classList.add('tts-highlight');
      paras[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
</script>
</body>
</html>`;
}
