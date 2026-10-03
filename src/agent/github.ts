/**
 * I repo pubblici dei progetti, letti dall'API REST di GitHub per i tool dell'agente. Solo
 * lettura e solo i repo ammessi (`publicRepos` in `site-index.ts`): il modello sceglie un
 * repo dall'elenco, mai un URL.
 *
 * Con `GITHUB_TOKEN` (fine-grained, solo lettura dei repo pubblici) il limite è 5.000
 * richieste l'ora e c'è la ricerca nel codice; senza, 60 l'ora per IP, che sul Worker è
 * condiviso, e la ricerca guarda solo i nomi dei file. Ogni risposta resta in memoria per
 * qualche minuto: una conversazione torna spesso sugli stessi file.
 */

const API = 'https://api.github.com';
const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 8000;
/** Oltre questa misura un file si legge a pezzi (`start_line`). */
export const FILE_MAX_CHARS = 16_000;
export const FILE_MAX_LINES = 400;
/** Un file più grande (dati, bundle) non si legge proprio. */
const FILE_MAX_BYTES = 1_000_000;
const README_MAX_CHARS = 6000;
const TREE_MAX_ENTRIES = 250;

export interface RepoOverview {
	repo: string;
	url: string;
	description: string | null;
	homepage: string | null;
	topics: string[];
	license: string | null;
	stars: number;
	defaultBranch: string;
	lastPush: string;
	/** Linguaggi per quota del codice, in percentuale. */
	languages: Record<string, number>;
	readme: string | null;
}

export interface CommitRow {
	sha: string;
	date: string;
	message: string;
}

export interface SearchMatch {
	path: string;
	fragments: string[];
}

interface TreeEntry {
	path: string;
	type: 'blob' | 'tree' | 'commit';
	size?: number;
}

export class GitHubError extends Error {}

/** Percentuali intere dai byte per linguaggio, senza quelli sotto l'1%. */
export function languageShare(bytes: Record<string, number>): Record<string, number> {
	const total = Object.values(bytes).reduce((a, b) => a + b, 0);
	if (total === 0) return {};
	return Object.fromEntries(
		Object.entries(bytes)
			.map(([lang, n]) => [lang, Math.round((n / total) * 100)] as const)
			.filter(([, pct]) => pct >= 1)
	);
}

/**
 * Le voci dell'albero sotto `path`, fino a `depth` livelli; le cartelle finiscono con `/`.
 * Restituisce anche quante voci restano fuori dal tetto.
 */
export function listTree(
	tree: readonly TreeEntry[],
	path: string,
	depth: number
): { entries: string[]; omitted: number } {
	const prefix = path.replace(/^\/+|\/+$/g, '');
	const base = prefix ? `${prefix}/` : '';
	const all = tree
		.filter((e) => e.path.startsWith(base) && e.type !== 'commit')
		.filter((e) => e.path.slice(base.length).split('/').length <= depth)
		.map((e) => (e.type === 'tree' ? `${e.path}/` : e.path));
	return {
		entries: all.slice(0, TREE_MAX_ENTRIES),
		omitted: Math.max(0, all.length - TREE_MAX_ENTRIES)
	};
}

/**
 * Un pezzo di file con i numeri di riga, così il modello può citarli e chiedere il seguito.
 * L'intestazione dice quali righe sono, quante sono in tutto e, con `url`, il link a GitHub
 * da citare (`#L12-L40` per le righe).
 */
export function fileSlice(path: string, text: string, startLine = 1, url?: string): string {
	if (text.includes('\u0000')) throw new GitHubError(`${path} is a binary file.`);
	const lines = text.split('\n');
	const start = Math.min(Math.max(1, Math.floor(startLine)), lines.length);
	const out: string[] = [];
	let size = 0;
	let end = start - 1;
	for (let i = start - 1; i < lines.length && out.length < FILE_MAX_LINES; i++) {
		const line = `${String(i + 1).padStart(5)}  ${lines[i]}`;
		if (size + line.length > FILE_MAX_CHARS && out.length > 0) break;
		out.push(line);
		size += line.length + 1;
		end = i + 1;
	}
	const more = end < lines.length ? `; continue with start_line ${end + 1}` : '';
	const link = url ? `\n${url}#L${start}-L${end}` : '';
	return `${path}, lines ${start}-${end} of ${lines.length}${more}${link}\n\n${out.join('\n')}`;
}

