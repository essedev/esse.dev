import type { APIRoute } from 'astro';
import { defaultLang, languages, navigation } from '../lib/config';
import { getArticles, getMethod, getProjects, getShowcase } from '../lib/content';
import { getSite } from '../lib/site';

// /llms.txt (llmstxt.org): what the site is and where its pages are, for language models.
// Built from the same collections as the sitemap, in the default language; the other
// languages are linked at their root. The structured version is /agent/index.json.
export const GET: APIRoute = async ({ site }) => {
	const origin = site!.origin;
	const lang = defaultLang;
	const nav = navigation[lang];
	const text = await getSite(lang);
	const url = (...parts: string[]) => `${origin}/${[lang, ...parts].join('/')}`;
	const item = (title: string, href: string, note: string) => `- [${title}](${href}): ${note}`;

	const showcase = await getShowcase(lang);
	const featured = new Set(showcase.map((p) => p.id));
	const projects = [
		...showcase,
		...(await getProjects(lang)).filter((p) => !featured.has(p.id))
	].map((p) => item(p.text.title, url(nav.projects, p.text.slug), p.text.excerpt));
	const method = (await getMethod(lang)).map((m) =>
		item(m.text.title, url(nav.method, m.text.slug), m.text.summary)
	);
	const articles = (await getArticles(lang)).map((a) =>
		item(a.text.title, url(nav.articles, a.text.slug), a.text.description)
	);
	const pages = (['about', 'now', 'agent'] as const).map((s) =>
		item(text.sections[s], url(nav[s]), text.sectionDescriptions[s])
	);
	const others = languages
		.filter((l) => l.code !== lang)
		.map((l) => item(l.name, `${origin}/${l.code}`, 'the same pages in this language'));

	const body = [
		`# Simone Salerno, ${text.title}`,
		`> ${text.description}`,
		`Personal site at ${origin}. Each project and article has its own page; ${origin}/agent/index.json is the same content as structured data.`,
		`## Pages\n\n${pages.join('\n')}`,
		`## Projects\n\n${projects.join('\n')}`,
		`## Method\n\n${method.join('\n')}`,
		articles.length ? `## Writing\n\n${articles.join('\n')}` : '',
		others.length ? `## Optional\n\n${others.join('\n')}` : ''
	]
		.filter(Boolean)
		.join('\n\n');

	return new Response(`${body}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
