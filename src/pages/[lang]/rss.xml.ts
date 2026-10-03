import type { APIRoute, GetStaticPaths } from 'astro';
import { languageCodes, navigation } from '../../lib/config';
import { getArticles } from '../../lib/content';
import { escapeXml } from '../../lib/xml';
import { site } from '../../lib/site';

export const getStaticPaths: GetStaticPaths = () =>
	languageCodes.map((lang) => ({ params: { lang } }));

// Feed RSS degli articoli per lingua (/en/rss.xml, /it/rss.xml), dal più recente.
export const GET: APIRoute = async ({ params, site: origin }) => {
	const lang = params.lang!;
	const base = origin!.origin;
	const text = site(lang);
	const blogUrl = `${base}/${lang}/${navigation[lang].articles}`;
	const items = (await getArticles(lang))
		.map((a) => {
			const url = `${blogUrl}/${a.text.slug}`;
			return `
    <item>
      <title>${escapeXml(a.text.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${a.meta.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(a.text.description)}</description>
    </item>`;
		})
		.join('');

	const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(text.title)}</title>
    <link>${blogUrl}</link>
    <description>${escapeXml(text.description)}</description>
    <language>${lang}</language>
    <atom:link href="${base}/${lang}/rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>
`;
	return new Response(feed, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
