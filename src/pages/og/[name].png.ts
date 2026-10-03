import { Resvg } from '@resvg/resvg-js';
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import satori from 'satori';
import { languageCodes } from '../../lib/config';
import { getArticles, getProjects } from '../../lib/content';
import { OG_HEIGHT, OG_WIDTH, ogLayout } from '../../lib/og';
import { site } from '../../lib/site';

// Immagini OG generate a build, una per pagina: `home`, `listing-<sezione>-<lingua>`,
// `detail-<sezione>-<id>-<lingua>`. Il nome è deterministico e il layout lo ricostruisce
// senza parsing. Il prerender gira in Node (astro.config.mjs) perché resvg è nativo.

type OgProps = {
	label: string;
	title: string;
	excerpt?: string;
};

export const getStaticPaths: GetStaticPaths = async () => {
	const paths: { params: { name: string }; props: OgProps }[] = [];
	const en = site('en');
	paths.push({
		params: { name: 'home' },
		props: {
			label: 'esse.dev',
			title: 'Simone Salerno',
			excerpt: en.description
		}
	});

	for (const lang of languageCodes) {
		const text = site(lang);
		paths.push({
			params: { name: `listing-projects-${lang}` },
			props: { label: 'esse.dev', title: text.sections.projects }
		});
		paths.push({
			params: { name: `listing-blog-${lang}` },
			props: { label: 'esse.dev', title: text.sections.articles }
		});
		for (const p of await getProjects(lang)) {
			paths.push({
				params: { name: `detail-projects-${p.id}-${lang}` },
				props: {
					label: text.sections.projects.toLowerCase(),
					title: p.text.title,
					excerpt: p.text.excerpt
				}
			});
		}
		for (const a of await getArticles(lang)) {
			paths.push({
				params: { name: `detail-blog-${a.id}-${lang}` },
				props: {
					label: text.sections.articles.toLowerCase(),
					title: a.text.title,
					excerpt: a.text.excerpt
				}
			});
		}
	}
	return paths;
};

const require = createRequire(import.meta.url);
const font = (weight: number) =>
	readFileSync(
		require.resolve(`@fontsource/geist-sans/files/geist-sans-latin-${weight}-normal.woff`)
	);

let fonts: { name: string; data: Buffer; weight: 400 | 500; style: 'normal' }[] | null = null;

export const GET: APIRoute = async ({ props }) => {
	fonts ??= [
		{ name: 'Geist', data: font(400), weight: 400, style: 'normal' },
		{ name: 'Geist', data: font(500), weight: 500, style: 'normal' }
	];
	const svg = await satori(ogLayout(props as OgProps) as Parameters<typeof satori>[0], {
		width: OG_WIDTH,
		height: OG_HEIGHT,
		fonts
	});
	const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
	return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
