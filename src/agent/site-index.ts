/**
 * The site index the agent's tools read (`/agent/index.json`, generated at build time).
 * Pure logic: search runs the same in the Durable Object and in tests.
 */

/** The kinds of page the index holds. */
export type SiteDocKind = 'project' | 'article' | 'method' | 'now' | 'about';

/** One page of the site in one language. */
export interface SiteDoc {
	path: string;
	lang: string;
	kind: SiteDocKind;
	title: string;
	summary: string;
	tags: string[];
	status?: string;
	date?: string;
	/** Projects only: in the showcase (`featured.json`). */
	featured?: boolean;
	repo?: string;
	site?: string;
	why?: string;
	/** Projects only: the earlier iterations of the idea, oldest first. */
	previously?: { name: string; year: number; note: string }[];
	/** The text of the page in Markdown. */
	body: string;
}

/** One result of `searchSite`. */
export interface SearchHit {
	path: string;
	kind: SiteDocKind;
	title: string;
	summary: string;
	score: number;
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Searches by words: each query word weighs most in the title, then in tags and excerpt,
 * then in the body. One language only, so the agent does not mix translations.
 */
export function searchSite(
	docs: readonly SiteDoc[],
	query: string,
	options: { lang: string; kind?: SiteDocKind; limit?: number }
): SearchHit[] {
	const words = normalize(query).split(/\s+/).filter(Boolean);
	if (words.length === 0) return [];
	const hits: SearchHit[] = [];
	for (const doc of docs) {
		if (doc.lang !== options.lang) continue;
		if (options.kind && doc.kind !== options.kind) continue;
		const title = normalize(doc.title);
		// The name of an earlier iteration leads to the project that took it over.
		const before = (doc.previously ?? []).map((p) => p.name).join(' ');
		const meta = normalize(`${doc.summary} ${doc.tags.join(' ')} ${before}`);
		const body = normalize(doc.body);
		let score = 0;
		for (const word of words) {
			if (title.includes(word)) score += 5;
			if (meta.includes(word)) score += 3;
			if (body.includes(word)) score += 1;
		}
		if (score > 0) {
			hits.push({ path: doc.path, kind: doc.kind, title: doc.title, summary: doc.summary, score });
		}
	}
	return hits.sort((a, b) => b.score - a.score).slice(0, options.limit ?? 8);
}

/** One line of the project registry. */
export interface ProjectRow {
	path: string;
	title: string;
	summary: string;
	status?: string;
	tags: string[];
	date?: string;
	featured: boolean;
	/** `owner/name` of the public repo; without it the code is private. */
	repo?: string;
	site?: string;
}

/**
 * The project registry in one language, with the filters of the projects page: status and
 * tag (case-insensitive). The showcase first, then the most recent.
 */
export function listProjects(
	docs: readonly SiteDoc[],
	options: { lang: string; status?: string; tag?: string }
): ProjectRow[] {
	const tag = options.tag && normalize(options.tag);
	return docs
		.filter((d) => d.kind === 'project' && d.lang === options.lang)
		.filter((d) => !options.status || d.status === options.status)
		.filter((d) => !tag || d.tags.some((t) => normalize(t) === tag))
		.sort(
			(a, b) =>
				Number(b.featured ?? false) - Number(a.featured ?? false) ||
				(b.date ?? '').localeCompare(a.date ?? '')
		)
		.map((d) => ({
			path: d.path,
			title: d.title,
			summary: d.summary,
			status: d.status,
			tags: d.tags,
			date: d.date,
			featured: d.featured ?? false,
			repo: d.repo ? (repoName(d.repo) ?? undefined) : undefined,
			site: d.site
		}));
}

/** `owner/name` from a GitHub URL; `null` if it is not a GitHub repo. */
export function repoName(url: string): string | null {
	const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url);
	return match ? `${match[1]}/${match[2]}` : null;
}

/** The repos the agent may read: those of the published projects, plus the given ones. */
export function publicRepos(docs: readonly SiteDoc[], extra: readonly string[] = []): string[] {
	const repos = docs.flatMap((d) => (d.repo ? [repoName(d.repo)] : [])).filter(Boolean);
	return [...new Set([...(repos as string[]), ...extra])].sort();
}
