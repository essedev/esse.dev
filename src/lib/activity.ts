/**
 * The activity of the projects' repos for the Now page: commits per week and the last commit,
 * read from the GitHub REST API at build time (DECISIONS #42). Dates and counts only, never
 * the messages, so a private repo can be read without showing its work. The token is
 * `GITHUB_ACTIVITY_TOKEN`, a build variable, separate from the agent's `GITHUB_TOKEN`; without
 * it only the public repos are read, at 60 requests per hour.
 */

const API = 'https://api.github.com';
const TIMEOUT_MS = 15_000;
const MAX_PAGES = 5;
// A request that stalls or is turned away for load gets two more tries: on 2026-10-28 three
// of eleven requests from the build hung for the whole timeout while the same ones answer in
// under a second (DECISIONS #42). Few at a time, so the build does not look like a burst.
const ATTEMPTS = 3;
const BACKOFF_MS = 1000;
const CONCURRENCY = 4;
const DAY_MS = 86_400_000;

/** How many weeks of commits a row shows. */
export const WEEKS = 8;
/** Past this many days without a commit a project in progress counts as paused. */
export const PAUSE_DAYS = 21;
/** The heights of a week's bar, from nothing to the busiest week. */
export const BAR_LEVELS = 6;

/** What the page shows of a repo: commits per week, oldest first, and the last commit. */
export interface RepoActivity {
	weeks: number[];
	/** The day of the last commit (`YYYY-MM-DD`), or null for an empty repo. */
	last: string | null;
}

/** The commits per week over the `weeks` weeks that end today, oldest first. */
export function weeklyCounts(dates: string[], today: Date, weeks = WEEKS): number[] {
	const counts = new Array<number>(weeks).fill(0);
	const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
	for (const date of dates) {
		const day = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
		const ago = Math.floor((end - day) / DAY_MS / 7);
		if (ago >= 0 && ago < weeks) counts[weeks - 1 - ago] += 1;
	}
	return counts;
}

/** Whether a project last touched on `last` (`YYYY-MM-DD`) has been idle too long. */
export function isPaused(last: string, today: Date): boolean {
	const day = Date.parse(`${last}T00:00:00Z`);
	const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
	return (end - day) / DAY_MS > PAUSE_DAYS;
}

/**
 * The height of a week's bar, 0 for no commits and 1..BAR_LEVELS otherwise. The square root
 * keeps a quiet week visible next to a release week of two hundred commits.
 */
export function barLevel(count: number, max: number): number {
	if (count <= 0 || max <= 0) return 0;
	return Math.max(1, Math.round(Math.sqrt(count / max) * BAR_LEVELS));
}

/** Rows split into moving and paused by their last activity, each most recent first. */
export function splitByActivity<T extends { last: string }>(
	rows: T[],
	today: Date
): { moving: T[]; paused: T[] } {
	const sorted = [...rows].sort((a, b) => b.last.localeCompare(a.last));
	return {
		moving: sorted.filter((r) => !isPaused(r.last, today)),
		paused: sorted.filter((r) => isPaused(r.last, today))
	};
}

/** The `owner/repo` of a GitHub URL, or null for another host. */
export function repoOf(url: string): string | null {
	const match = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(url);
	return match ? match[1] : null;
}

type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
type Wait = (ms: number) => Promise<void>;

/** A GitHub answer worth asking again: overload, rate limit or a server error. */
class RetryableError extends Error {}

const sleep: Wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getOnce(
	path: string,
	token: string | undefined,
	fetcher: Fetcher
): Promise<{ data: { commit: { author: { date: string } } }[]; next: string | null }> {
	let res: Response;
	try {
		res = await fetcher(path.startsWith('http') ? path : `${API}${path}`, {
			headers: {
				accept: 'application/vnd.github+json',
				'user-agent': 'esse.dev-build',
				'x-github-api-version': '2022-11-28',
				...(token ? { authorization: `Bearer ${token}` } : {})
			},
			signal: AbortSignal.timeout(TIMEOUT_MS)
		});
	} catch (error) {
		// A timeout or a dropped connection: the request never got an answer.
		throw new RetryableError((error as Error).message);
	}
	if (res.status === 403 || res.status === 429 || res.status >= 500)
		throw new RetryableError(`GitHub ${res.status} on ${path}`);
	if (!res.ok) throw new Error(`GitHub ${res.status} on ${path}`);
	const next = /<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') ?? '');
	return { data: await res.json(), next: next ? next[1] : null };
}

async function get(path: string, token: string | undefined, fetcher: Fetcher, wait: Wait) {
	for (let attempt = 1; ; attempt++) {
		try {
			return await getOnce(path, token, fetcher);
		} catch (error) {
			if (!(error instanceof RetryableError) || attempt >= ATTEMPTS) throw error;
			await wait(BACKOFF_MS * 2 ** (attempt - 1));
		}
	}
}

/** The activity of one repo over the last `WEEKS` weeks, and its last commit even if older. */
export async function readRepo(
	repo: string,
	today: Date,
	token: string | undefined,
	fetcher: Fetcher = (input, init) => fetch(input, init),
	wait: Wait = sleep
): Promise<RepoActivity> {
	const since = new Date(today.getTime() - WEEKS * 7 * DAY_MS).toISOString();
	const dates: string[] = [];
	let path: string | null = `/repos/${repo}/commits?since=${since}&per_page=100`;
	for (let page = 0; path && page < MAX_PAGES; page++) {
		const { data, next } = await get(path, token, fetcher, wait);
		dates.push(...data.map((c) => c.commit.author.date));
		path = next;
	}
	let last =
		dates
			.map((d) => d.slice(0, 10))
			.sort()
			.at(-1) ?? null;
	if (!last) {
		const { data } = await get(`/repos/${repo}/commits?per_page=1`, token, fetcher, wait);
		last = data[0]?.commit.author.date.slice(0, 10) ?? null;
	}
	return { weeks: weeklyCounts(dates, today), last };
}

let cache: Promise<Map<string, RepoActivity | null>> | null = null;

/**
 * The activity of every repo, read once per build. A repo that cannot be read (private without
 * the token, rate limit, network) is null and the page falls back to the date in meta.json;
 * the build says so in its log instead of failing, since GitHub is not the site's to fix.
 */
export function readActivity(
	repos: string[],
	today: Date
): Promise<Map<string, RepoActivity | null>> {
	cache ??= (async () => {
		const token = process.env.GITHUB_ACTIVITY_TOKEN || undefined;
		const queue = [...new Set(repos)];
		const read = new Map<string, RepoActivity | null>();
		const worker = async () => {
			for (let repo = queue.shift(); repo; repo = queue.shift()) {
				try {
					read.set(repo, await readRepo(repo, today, token));
				} catch (error) {
					console.warn(`[activity] ${repo}: ${(error as Error).message}, using meta.json`);
					read.set(repo, null);
				}
			}
		};
		await Promise.all(Array.from({ length: CONCURRENCY }, worker));
		return read;
	})();
	return cache;
}
