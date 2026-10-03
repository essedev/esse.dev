import rss from '@astrojs/rss';
import type { APIRoute, GetStaticPaths } from 'astro';
import { languageCodes, navigation } from '../../lib/config';
import { getArticles } from '../../lib/content';
import { getSite } from '../../lib/site';

export const getStaticPaths: GetStaticPaths = () =>
	languageCodes.map((lang) => ({ params: { lang } }));

// Feed RSS degli articoli per lingua (/en/rss.xml, /it/rss.xml), dal più recente.
export const GET: APIRoute = async ({ params, site }) => {
	const lang = params.lang!;
	const text = await getSite(lang);
	const blog = `/${lang}/${navigation[lang].articles}`;
	return rss({
		title: `Simone Salerno · ${text.sections.articles}`,
		description: text.description,
		site: site!,
		customData: `<language>${lang}</language>`,
		items: (await getArticles(lang)).map((a) => ({
			title: a.text.title,
			description: a.text.description,
			pubDate: new Date(`${a.meta.date}T00:00:00Z`),
			link: `${blog}/${a.text.slug}`
		}))
	});
};
