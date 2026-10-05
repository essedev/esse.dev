import { costOf } from './budget';

/**
 * `delegate`: two or three sub-agents in parallel, each a pi conversation owned by the tool
 * call (the sub-agent pattern from the pi-durable README): stopping the parent stops the
 * children, and a resume after a crash finds the children and their requests again.
 * Children get read-only tools only, no `delegate` and no `run_code`.
 *
 * This is the pure part: from a child's transcript, the answer, the calls made, tokens and
 * cost, which the parent receives and the page shows.
 */

/** How many sub-agents one call may start, and the length limits of their titles and tasks. */
export const DELEGATE_LIMITS = { min: 2, max: 3, titleChars: 60, taskChars: 1000 } as const;

/** The system prompt of a child; an LLM reads it, so it stays as written. */
export const CHILD_INSTRUCTIONS =
	'You are a sub-agent working on one part of a larger question for the main agent, not for the visitor. You have a small token budget: go straight to what matters, prefer search_code and the README to reading whole files, and read at most three files. Then answer with the findings only: concrete, under 150 words, with the paths or GitHub links you used. No greetings, no questions back.';

/** What a child hands back to the parent. */
export interface ChildReport {
	title: string;
	answer: string;
	calls: { name: string; arguments: unknown }[];
	tokens: number;
	usd: number;
	error?: string;
}

type Part = { type: string; text?: string; name?: string; arguments?: unknown };
type ModelMessage = {
	role?: string;
	content?: readonly Part[] | string;
	usage?: { totalTokens?: number; cost?: { total?: number } };
};

/** A child's report from its transcript entries, in order: the last text answer is the answer. */
export function childReport(
	title: string,
	entries: readonly { model?: readonly unknown[] }[]
): ChildReport {
	const assistant = entries
		.map((e) => e.model?.[0] as ModelMessage | undefined)
		.filter((m): m is ModelMessage => m?.role === 'assistant');
	const parts = assistant.flatMap((m) => (Array.isArray(m.content) ? m.content : []));
	const texts = assistant
		.map((m) =>
			(Array.isArray(m.content) ? m.content : [])
				.filter((p) => p.type === 'text' && p.text?.trim())
				.map((p) => p.text!.trim())
				.join('\n')
		)
		.filter(Boolean);
	return {
		title,
		answer: texts.at(-1) ?? '',
		calls: parts
			.filter((p) => p.type === 'toolCall' && p.name)
			.map((p) => ({ name: p.name!, arguments: p.arguments ?? {} })),
		tokens: assistant.reduce((sum, m) => sum + (m.usage?.totalTokens ?? 0), 0),
		usd: costOf(assistant)
	};
}
