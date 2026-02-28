async function extractArticleLinks(html: string, baseUrl: string): Promise<string[]> {
  const $ = cheerio.load(html);
  const links: string[] = [];
  const base = new URL(baseUrl);

  // Patterns that indicate section/category pages (NOT articles)
  const sectionPatterns = [
    /^\/[^\/]+\/?$/,           // Single segment like /news/ or /sports/
    /^\/[^\/]+\/[^\/]+\/?$/,   // Two segments like /news/local/ or /sports/world/
    /^\/(tag|category|author|page|search|contact|about|site|privacy|terms)\b/i,
  ];

  // Patterns that indicate real articles
  const articlePatterns = [
    /article[_-]/i,           // article_uuid or article-slug
    /\/\d{4}\/\d{2}\//,      // Date-based URLs /2026/02/
    /\.html?$/i,              // Ends in .html
    /[a-z]+-[a-z]+-[a-z]+/,  // Slugified titles (at least 3 words)
  ];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    try {
      const url = new URL(href, baseUrl);
      if (url.hostname !== base.hostname) return;
      if (url.pathname === '/' || url.pathname.length < 10) return;

      // Skip obvious section pages
      const isSection = sectionPatterns.some(p => p.test(url.pathname));
      if (isSection && !articlePatterns.some(p => p.test(url.pathname))) return;

      // Prefer URLs that look like articles
      const looksLikeArticle = articlePatterns.some(p => p.test(url.pathname)) || url.pathname.split('/').filter(Boolean).length >= 3;
      if (looksLikeArticle) {
        links.push(url.href);
      }
    } catch {
      // Invalid URL, skip
    }
  });

  // Dedupe and return up to 20
  return [...new Set(links)].slice(0, 20);
}
