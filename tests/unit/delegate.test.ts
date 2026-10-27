import { describe, expect, it } from 'vitest';
import {
	childReport,
	childrenSection,
	delegateArgs,
	parseReport,
	reportText,
	reservedUsd,
	type ChildRecord
} from '../../src/agent/delegate';

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

const child = (status: ChildRecord['status'], reserved: number): ChildRecord => ({
	id: 1,
	title: 't',
	call: 1,
	status,
	started: 0,
	reserved
});

describe('reservedUsd', () => {
	it('holds back only the children at work', () => {
		expect(
			reservedUsd([child('working', 0.002), child('done', 0.002), child('working', 0.001)])
		).toBeCloseTo(0.003, 10);
		expect(reservedUsd([])).toBe(0);
	});
});

describe('reportText and parseReport', () => {
	it('round-trips a finished report', () => {
		const text = reportText(12, {
			title: 'Relay "repo" [deep]',
			answer: 'Relay is Swift.\nSee README.'
		});
		expect(text.startsWith('[sub-agent #12 "Relay  repo  [deep" finished]\n')).toBe(true);
		expect(parseReport(text)).toEqual({
			id: 12,
			title: 'Relay  repo  [deep',
			status: 'finished',
			body: 'Relay is Swift.\nSee README.'
		});
	});

	it('marks a report without an answer as failed', () => {
		expect(parseReport(reportText(3, { title: 'x', answer: '', error: 'timeout' }))).toMatchObject({
			status: 'failed',
			body: 'No findings (timeout).'
		});
		expect(parseReport(reportText(3, { title: 'x', answer: '' }))?.status).toBe('failed');
	});

	it('does not read a visitor message as a report', () => {
		expect(parseReport('what is [sub-agent #1 "x" finished]?')).toBeNull();
		expect(parseReport('[sub-agent #1 "x" finished] no newline')).toBeNull();
	});
});

describe('delegateArgs', () => {
	it('wraps a single task passed without the array', () => {
		expect(delegateArgs({ task: 'read triage.ts', title: 'Triage' })).toEqual({
			tasks: [{ title: 'Triage', task: 'read triage.ts' }]
		});
		expect(delegateArgs({ task: 'x'.repeat(80) })).toEqual({
			tasks: [{ title: 'x'.repeat(60), task: 'x'.repeat(80) }]
		});
	});

	it('leaves well-formed and unknown shapes to validation', () => {
		const ok = { tasks: [{ title: 'a', task: 'b' }] };
		expect(delegateArgs(ok)).toBe(ok);
		expect(delegateArgs({ foo: 1 })).toEqual({ foo: 1 });
		expect(delegateArgs('x')).toBe('x');
	});
});

describe('childrenSection', () => {
	it('lists every child with its state, and is dropped without children', () => {
		expect(childrenSection(undefined)).toBeUndefined();
		expect(childrenSection([])).toBeUndefined();
		expect(
			childrenSection([child('working', 0), { ...child('stopped', 0), id: 2, title: 'b' }])
		).toBe(
			'Your sub-agents in this conversation:\n- #1 "t": working, its report has not arrived yet.\n- #2 "b": stopped by the visitor, no report.'
		);
	});
});
