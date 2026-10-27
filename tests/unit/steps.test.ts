import { describe, expect, it } from 'vitest';
import { describeStep, fillStep } from '../../src/agent/steps';

describe('describeStep', () => {
	it('gives each tool its family, unknown ones a family of their own', () => {
		expect(describeStep('search_site', {}).family).toBe('site');
		expect(describeStep('read_file', {}).family).toBe('code');
		expect(describeStep('run_code', {}).family).toBe('code');
		expect(describeStep('delegate', {}).family).toBe('agents');
		expect(describeStep('get_budget', {}).family).toBe('other');
	});

	it('takes the values of the sentence from the arguments', () => {
		const step = describeStep('read_file', {
			repo: 'essedev/esse.dev',
			path: '/src/agent/triage.ts'
		});
		expect(step.values).toMatchObject({
			repo: 'essedev/esse.dev',
			path: 'src/agent/triage.ts',
			file: 'triage.ts'
		});
		expect(
			describeStep('run_code', { code: 'async () => {\n  const r = await codemode.search_site();' })
				.values.line
		).toBe('const r = await codemode.search_site();');
	});

	it('counts what a result holds, by tool', () => {
		const json = (value: unknown) => ({ text: JSON.stringify(value), error: false });
		expect(describeStep('search_site', {}, json([1, 2, 3])).count).toEqual({
			kind: 'results',
			n: 3
		});
		expect(describeStep('list_projects', {}, json([1])).count).toEqual({ kind: 'projects', n: 1 });
		expect(describeStep('recent_commits', {}, json([1, 2])).count).toEqual({
			kind: 'commits',
			n: 2
		});
		expect(
			describeStep('list_files', {}, json({ entries: [1, 2], truncated: false })).count
		).toEqual({ kind: 'files', n: 2 });
		expect(describeStep('search_code', {}, json({ mode: 'code', matches: [1] })).count).toEqual({
			kind: 'results',
			n: 1
		});
		const file = { text: 'src/a.ts\n    1  import x\n    2  \n   10  export y', error: false };
		expect(describeStep('read_file', {}, file).count).toEqual({ kind: 'lines', n: 3 });
	});

	it('counts nothing on an error, an unreadable result or a tool that does not count', () => {
		expect(describeStep('search_site', {}, { text: '[1]', error: true }).count).toBeUndefined();
		expect(
			describeStep('search_site', {}, { text: 'not json', error: false }).count
		).toBeUndefined();
		expect(describeStep('read_page', {}, { text: '[1]', error: false }).count).toBeUndefined();
		expect(describeStep('search_site', {}).count).toBeUndefined();
	});
});

describe('fillStep', () => {
	it('fills the slots and leaves an unknown one empty', () => {
		expect(fillStep('cerca «{query}»', { query: 'relay' })).toBe('cerca «relay»');
		expect(fillStep('legge {file}  in {repo}', { file: 'a.ts' })).toBe('legge a.ts in');
	});
});
