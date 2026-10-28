import { describe, expect, it } from 'vitest';
import {
	barLevel,
	BAR_LEVELS,
	isPaused,
	readRepo,
	repoOf,
	splitByActivity,
	weeklyCounts
} from '../../src/lib/activity';

const today = new Date('2026-10-28T15:00:00Z');

describe('weeklyCounts', () => {
	it('counts by week ending today, oldest first, and ignores what is outside', () => {
		const counts = weeklyCounts(
			[
				'2026-10-28T09:00:00Z',
				'2026-10-22T09:00:00Z',
				'2026-10-21T09:00:00Z',
				'2026-08-01T09:00:00Z'
			],
			today,
			4
		);
		expect(counts).toEqual([0, 0, 1, 2]);
	});
});

describe('isPaused', () => {
	it('pauses after three weeks without a commit', () => {
		expect(isPaused('2026-10-07', today)).toBe(false);
		expect(isPaused('2026-10-06', today)).toBe(true);
	});
});

describe('splitByActivity', () => {
	it('splits moving and paused, most recent first', () => {
		const rows = [
			{ id: 'old', last: '2026-04-26' },
			{ id: 'new', last: '2026-10-27' },
			{ id: 'mid', last: '2026-10-11' }
		];
		const { moving, paused } = splitByActivity(rows, today);
		expect(moving.map((r) => r.id)).toEqual(['new', 'mid']);
		expect(paused.map((r) => r.id)).toEqual(['old']);
	});
});

describe('barLevel', () => {
	it('keeps a quiet week visible and the busiest at the top', () => {
		expect(barLevel(0, 200)).toBe(0);
		expect(barLevel(1, 200)).toBe(1);
		expect(barLevel(200, 200)).toBe(BAR_LEVELS);
	});
});

describe('repoOf', () => {
	it('reads owner/repo from a GitHub URL only', () => {
		expect(repoOf('https://github.com/essedev/relay')).toBe('essedev/relay');
		expect(repoOf('https://github.com/essedev/relay.git')).toBe('essedev/relay');
		expect(repoOf('https://gitlab.com/essedev/relay')).toBeNull();
	});
});

describe('readRepo', () => {
	const commit = (date: string) => ({ commit: { author: { date } } });
	const reply = (data: unknown, link?: string) =>
		new Response(JSON.stringify(data), { headers: link ? { link } : {} });

	it('follows the pages and sends the token', async () => {
		const seen: string[] = [];
		const fetcher = async (url: string, init?: RequestInit) => {
			seen.push(url);
			expect((init?.headers as Record<string, string>).authorization).toBe('Bearer t');
			return url.includes('page=2')
				? reply([commit('2026-10-20T10:00:00Z')])
				: reply([commit('2026-10-27T10:00:00Z')], '<https://api.github.com/x?page=2>; rel="next"');
		};
		const out = await readRepo('essedev/x', today, 't', fetcher);
		expect(seen).toHaveLength(2);
		expect(out.last).toBe('2026-10-27');
		expect(out.weeks.reduce((a, b) => a + b, 0)).toBe(2);
	});

	it('looks up the last commit when the window is empty', async () => {
		const fetcher = async (url: string) =>
			url.includes('since=') ? reply([]) : reply([commit('2026-04-26T10:00:00Z')]);
		const out = await readRepo('essedev/x', today, undefined, fetcher);
		expect(out.last).toBe('2026-04-26');
		expect(out.weeks.every((n) => n === 0)).toBe(true);
	});

	it('fails on an unreadable repo, so the caller can fall back', async () => {
		const fetcher = async () => new Response('', { status: 404 });
		await expect(readRepo('essedev/private', today, undefined, fetcher)).rejects.toThrow('404');
	});
});
