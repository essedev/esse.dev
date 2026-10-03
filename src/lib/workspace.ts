import { featured, navigation } from './config';
import { getArticles, getMethod, getNow, getProjects, type ProjectStatus } from './content';
import { orderFeaturedFirst } from './featured';
import { formatDate } from './items';
import type { Section } from './i18n';
import { getSite, type Translate } from './site';

/**
 * L'indice dello spazio di lavoro: i gruppi della lista a sinistra, nell'ordine in cui
 * la tastiera li percorre. È anche la fonte di breadcrumb, precedente/successivo e
 * palette, così l'ordine è uno solo in tutto il sito.
 */

export interface NavItem {
	/** Chiave stabile della voce, `sezione/id`, per evidenziare quella aperta. */
	key: string;
	href: string;
	title: string;
	/** Testo breve a destra: anno, data, indice. */
	meta?: string;
	status?: ProjectStatus;
	/** Numero d'ordine mostrato al posto del LED (metodo). */
	index?: string;
	/** Testo su cui lavora il filtro. */
	search: string;
	/** Divide i progetti in evidenza dagli altri. */
	divider?: string;
}

export interface NavGroup {
	section: Section;
	label: string;
	href: string;
	count: number;
	items: NavItem[];
}

export async function getNavGroups(lang: string, t: Translate): Promise<NavGroup[]> {
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
					completed: 'statusCompleted',
					idea: 'statusIdea',
					archived: 'statusArchived'
				} as const
			)[s]
		);

	const ordered = orderFeaturedFirst(projects, featured.projects);
	const featuredCount = featured.projects.length;

	return [
		{
			section: 'now',
			label: site.sections.now,
			href: base('now'),
			count: now.length,
			items: now.slice(0, 3).map((n) => ({
				key: `now/${n.id}`,
				href: `${base('projects')}/${n.project.text.slug}`,
				title: n.title,
				meta: formatDate(n.date, lang, 'month'),
				status: 'in-progress',
				search: `${n.title} ${n.project.text.title}`
			}))
		},
		{
			section: 'projects',
			label: site.sections.projects,
			href: base('projects'),
			count: projects.length,
			items: ordered.map((p, i) => ({
				key: `projects/${p.id}`,
				href: `${base('projects')}/${p.text.slug}`,
				title: p.text.title,
				meta: p.meta.created.slice(0, 4),
				status: p.meta.status,
				search: `${p.text.title} ${p.text.tags.join(' ')} ${statusLabel(p.meta.status)}`,
				divider:
					i === featuredCount ? `${t('others')} ${projects.length - featuredCount}` : undefined
			}))
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
				search: `${a.text.title} ${a.text.tags.join(' ')}`
			}))
		},
		{
			section: 'about',
			label: site.sections.about,
			href: base('about'),
			count: 0,
			items: []
		}
	];
}

/** Voce precedente e successiva dentro lo stesso gruppo, per il pager del dettaglio. */
export function neighbours(groups: NavGroup[], key: string): { prev?: NavItem; next?: NavItem } {
	for (const group of groups) {
		const i = group.items.findIndex((item) => item.key === key);
		if (i >= 0) return { prev: group.items[i - 1], next: group.items[i + 1] };
	}
	return {};
}
