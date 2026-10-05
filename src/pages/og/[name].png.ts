import { Resvg } from '@resvg/resvg-js';
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import satori from 'satori';
import { languageCodes, navigation } from '../../lib/config';
import { getArticles, getProjects } from '../../lib/content';
import { formatDate, STATUS_KEY } from '../../lib/items';
import { OG_HEIGHT, OG_WIDTH, ogLayout, type OgData } from '../../lib/og';
import { getSite, translator } from '../../lib/site';

// OG images generated at build time, one per page: `home`, `listing-<section>-<language>`,
// `detail-<section>-<id>-<language>`. The name is deterministic and the layout rebuilds it
// without parsing. Prerendering runs in Node (astro.config.mjs) because resvg is native.

export const getStaticPaths: GetStaticPaths = async () => {
	const paths: { params: { name: string }; props: OgData }[] = [];
	const en = await getSite('en');
	paths.push({
		params: { name: 'home' },
		props: {
			command: 'whoami',
			title: 'Simone Salerno',
			excerpt: en.description,
			// The role is already in the excerpt: at the bottom it would be a duplicate.
			meta: []
		}
	});

	for (const lang of languageCodes) {
		const [text, t] = await Promise.all([getSite(lang), translator(lang)]);
		const routes = navigation[lang];
		paths.push({
			params: { name: `listing-projects-${lang}` },
			props: {
				command: `ls ${routes.projects}`,
				title: text.sections.projects,
				excerpt: text.sectionDescriptions.projects,
				meta: []
			}
		});
		paths.push({
			params: { name: `listing-blog-${lang}` },
			props: {
				command: `ls ${routes.articles}`,
				title: text.sections.articles,
				excerpt: text.sectionDescriptions.articles,
				meta: []
			}
		});
		for (const p of await getProjects(lang)) {
			paths.push({
				params: { name: `detail-projects-${p.id}-${lang}` },
				props: {
					command: `cat ${routes.projects}/${p.text.slug}.md`,
					title: p.text.title,
					excerpt: p.text.excerpt,
					meta: [t(STATUS_KEY[p.meta.status]).toLowerCase(), p.meta.created.slice(0, 4)],
					status: p.meta.status
				}
			});
		}
		for (const a of await getArticles(lang)) {
			paths.push({
				params: { name: `detail-blog-${a.id}-${lang}` },
				props: {
					command: `cat ${routes.articles}/${a.text.slug}.md`,
					title: a.text.title,
					excerpt: a.text.excerpt,
					meta: [formatDate(a.meta.date, lang), ...a.text.tags.slice(0, 2)]
				}
			});
		}
	}
	return paths;
};

// Satori reads woff and ttf, not woff2: Departure Mono also ships a woff version here.
const require = createRequire(import.meta.url);
const geist = (weight: number) =>
	readFileSync(
		require.resolve(`@fontsource/geist-sans/files/geist-sans-latin-${weight}-normal.woff`)
	);
// Prerendering runs from the project root: `import.meta.url` here would point to `dist/`.
const departure = () =>
	readFileSync(resolve(process.cwd(), 'src/assets/fonts/DepartureMono-Regular.woff'));

type Font = { name: string; data: Buffer; weight: 400 | 500; style: 'normal' };
let fonts: Font[] | null = null;

export const GET: APIRoute = async ({ props }) => {
	fonts ??= [
		{ name: 'Geist', data: geist(400), weight: 400, style: 'normal' },
		{ name: 'Geist', data: geist(500), weight: 500, style: 'normal' },
		{ name: 'Departure Mono', data: departure(), weight: 400, style: 'normal' }
	];
	const svg = await satori(ogLayout(props as OgData) as Parameters<typeof satori>[0], {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts
	});
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
