import type { APIRoute } from 'astro';
import { defaultLang, languages, navigation } from '../lib/config';
import { getArticles, getMethod, getProjects, getSlugMap } from '../lib/content';
import { getLanguageUrl } from '../lib/i18n';
import { escapeXml } from '../lib/xml';

// Sitemap with hreflang alternates for each language plus x-default, like the HTML: if the
// two annotations diverge Google may ignore them. lastmod comes from the content, not from
// the build.
export const GET: APIRoute = async ({ site }) => {
	const origin = site!.origin;
	const slugMap = await getSlugMap();
	const paths: { path: string; lastmod: string }[] = [];

	for (const { code: lang } of languages) {
		const projects = await getProjects(lang);
		const articles = await getArticles(lang);
		const latest = (dates: string[]) => dates.sort().at(-1);
		const lastProject = latest(projects.map((p) => p.meta.updated));
		const lastArticle = latest(articles.map((a) => a.meta.updated));
		const lastAny = latest([lastProject, lastArticle].filter((d): d is string => !!d));

		paths.push({ path: `/${lang}`, lastmod: lastAny ?? '' });
		paths.push({ path: `/${lang}/${navigation[lang].projects}`, lastmod: lastProject ?? '' });
		paths.push({ path: `/${lang}/${navigation[lang].articles}`, lastmod: lastArticle ?? '' });
		for (const section of ['method', 'now', 'about', 'agent'] as const) {
			paths.push({ path: `/${lang}/${navigation[lang][section]}`, lastmod: lastAny ?? '' });
		}
		for (const m of await getMethod(lang)) {
			paths.push({
				path: `/${lang}/${navigation[lang].method}/${m.text.slug}`,
				lastmod: lastAny ?? ''
			});
		}
		for (const p of projects) {
			paths.push({
				path: `/${lang}/${navigation[lang].projects}/${p.text.slug}`,
				lastmod: p.meta.updated
			});
		}
		for (const a of articles) {
			paths.push({
				path: `/${lang}/${navigation[lang].articles}/${a.text.slug}`,
				lastmod: a.meta.updated
			});
		}
	}

	const urls = paths
		.map(({ path, lastmod }) => {
			const alternates = languages.map((l) => ({
				hreflang: l.code,
				href: origin + getLanguageUrl({ pathname: path, navigation, slugMap, targetLang: l.code })
			}));
			const fallback = alternates.find((a) => a.hreflang === defaultLang) ?? alternates[0];
			const links = [...alternates, { hreflang: 'x-default', href: fallback.href }]
				.map(
					(a) =>
						`\n    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${escapeXml(a.href)}"/>`
				)
				.join('');
			return `  <url>\n    <loc>${escapeXml(origin + path)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${links}\n  </url>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
