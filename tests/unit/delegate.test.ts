import { describe, expect, it } from 'vitest';
import { childReport } from '../../src/agent/delegate';

const assistant = (content: unknown[], tokens: number, usd: number) => ({
	model: [{ role: 'assistant', content, usage: { totalTokens: tokens, cost: { total: usd } } }]
});

describe('childReport', () => {
	it('keeps the last text answer, every tool call, tokens and cost', () => {
		const report = childReport('Relay', [
			{ model: [{ role: 'user', content: 'find it' }] },
			assistant(
				[{ type: 'toolCall', name: 'repo_overview', arguments: { repo: 'essedev/relay' } }],
				900,
				0.0001
			),
			{ model: [{ role: 'toolResult', content: [{ type: 'text', text: '{}' }] }] },
			assistant(
				[
					{ type: 'thinking', text: 'hmm' },
					{ type: 'text', text: 'Relay is Swift.' }
				],
				1200,
				0.0002
			)
		]);
		expect(report).toMatchObject({
			title: 'Relay',
			answer: 'Relay is Swift.',
			calls: [{ name: 'repo_overview', arguments: { repo: 'essedev/relay' } }],
			tokens: 2100
		});
		expect(report.usd).toBeCloseTo(0.0003, 10);
	});

	it('reports an empty answer when the child never wrote text', () => {
		expect(childReport('x', []).answer).toBe('');
	});
});
