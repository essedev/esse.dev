import type { ImageMetadata } from 'astro';
import { readActivity, repoOf, splitByActivity, type RepoActivity } from './activity';
import { navigation } from './config';
import { getChangelog, getProjects, type ProjectStatus } from './content';

/**
 * The rows of the Now page: this site and every project in progress, each with what I am doing
 * on it and its activity on GitHub, split into moving and paused by the last commit
 * (DECISIONS #42). A repo that cannot be read falls back to `updated` in meta.json.
 */

/** The repo of this site, which has no project entry. */
const SITE_REPO = 'essedev/esse.dev';

/** One row of the Now page. */
export interface BoardRow {
	key: string;
	title: string;
	href: string;
	/** What I am doing on it: the `now` line, or the excerpt when there is none. */
	line: string;
	status?: ProjectStatus;
	logo?: ImageMetadata;
	logoLight?: ImageMetadata;
	/** Commits per week and last commit, or null when GitHub could not be read. */
	activity: RepoActivity | null;
	/** The day of the last activity: the last commit, or the date in the content. */
	last: string;
}

/** The Now page's rows and the day GitHub was read. */
export interface Board {
	moving: BoardRow[];
	paused: BoardRow[];
	readOn: string;
}

/** The rows of the Now page in one language, read at build time. */
export async function getNowBoard(lang: string, siteTitle: string): Promise<Board> {
	const today = new Date();
	const routes = navigation[lang];
	const [projects, changelog] = await Promise.all([getProjects(lang), getChangelog(lang)]);
	const active = projects.filter((p) => p.meta.status === 'in-progress');
	const repoFor = (p: (typeof active)[number]) =>
		p.meta.activityRepo ?? (p.meta.repo ? repoOf(p.meta.repo) : null);
	const activity = await readActivity(
		[SITE_REPO, ...active.flatMap((p) => repoFor(p) ?? [])],
		today
	);

	const site = activity.get(SITE_REPO) ?? null;
	const rows: BoardRow[] = [
		{
			key: 'site',
			title: siteTitle,
			href: `/${lang}/${routes.changelog}`,
			line: changelog[0]?.title ?? '',
			activity: site,
			last: site?.last ?? changelog[0]?.date ?? today.toISOString().slice(0, 10)
		},
		...active.map((p) => {
			const repo = repoFor(p);
			const read = repo ? (activity.get(repo) ?? null) : null;
			return {
				key: p.id,
				title: p.text.title,
				href: `/${lang}/${routes.projects}/${p.text.slug}`,
				line: p.text.now ?? p.text.excerpt,
				status: p.meta.status,
				logo: p.meta.logo,
				logoLight: p.meta.logoLight,
				activity: read,
				last: read?.last ?? p.meta.updated
			};
		})
	];
	return { ...splitByActivity(rows, today), readOn: today.toISOString().slice(0, 10) };
}