/** Il tetto di un testo lungo, con il segno del taglio. */
const clip = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max)}\n[…]` : text;

export class GitHubReader {
	readonly #token: string | undefined;
	readonly #fetch: typeof fetch;
	readonly #cache = new Map<string, { at: number; value: Promise<unknown> }>();

	constructor(token: string | undefined, fetcher?: typeof fetch) {
		this.#token = token;
		// Sul Worker `fetch` staccato dal suo `globalThis` lancia "Illegal invocation".
		this.#fetch = fetcher ?? ((input, init) => fetch(input, init));
	}

	get canSearchCode(): boolean {
		return Boolean(this.#token);
	}

	async #get<T>(path: string, accept = 'application/vnd.github+json'): Promise<T> {
		const key = `${accept} ${path}`;
		const hit = this.#cache.get(key);
		if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
		const value = this.#request<T>(path, accept);
		this.#cache.set(key, { at: Date.now(), value });
		// Un errore non resta in cache: la prossima chiamata riprova.
		value.catch(() => this.#cache.delete(key));
		return value;
	}

	async #request<T>(path: string, accept: string): Promise<T> {
		const res = await this.#fetch(`${API}${path}`, {
			headers: {
				accept,
				'user-agent': 'esse.dev-agent',
				'x-github-api-version': '2022-11-28',
				...(this.#token ? { authorization: `Bearer ${this.#token}` } : {})
			},
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
		if (res.status === 404) throw new GitHubError(`Not found on GitHub: ${path}`);
		if (res.status === 403 || res.status === 429) {
			const reset = res.headers.get('x-ratelimit-reset');
			const when = reset ? ` until ${new Date(Number(reset) * 1000).toISOString()}` : '';
			throw new GitHubError(`GitHub rate limit reached${when}: answer from the site pages.`);
		}
		if (!res.ok) throw new GitHubError(`GitHub: HTTP ${res.status} on ${path}`);
		return (accept.endsWith('raw') ? res.text() : res.json()) as Promise<T>;
	}

	async #branch(repo: string): Promise<string> {
		return (await this.#get<{ default_branch: string }>(`/repos/${repo}`)).default_branch;
	}

	async overview(repo: string): Promise<RepoOverview> {
		const [meta, languages, readme] = await Promise.all([
			this.#get<{
				html_url: string;
				description: string | null;
				homepage: string | null;
				topics?: string[];
				license: { spdx_id: string } | null;
				stargazers_count: number;
				default_branch: string;
				pushed_at: string;
			}>(`/repos/${repo}`),
			this.#get<Record<string, number>>(`/repos/${repo}/languages`),
			this.#get<string>(`/repos/${repo}/readme`, 'application/vnd.github.raw').catch(
				(error: unknown) => {
					if (error instanceof GitHubError && error.message.startsWith('Not found')) return null;
					throw error;
				}
			)
		]);
		return {
			repo,
			url: meta.html_url,
			description: meta.description,
			homepage: meta.homepage || null,
			topics: meta.topics ?? [],
			license: meta.license?.spdx_id ?? null,
			stars: meta.stargazers_count,
			defaultBranch: meta.default_branch,
			lastPush: meta.pushed_at,
			languages: languageShare(languages),
			readme: readme === null ? null : clip(readme, README_MAX_CHARS)
		};
	}

	async #tree(repo: string): Promise<{ tree: TreeEntry[]; truncated: boolean }> {
		const branch = await this.#branch(repo);
		return this.#get(`/repos/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
	}

	async files(repo: string, path = '', depth = 2) {
		const { tree, truncated } = await this.#tree(repo);
		const listed = listTree(tree, path, Math.min(Math.max(1, depth), 6));
		if (listed.entries.length === 0) throw new GitHubError(`No files under "${path}" in ${repo}.`);
		return { ...listed, truncated };
	}

	async file(repo: string, path: string, startLine = 1): Promise<string> {
		const clean = path.replace(/^\/+|\/+$/g, '');
		// Prima l'albero (già in cache di solito): distingue cartelle, file mancanti e troppo grandi.
		const entry = (await this.#tree(repo)).tree.find((e) => e.path === clean);
		if (!entry)
			throw new GitHubError(`No file ${clean} in ${repo}: use list_files or search_code.`);
		if (entry.type !== 'blob') throw new GitHubError(`${clean} is a directory: use list_files.`);
		if ((entry.size ?? 0) > FILE_MAX_BYTES) {
			throw new GitHubError(`${clean} is ${entry.size} bytes, too large to read.`);
		}
		const encoded = clean.split('/').map(encodeURIComponent).join('/');
		const text = await this.#get<string>(
			`/repos/${repo}/contents/${encoded}`,
			'application/vnd.github.raw'
		);
		const url = `https://github.com/${repo}/blob/${encodeURIComponent(await this.#branch(repo))}/${encoded}`;
		return fileSlice(clean, text, startLine, url);
	}

	/**
	 * Con il token, la ricerca nel codice di GitHub (ramo principale, con i frammenti).
	 * Senza, solo i nomi dei file che contengono tutte le parole.
	 */
	async search(
		repo: string,
		query: string
	): Promise<{ mode: 'code' | 'paths'; matches: SearchMatch[] }> {
		if (this.#token) {
			const q = encodeURIComponent(`${query} repo:${repo}`);
			const found = await this.#get<{
				items: { path: string; text_matches?: { fragment: string }[] }[];
			}>(`/search/code?q=${q}&per_page=10`, 'application/vnd.github.text-match+json');
			return {
				mode: 'code',
				matches: found.items.map((i) => ({
					path: i.path,
					fragments: (i.text_matches ?? []).map((m) => clip(m.fragment, 400)).slice(0, 3)
				}))
			};
		}
		const words = query.toLowerCase().split(/\s+/).filter(Boolean);
		const { tree } = await this.#tree(repo);
		return {
			mode: 'paths',
			matches: tree
				.filter((e) => e.type === 'blob' && words.every((w) => e.path.toLowerCase().includes(w)))
				.slice(0, 20)
				.map((e) => ({ path: e.path, fragments: [] }))
		};
	}

	async commits(repo: string, limit = 10): Promise<CommitRow[]> {
		const list = await this.#get<
			{ sha: string; commit: { message: string; author: { date: string } | null } }[]
		>(`/repos/${repo}/commits?per_page=${Math.min(Math.max(1, limit), 30)}`);
		return list.map((c) => ({
			sha: c.sha.slice(0, 7),
			date: c.commit.author?.date ?? '',
			message: c.commit.message.split('\n')[0]
		}));
	}
}
