import type { ImageMetadata } from 'astro';
import { featured, navigation } from './config';
import { getArticles, getMethod, getNow, getProjects, type ProjectStatus } from './content';
import { orderFeaturedFirst } from './featured';
import { formatDate } from './items';
import type { Section } from './i18n';
import { getSite, type Translate } from './site';

/**
 * The workspace index, in order of importance: single pages first (about, now), then the
 * collections (projects, method, writing), in the order the keyboard walks them. It is also
 * the source of the pager, so there is one order across the whole site. It must fit a
 * 900 px tall window without scrolling.
 */

/** One row of the list. */
export interface NavItem {
	/** Stable key of the row, `section/id` or the section, to highlight the open one. */
	key: string;
	href: string;
	title: string;
	/** Short text on the right: year, date. */
	meta?: string;
	status?: ProjectStatus;
	/** The project's logo, shown in place of the LED with the LED on its corner. */
	logo?: ImageMetadata;
	/** Order number shown in place of the LED (method). */
	index?: string;
	/** Icon in place of the LED, for rows without a status: a page or a piece of writing. */
	icon?: 'home' | 'person' | 'text' | 'agent' | 'now';
	/** The text the filter works on. */
	search: string;
	/**
	 * Outside the showcase: the row exists (search finds it, the pager walks it) but it shows
	 * only if the search asks for it or it is the open page.
	 */
	rest?: boolean;
}

/** A group of rows: one section. */
export interface NavGroup {
	section: Section;
	label: string;
	href: string;
	count: number;
	items: NavItem[];
	/** Final row to the whole collection, when the list shows only part of it. */
	more?: { label: string; href: string };
}

/** The whole index. */
export interface Nav {
	pages: NavItem[];
	groups: NavGroup[];
}

/** Builds the workspace index for a language. */
export async function getNav(lang: string, t: Translate): Promise<Nav> {
	const [site, now, projects, method, articles] = await Promise.all([
		getSite(lang),
		getNow(lang),
		getProjects(lang),
		getMethod(lang),
		getArticles(lang)
	]);
	const routes = navigation[lang];
	const base = (section: Section) => `/${lang}/${routes[section]}`;
	const statusLabel = (s: ProjectStatus) =>
		t(
			(
				{
					'in-progress': 'statusInProgress',
					maintained: 'statusMaintained',
					completed: 'statusCompleted',
					idea: 'statusIdea',
					archived: 'statusArchived'
				} as const
			)[s]
		);

	const showcase = new Set(featured.projects);
	const ordered = orderFeaturedFirst(projects, featured.projects);

	return {
		pages: [
			{
				key: 'home',
				href: `/${lang}`,
				title: t('welcome'),
				icon: 'home',
				search: t('welcome').toLowerCase()
			},
			{
				key: 'about',
				href: base('about'),
				title: site.sections.about,
				icon: 'person',
				search: site.sections.about.toLowerCase()
			},
			{
				key: 'now',
				href: base('now'),
				title: site.sections.now,
				meta: now[0] ? formatDate(now[0].date, lang, 'month') : undefined,
				icon: 'now',
				search: [site.sections.now, ...now.map((n) => n.title)].join(' ').toLowerCase()
			},
			{
				key: 'agent',
				href: base('agent'),
				title: site.sections.agent,
				icon: 'agent',
				search: site.sections.agent.toLowerCase()
			}
		],
		groups: [
			{
				section: 'projects',
				label: site.sections.projects,
				href: base('projects'),
				count: projects.length,
				items: ordered.map((p) => ({
					key: `projects/${p.id}`,
					href: `${base('projects')}/${p.text.slug}`,
					title: p.text.title,
					meta: p.meta.created.slice(0, 4),
					status: p.meta.status,
					logo: p.meta.logo,
					search: `${p.text.title} ${p.text.tags.join(' ')} ${statusLabel(p.meta.status)}`,
					rest: !showcase.has(p.id)
				})),
				more:
					projects.length > showcase.size
						? {
								label: t('allProjects').replace('{n}', String(projects.length)),
								href: base('projects')
							}
						: undefined
			},
			{
				section: 'method',
				label: site.sections.method,
				href: base('method'),
				count: method.length,
				items: method.map((m, i) => ({
					key: `method/${m.id}`,
					href: `${base('method')}/${m.text.slug}`,
					title: m.text.title,
					index: String(i + 1).padStart(2, '0'),
					search: `${m.text.title} ${m.text.summary}`
				}))
			},
			{
				section: 'articles',
				label: site.sections.articles,
				href: base('articles'),
				count: articles.length,
				items: articles.map((a) => ({
					key: `articles/${a.id}`,
					href: `${base('articles')}/${a.text.slug}`,
					title: a.text.title,
					meta: formatDate(a.meta.date, lang, 'month'),
					icon: 'text',
					search: `${a.text.title} ${a.text.tags.join(' ')}`
				}))
			}
		]
	};
}

/** The previous and next rows within the same group, for the detail pager. */
export function neighbours(groups: NavGroup[], key: string): { prev?: NavItem; next?: NavItem } {
	for (const group of groups) {
		const i = group.items.findIndex((item) => item.key === key);
		if (i >= 0) return { prev: group.items[i - 1], next: group.items[i + 1] };
	}
	return {};
}
