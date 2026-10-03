import type { Article, Project, ProjectStatus } from './content';
import type { ListItem } from './listing';
import type { UiKey } from './site';

export const STATUS_KEY: Record<ProjectStatus, UiKey> = {
	'in-progress': 'statusInProgress',
	completed: 'statusCompleted',
	idea: 'statusIdea',
	archived: 'statusArchived'
};

/** Data nella lingua della pagina: completa (`27 gen 2025`) o solo mese (`gen 2025`). */
export function formatDate(iso: string, lang: string, style: 'full' | 'month' = 'full'): string {
	const options: Intl.DateTimeFormatOptions =
		style === 'month'
			? { month: 'short', year: 'numeric', timeZone: 'UTC' }
			: { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
	return new Intl.DateTimeFormat(lang, options)
		.format(new Date(`${iso}T00:00:00Z`))
		.replace('.', '');
}

export function projectItem(p: Project, route: string, t: (k: UiKey) => string): ListItem {
	return {
		id: p.id,
		href: `/${p.lang}/${route}/${p.text.slug}`,
		title: p.text.title,
		excerpt: p.text.excerpt,
		tags: p.text.tags,
		date: p.meta.created,
		dateLabel: formatDate(p.meta.created, p.lang),
		status: p.meta.status,
		statusLabel: t(STATUS_KEY[p.meta.status])
	};
}

export function articleItem(a: Article, route: string): ListItem {
	return {
		id: a.id,
		href: `/${a.lang}/${route}/${a.text.slug}`,
		title: a.text.title,
		excerpt: a.text.excerpt,
		tags: a.text.tags,
		date: a.meta.date,
		dateLabel: formatDate(a.meta.date, a.lang)
	};
}
