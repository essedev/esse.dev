/**
 * L'indice del sito che i tool dell'agente leggono (`/agent/index.json`, generato alla
 * build). Logica pura: la ricerca gira uguale nel Durable Object e nei test.
 */

export type SiteDocKind = 'project' | 'article' | 'method' | 'now' | 'about';

export interface SiteDoc {
	path: string;
	lang: string;
	kind: SiteDocKind;
	title: string;
	summary: string;
	tags: string[];
	status?: string;
	date?: string;
	/** Solo progetti: in vetrina (`featured.json`). */
	featured?: boolean;
	repo?: string;
	site?: string;
	why?: string;
	/** Il testo della pagina in Markdown. */
	body: string;
}

export interface SearchHit {
	path: string;
	kind: SiteDocKind;
	title: string;
	summary: string;
	score: number;
}

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Cerca per parole: ogni parola della query vale di più nel titolo, poi nei tag e nel
 * sommario, poi nel testo. Una lingua sola, così l'agente non mescola le traduzioni.
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
		const meta = normalize(`${doc.summary} ${doc.tags.join(' ')}`);
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

export interface ProjectRow {
	path: string;
	title: string;
	summary: string;
	status?: string;
	tags: string[];
	date?: string;
	featured: boolean;
	/** `owner/name` del repo pubblico; senza, il codice è privato. */
	repo?: string;
	site?: string;
}

/**
 * Il registro dei progetti in una lingua, con i filtri della pagina progetti: stato e
 * tag (senza distinguere maiuscole). La vetrina prima, poi dal più recente.
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

/** `owner/name` da un URL di GitHub; `null` se non è un repo di GitHub. */
export function repoName(url: string): string | null {
	const match = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(url);
	return match ? `${match[1]}/${match[2]}` : null;
}

/** I repo che l'agente può leggere: quelli dei progetti pubblicati, più quelli dati. */
export function publicRepos(docs: readonly SiteDoc[], extra: readonly string[] = []): string[] {
	const repos = docs.flatMap((d) => (d.repo ? [repoName(d.repo)] : [])).filter(Boolean);
	return [...new Set([...(repos as string[]), ...extra])].sort();
}
