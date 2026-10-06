import { describe, expect, it } from 'vitest';
import { errorKind, phaseOf } from '../../src/agent/phase';
import type { PiMessage, PiMessagePart } from '../../src/agent/transcript';
import { EMPTY_VIEW, type PiSessionView } from '../../src/agent/view';

const live = (...parts: PiMessagePart[]): PiMessage => ({
	id: 'live',
	role: 'assistant',
	parts,
	timestamp: 0
});
const view = (patch: Partial<PiSessionView>): PiSessionView => ({ ...EMPTY_VIEW, ...patch });

describe('phaseOf', () => {
	it('is idle with nothing running and nothing waiting', () => {
		expect(phaseOf(EMPTY_VIEW, null)).toBeNull();
	});

	it('waits for Jev, then for the run, before pi starts', () => {
		expect(phaseOf(EMPTY_VIEW, 'triage')).toEqual({ kind: 'triage' });
		expect(phaseOf(EMPTY_VIEW, 'admitted')).toEqual({ kind: 'think' });
	});

	it('thinks while the run has no message yet', () => {
		expect(phaseOf(view({ running: true }), null)).toEqual({ kind: 'think' });
	});

	it('follows the last part of the message being streamed', () => {
		const running = { running: true };
		expect(
			phaseOf(view({ ...running, live: live({ type: 'thinking', text: 'hm' }) }), null)
		).toEqual({ kind: 'reason' });
		expect(
			phaseOf(
				view({
					...running,
					live: live({ type: 'thinking', text: 'hm' }, { type: 'text', text: 'Fanno' })
				}),
				null
			)
		).toEqual({ kind: 'write' });
		expect(
			phaseOf(
				view({
					...running,
					live: live({ type: 'tool-call', id: '1', name: 'search_site', arguments: {} })
				}),
				null
			)
		).toEqual({ kind: 'tool', name: 'search_site' });
	});

	it('does not say "writes" for a text part that is still empty', () => {
		expect(phaseOf(view({ running: true, live: live({ type: 'text', text: ' ' }) }), null)).toEqual(
			{
				kind: 'think'
			}
		);
	});

	it('names the last tool running, over the streamed message', () => {
		const v = view({
			running: true,
			live: live({ type: 'text', text: 'x' }),
			tools: [
				{ callId: 'a', name: 'search_site', output: '' },
				{ callId: 'b', name: 'read_page', output: '' }
			]
		});
		expect(phaseOf(v, null)).toEqual({ kind: 'tool', name: 'read_page' });
	});

	it('puts the retry backoff over everything, with when it ends', () => {
		const v = view({
			running: true,
			tools: [{ callId: 'a', name: 'search_site', output: '' }],
			retry: { at: 1000, error: '502' }
		});
		expect(phaseOf(v, 'triage')).toEqual({ kind: 'retry', at: 1000, error: '502' });
	});
});

describe('errorKind', () => {
	it('recognizes a stop by the visitor', () => {
		expect(errorKind('Request was aborted')).toBe('aborted');
		expect(errorKind('aborted')).toBe('aborted');
	});

	it('recognizes a timeout', () => {
		expect(errorKind('Not answered: timeout')).toBe('timeout');
		expect(errorKind('run exceeded 120000 ms')).toBe('timeout');
		expect(errorKind('The operation timed out')).toBe('timeout');
	});

	it('recognizes the provider or the model', () => {
		expect(errorKind('Not answered: provider_error')).toBe('provider');
		expect(errorKind('429 Provider returned error')).toBe('provider');
		expect(errorKind('502 Bad Gateway')).toBe('provider');
		expect(errorKind('upstream connect error')).toBe('provider');
		expect(errorKind('Service Unavailable')).toBe('provider');
	});

	it('calls internal what it does not recognize', () => {
		expect(errorKind('Malformed JSON')).toBe('internal');
		expect(errorKind('')).toBe('internal');
	});
});
