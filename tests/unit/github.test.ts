import { describe, expect, it } from 'vitest';
import {
	FILE_MAX_LINES,
	fileSlice,
	GitHubError,
	GitHubReader,
	languageShare,
	listTree
} from '../../src/agent/github';

const tree = [
	{ path: 'README.md', type: 'blob' as const, size: 10 },
	{ path: 'src', type: 'tree' as const },
	{ path: 'src/main.rs', type: 'blob' as const, size: 200 },
	{ path: 'src/ports', type: 'tree' as const },
	{ path: 'src/ports/scan.rs', type: 'blob' as const, size: 300 },
	{ path: 'vendor', type: 'commit' as const }
];

describe('languageShare', () => {
	it('turns bytes into whole percentages and drops the crumbs', () => {
		expect(languageShare({ Rust: 900, Shell: 96, Nix: 4 })).toEqual({ Rust: 90, Shell: 10 });
		expect(languageShare({})).toEqual({});
	});
});

describe('listTree', () => {
	it('lists a folder a few levels deep, folders with a slash, submodules out', () => {
		expect(listTree(tree, '', 1).entries).toEqual(['README.md', 'src/']);
		expect(listTree(tree, '/src/', 1).entries).toEqual(['src/main.rs', 'src/ports/']);
		expect(listTree(tree, 'src', 2).entries).toContain('src/ports/scan.rs');
	});
});

describe('fileSlice', () => {
	it('numbers the lines and says how many there are', () => {
		const out = fileSlice('a.ts', 'one\ntwo\nthree');
		expect(out.split('\n')[0]).toBe('a.ts, lines 1-3 of 3');
		expect(out).toContain('    2  two');
	});

	it('cuts long files and says where to continue', () => {
		const text = Array.from({ length: FILE_MAX_LINES + 50 }, (_, i) => `line ${i + 1}`).join('\n');
		const first = fileSlice('big.ts', text);
		expect(first).toContain(`continue with start_line ${FILE_MAX_LINES + 1}`);
		const rest = fileSlice('big.ts', text, FILE_MAX_LINES + 1);
		expect(rest.split('\n')[0]).toBe(
			`big.ts, lines ${FILE_MAX_LINES + 1}-${FILE_MAX_LINES + 50} of ${FILE_MAX_LINES + 50}`
		);
	});

	it('refuses binary files', () => {
		expect(() => fileSlice('logo.png', 'PNG\u0000\u0001')).toThrow(GitHubError);
	});
});

/** A fake GitHub that counts calls: enough for cache, errors and the code branches. */
function fakeGitHub(routes: Record<string, () => Response>) {
	const calls: string[] = [];
	const fetcher = (async (input: RequestInfo | URL) => {
		const path = String(input).replace('https://api.github.com', '');
		calls.push(path);
		const route = routes[path];
		return route ? route() : new Response('{}', { status: 404 });
	}) as typeof fetch;
	return { calls, fetcher };
}

const repoJson = () => Response.json({ default_branch: 'main' });
const treeJson = () => Response.json({ tree, truncated: false });

describe('GitHubReader', () => {
	it('reads a file through the tree and keeps answers in memory', async () => {
		const { calls, fetcher } = fakeGitHub({
			'/repos/essedev/portsage': repoJson,
			'/repos/essedev/portsage/git/trees/main?recursive=1': treeJson,
			'/repos/essedev/portsage/contents/src/main.rs': () => new Response('fn main() {}')
		});
		const github = new GitHubReader(undefined, fetcher);
		const read = await github.file('essedev/portsage', 'src/main.rs');
		expect(read).toContain('    1  fn main() {}');
		expect(read).toContain('https://github.com/essedev/portsage/blob/main/src/main.rs#L1-L1');
		await github.file('essedev/portsage', '/src/main.rs');
		expect(calls).toHaveLength(3);
	});

	it('tells a folder and a missing file apart before downloading', async () => {
		const { fetcher } = fakeGitHub({
			'/repos/essedev/portsage': repoJson,
			'/repos/essedev/portsage/git/trees/main?recursive=1': treeJson
		});
		const github = new GitHubReader(undefined, fetcher);
		await expect(github.file('essedev/portsage', 'src')).rejects.toThrow(/directory/);
		await expect(github.file('essedev/portsage', 'nope.rs')).rejects.toThrow(/No file/);
	});

	it('without a token searches file names only', async () => {
		const { calls, fetcher } = fakeGitHub({
			'/repos/essedev/portsage': repoJson,
			'/repos/essedev/portsage/git/trees/main?recursive=1': treeJson
		});
		const github = new GitHubReader(undefined, fetcher);
		expect(github.canSearchCode).toBe(false);
		const found = await github.search('essedev/portsage', 'ports scan');
		expect(found).toEqual({
			mode: 'paths',
			matches: [{ path: 'src/ports/scan.rs', fragments: [] }]
		});
		expect(calls.some((c) => c.startsWith('/search'))).toBe(false);
	});

	it('reports the rate limit and does not cache the error', async () => {
		let limited = true;
		const { calls, fetcher } = fakeGitHub({
			'/repos/essedev/portsage/commits?per_page=10': () =>
				limited
					? new Response('{}', { status: 403, headers: { 'x-ratelimit-reset': '1790000000' } })
					: Response.json([
							{ sha: 'abcdef123', commit: { message: 'feat: x\n\nbody', author: { date: 'd' } } }
						])
		});
		const github = new GitHubReader(undefined, fetcher);
		await expect(github.commits('essedev/portsage')).rejects.toThrow(/rate limit/);
		limited = false;
		expect(await github.commits('essedev/portsage')).toEqual([
			{ sha: 'abcdef1', date: 'd', message: 'feat: x' }
		]);
		expect(calls).toHaveLength(2);
	});
});
