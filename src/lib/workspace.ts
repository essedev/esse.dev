import { featured, navigation } from './config';
import { getArticles, getMethod, getNow, getProjects, type ProjectStatus } from './content';
import { orderFeaturedFirst } from './featured';
import { formatDate } from './items';
import type { Section } from './i18n';
import { getSite, type Translate } from './site';

/**
 * L'indice dello spazio di lavoro, in ordine di importanza: prima le pagine singole (chi
 * sono, adesso), poi le raccolte (progetti, metodo, scritti), nell'ordine in cui la
 * tastiera le percorre. È anche la fonte del pager, così l'ordine è uno solo in tutto il
 * sito. Deve stare in una finestra alta 900 px senza scrollare.
 */

export interface NavItem {
	/** Chiave stabile della voce, `sezione/id` o la sezione, per evidenziare quella aperta. */
	key: string;
	href: string;
	title: string;
	/** Testo breve a destra: anno, data. */
	meta?: string;
	status?: ProjectStatus;
	/** Numero d'ordine mostrato al posto del LED (metodo). */
	index?: string;
	/** Icona al posto del LED, per le voci senza stato: una pagina o uno scritto. */
	icon?: 'person' | 'text' | 'agent';
	/** Testo su cui lavora il filtro. */
	search: string;
	/**
	 * Fuori dalla vetrina: la voce c'è (la ricerca la trova, il pager la percorre) ma si
	 * vede solo se la ricerca la cerca o se è la pagina aperta.
	 */
	rest?: boolean;
}

export interface NavGroup {
	section: Section;
	label: string;
	href: string;
	count: number;
	items: NavItem[];
	/** Riga finale verso la raccolta intera, quando la lista ne mostra solo una parte. */
	more?: { label: string; href: string };
}

export interface Nav {
	pages: NavItem[];
	groups: NavGroup[];
}

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
				status: 'in-progress',
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

/** Voce precedente e successiva dentro lo stesso gruppo, per il pager del dettaglio. */
export function neighbours(groups: NavGroup[], key: string): { prev?: NavItem; next?: NavItem } {
	for (const group of groups) {
		const i = group.items.findIndex((item) => item.key === key);
		if (i >= 0) return { prev: group.items[i - 1], next: group.items[i + 1] };
	}
	return {};
}
