import type { APIRoute } from 'astro';
import { featured, languageCodes, navigation } from '../../lib/config';
import { getArticles, getMethod, getNow, getPage, getProjects } from '../../lib/content';
import { getSite } from '../../lib/site';
import type { SiteDoc } from '../../agent/site-index';

// The site index for the agent's tools: every page with its data and its Markdown text, in
// all languages. It is generated at build time from the same collections as the pages, so
// the agent reads exactly what the site publishes, and nothing else.
export const GET: APIRoute = async () => {
	const docs: SiteDoc[] = [];
	for (const lang of languageCodes) {
		const routes = navigation[lang];
		for (const p of await getProjects(lang)) {
			docs.push({
				path: `/${lang}/${routes.projects}/${p.text.slug}`,
				lang,
				kind: 'project',
				title: p.text.title,
				summary: p.text.excerpt,
				tags: p.text.tags,
				status: p.meta.status,
				date: p.meta.created,
				featured: featured.projects.includes(p.id),
				repo: p.meta.repo,
				site: p.meta.site,
				why: p.text.why,
				previously: p.text.previously,
				body: p.entry.body ?? ''
			});
		}
		for (const a of await getArticles(lang)) {
			docs.push({
				path: `/${lang}/${routes.articles}/${a.text.slug}`,
				lang,
				kind: 'article',
				title: a.text.title,
				summary: a.text.excerpt,
				tags: a.text.tags,
				date: a.meta.date,
				body: a.entry.body ?? ''
			});
		}
		for (const m of await getMethod(lang)) {
			docs.push({
				path: `/${lang}/${routes.method}/${m.text.slug}`,
				lang,
				kind: 'method',
				title: m.text.title,
				summary: m.text.summary,
				tags: [],
				body: m.entry.body ?? ''
			});
		}
		for (const n of await getNow(lang)) {
			docs.push({
				path: `/${lang}/${routes.now}`,
				lang,
				kind: 'now',
				title: n.title,
				summary: n.project.text.title,
				tags: [],
				date: n.date,
				body: n.entry.body ?? ''
			});
		}
		const about = await getPage('about', lang);
		docs.push({
			path: `/${lang}/${routes.about}`,
			lang,
			kind: 'about',
			title: about.data.title,
			summary: (await getSite(lang)).sectionDescriptions.about,
			tags: [],
			body: about.body ?? ''
		});
	}
	return new Response(JSON.stringify(docs), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' }
	});
};
