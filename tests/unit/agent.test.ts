import { describe, expect, it } from 'vitest';
import { costOf, dayKey, remaining, today } from '../../src/agent/budget';
import { admits, jevInput, parseTriage, type JevOutput } from '../../src/agent/triage';

const output = (intent: string, score: number, lang: string): JevOutput => ({
	answers: {
		intent: { type: 'choice', choice: intent, probabilities: { [intent]: 0.9 } },
		weight: { type: 'score', score },
		lang: { type: 'choice', choice: lang }
	}
});

describe('triage', () => {
	it('asks Jev three typed questions about the message', () => {
		const input = jevInput('ciao');
		expect(input.state.visitor_message).toBe('ciao');
		expect(Object.keys(input.questions)).toEqual(['intent', 'weight', 'lang']);
	});

	it('rounds the continuous score to the nearest weight', () => {
		expect(parseTriage(output('about', 0.4, 'it'), 120).weight).toBe('light');
		expect(parseTriage(output('code', 1.6, 'en'), 120).weight).toBe('heavy');
		expect(parseTriage(output('code', 7, 'en'), 120).weight).toBe('heavy');
	});

	it('keeps the probability of the chosen intent', () => {
		expect(parseTriage(output('about', 1, 'it'), 80)).toMatchObject({
			intent: 'about',
			lang: 'it',
			confidence: 0.9,
			ms: 80
		});
	});

	it('fails on an unexpected answer instead of guessing', () => {
		expect(() => parseTriage(output('weather', 1, 'it'), 0)).toThrow(/intent/);
		expect(() => parseTriage(output('about', 1, 'fr'), 0)).toThrow(/lang/);
	});

	it('lets only on-topic requests through', () => {
		expect(admits(parseTriage(output('about', 0, 'it'), 0))).toBe(true);
		expect(admits(parseTriage(output('code', 2, 'en'), 0))).toBe(true);
		expect(admits(parseTriage(output('offtopic', 0, 'en'), 0))).toBe(false);
		expect(admits(parseTriage(output('abuse', 0, 'en'), 0))).toBe(false);
	});
});

describe('budget', () => {
	const now = new Date('2026-10-03T22:00:00Z');

	it('restarts the spend every UTC day', () => {
		expect(dayKey(now)).toBe('2026-10-03');
		expect(today({ day: '2026-10-02', usd: 3 }, now)).toEqual({ day: '2026-10-03', usd: 0 });
		expect(today({ day: '2026-10-03', usd: 0.01 }, now).usd).toBe(0.01);
	});

	it('never reports a negative remainder', () => {
		expect(remaining({ day: 'x', usd: 0.08 }, 0.05)).toBe(0);
		expect(remaining({ day: 'x', usd: 0.01 }, 0.05)).toBeCloseTo(0.04);
	});

	it('sums the real cost of the model messages', () => {
		expect(
			costOf([{ usage: { cost: { total: 0.001 } } }, {}, { usage: { cost: { total: 0.002 } } }])
		).toBeCloseTo(0.003);
	});
});

describe('agent markdown', async () => {
	const { renderMarkdown } = await import('../../src/agent/markdown');

	it('renders links to site paths and https, drops other schemes', () => {
		expect(renderMarkdown('[Relay](/it/progetti/relay)')).toContain('href="/it/progetti/relay"');
		expect(renderMarkdown('[x](https://github.com/essedev)')).toContain(
			'rel="noopener noreferrer"'
		);
		expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('href');
	});

	it('shows raw HTML from the model as text', () => {
		const html = renderMarkdown('<img src=x onerror=alert(1)> **ok**');
		expect(html).not.toContain('<img');
		expect(html).toContain('&lt;img');
		expect(html).toContain('<strong>ok</strong>');
	});
});
