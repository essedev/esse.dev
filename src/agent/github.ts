/**
 * The public repos of the projects, read from the GitHub REST API for the agent's tools.
 * Read-only and only the allowed repos (`publicRepos` in `site-index.ts`): the model picks a
 * repo from the list, never a URL.
 *
 * With `GITHUB_TOKEN` (fine-grained, read-only on public repos) the limit is 5,000 requests
 * per hour and code search is available; without it the limit is 60 per hour per IP, which
 * is shared on the Worker, and search looks at file names only. Every response stays in
 * memory for a few minutes: a conversation often returns to the same files.
 */

const API = 'https://api.github.com';
const CACHE_MS = 5 * 60_000;
const TIMEOUT_MS = 8000;
/** Past this size a file is read in slices (`start_line`). */
export const FILE_MAX_CHARS = 16_000;

/** Past this many lines a file is read in slices (`start_line`). */
export const FILE_MAX_LINES = 400;
/** A larger file (data, bundle) is not read at all. */
const FILE_MAX_BYTES = 1_000_000;
const README_MAX_CHARS = 6000;
const TREE_MAX_ENTRIES = 250;

/** What the agent knows about a repo at a glance. */
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
	/** Languages by share of the code, in percent. */
	languages: Record<string, number>;
	readme: string | null;
}

/** One line of a commit log. */
export interface CommitRow {
	sha: string;
	date: string;
	message: string;
}

/** A file that matched a search, with the matching fragments when GitHub gives them. */
export interface SearchMatch {
	path: string;
	fragments: string[];
}

interface TreeEntry {
	path: string;
	type: 'blob' | 'tree' | 'commit';
	size?: number;
}

/** A GitHub failure whose message is safe to show to the model. */
export class GitHubError extends Error {}

/** Whole percentages from bytes per language, leaving out those under 1%. */
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
 * The tree entries under `path`, down to `depth` levels; folders end with `/`. Also returns
 * how many entries fall outside the cap.
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
 * A slice of a file with line numbers, so the model can cite them and ask for the rest. The
 * header says which lines they are, how many there are in total and, with `url`, the GitHub
 * link to cite (`#L12-L40` for the lines).
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

/** Caps a long text, with a mark where it was cut. */
const clip = (text: string, max: number) =>
	text.length > max ? `${text.slice(0, max)}\n[…]` : text;

/** A cached, read-only client for the GitHub REST API. */
export class GitHubReader {
	readonly #token: string | undefined;
	readonly #fetch: typeof fetch;
	readonly #cache = new Map<string, { at: number; value: Promise<unknown> }>();

	/** `token` enables code search and the higher rate limit; `fetcher` replaces `fetch` in tests. */
	constructor(token: string | undefined, fetcher?: typeof fetch) {
		this.#token = token;
		// On the Worker, `fetch` detached from its `globalThis` throws "Illegal invocation".
		this.#fetch = fetcher ?? ((input, init) => fetch(input, init));
	}

	/** Whether code search is available, which needs the token. */
	get canSearchCode(): boolean {
		return Boolean(this.#token);
	}

	async #get<T>(path: string, accept = 'application/vnd.github+json'): Promise<T> {
		const key = `${accept} ${path}`;
		const hit = this.#cache.get(key);
		if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as Promise<T>;
		const value = this.#request<T>(path, accept);
		this.#cache.set(key, { at: Date.now(), value });
		// A failure is not cached: the next call retries.
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

	/** The overview of a repo: metadata, language shares and the README. */
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

	/** The entries under `path`, `depth` levels deep, and whether GitHub truncated the tree. */
	async files(repo: string, path = '', depth = 2) {
		const { tree, truncated } = await this.#tree(repo);
		const listed = listTree(tree, path, Math.min(Math.max(1, depth), 6));
		if (listed.entries.length === 0) throw new GitHubError(`No files under "${path}" in ${repo}.`);
		return { ...listed, truncated };
	}

	/** A slice of a file with line numbers, from `startLine`. */
	async file(repo: string, path: string, startLine = 1): Promise<string> {
		const clean = path.replace(/^\/+|\/+$/g, '');
		// The tree comes first (usually cached): it tells folders, missing files and oversized files apart.
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
	 * With the token, GitHub code search (default branch, with fragments). Without it, only
	 * the names of files that contain every word.
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

	/** The latest commits, at most 30. */
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
