import { describe, expect, it } from 'vitest';
import { costOf, credits, dayKey, nextReset, remaining, today } from '../../src/agent/budget';
import {
	admits,
	blockReason,
	isSmallTalk,
	jevInput,
	parseTriage,
	type JevOutput
} from '../../src/agent/triage';

const output = (intent: string, score: number, lang: string, p: number = 0.9): JevOutput => ({
	answers: {
		intent: { type: 'choice', choice: intent, probabilities: { [intent]: p } },
		weight: { type: 'score', score },
		lang: { type: 'choice', choice: lang }
	}
});

describe('triage', () => {
	it('asks Jev three typed questions about the message, with the site topics', () => {
		const input = jevInput('ciao', ['Relay']);
		expect(input.state).toEqual({ visitor_message: 'ciao', site_topics: ['Relay'] });
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

	it('blocks on the off-topic mass, not on the chosen category alone', () => {
		const triage = (p: Record<string, number>, choice: string) =>
			parseTriage(
				{
					answers: {
						intent: { type: 'choice', choice, probabilities: p },
						weight: { type: 'score', score: 0 },
						lang: { type: 'choice', choice: 'it' }
					}
				},
				0
			);
		// Fuori tema 0,61 più abuso 0,09: nessuna sopra soglia da sola, insieme sì.
		const impersonation = triage({ offtopic: 0.61, abuse: 0.09, about: 0.3, code: 0 }, 'offtopic');
		expect(admits(impersonation)).toBe(false);
		expect(blockReason(impersonation)).toBe('offtopic');
		// Domanda di confine data per fuori tema 0,53: in tema per 0,47, passa.
		expect(admits(triage({ offtopic: 0.53, about: 0.47 }, 'offtopic'))).toBe(true);
		// L'abuso ha una soglia sua.
		const passwd = triage({ abuse: 0.55, offtopic: 0.44, code: 0.01 }, 'abuse');
		expect(admits(passwd)).toBe(false);
		expect(blockReason(passwd)).toBe('abuse');
	});

	it('treats a message as small talk only when Jev is sure', () => {
		const triage = (p: Record<string, number>, choice: string) =>
			parseTriage(
				{
					answers: {
						intent: { type: 'choice', choice, probabilities: p },
						weight: { type: 'score', score: 0 },
						lang: { type: 'choice', choice: 'it' }
					}
				},
				0
			);
		expect(isSmallTalk(triage({ chat: 1 }, 'chat'))).toBe(true);
		// Una domanda vera letta per metà come chiacchiera resta una domanda.
		expect(isSmallTalk(triage({ chat: 0.38, about: 0.28, offtopic: 0.34 }, 'chat'))).toBe(false);
	});

	it('lets on-topic requests and small talk through, not off-topic tasks or abuse', () => {
		expect(admits(parseTriage(output('about', 0, 'it'), 0))).toBe(true);
		expect(admits(parseTriage(output('code', 2, 'en'), 0))).toBe(true);
		// Un saluto o una battuta passano: l'agente risponde in breve, senza tool.
		expect(admits(parseTriage(output('chat', 0, 'it'), 0))).toBe(true);
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

describe('credits', () => {
	it('shows a spend as whole credits, never zero for a real cost', () => {
		expect(credits(0.1)).toBe(1000);
		expect(credits(0.0007)).toBe(7);
		expect(credits(0.00001)).toBe(1);
		expect(credits(0)).toBe(0);
	});

	it('resets at the next UTC midnight', () => {
		expect(nextReset(new Date('2026-10-03T23:59:00Z')).toISOString()).toBe(
			'2026-10-04T00:00:00.000Z'
		);
	});
});
