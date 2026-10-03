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
