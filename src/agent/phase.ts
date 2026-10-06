/**
 * The agent page's states, read from the session view: the phase of the work in progress
 * and the kind of an error. Pure, used by the transcript in the browser and by the tests.
 */

import type { PiSessionView } from './view';

/**
 * What the agent is doing now, for the status line under the answer. Read from what the
 * client already has: the visitor's message waiting for Jev, pi's run, the tools running,
 * the last part of the message being streamed, the retry backoff.
 */
export type Phase =
	| { readonly kind: 'triage' }
	| { readonly kind: 'think' }
	| { readonly kind: 'reason' }
	| { readonly kind: 'tool'; readonly name: string }
	| { readonly kind: 'write' }
	| { readonly kind: 'retry'; readonly at: number; readonly error: string };

/**
 * The phase of a session, or `null` when nothing is in progress. `waiting` is the message
 * sent and not yet in the transcript: `triage` until Jev answers, `admitted` after.
 */
export function phaseOf(view: PiSessionView, waiting: 'triage' | 'admitted' | null): Phase | null {
	if (view.retry) return { kind: 'retry', at: view.retry.at, error: view.retry.error };
	const tool = view.tools.at(-1);
	if (tool) return { kind: 'tool', name: tool.name };
	const last = view.live?.parts.at(-1);
	if (last?.type === 'text' && last.text.trim()) return { kind: 'write' };
	if (last?.type === 'thinking') return { kind: 'reason' };
	// The model is writing the arguments of a call: the tool is already decided.
	if (last?.type === 'tool-call') return { kind: 'tool', name: last.name };
	if (view.running) return { kind: 'think' };
	if (waiting === 'triage') return { kind: 'triage' };
	if (waiting === 'admitted') return { kind: 'think' };
	return null;
}

/** Why an answer did not arrive, as the visitor reads it. */
export type ErrorKind = 'provider' | 'timeout' | 'aborted' | 'internal';

/**
 * The kind of an error from pi, the provider or the socket. The text is not a contract (pi
 * and the providers write what they want): what is not recognized is `internal`.
 */
export function errorKind(message: string): ErrorKind {
	if (/abort/i.test(message)) return 'aborted';
	if (/time[sd]?[\s_-]?out|deadline|exceeded/i.test(message)) return 'timeout';
	if (
		/\b(408|429|5\d\d)\b|provider|upstream|overloaded|rate[\s_-]?limit|unavailable|openrouter/i.test(
			message
		)
	) {
		return 'provider';
	}
	return 'internal';
}
