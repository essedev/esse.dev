import { defineDoc } from '@earendil-works/pi-durable';
import { costOf } from './budget';

/**
 * `delegate`: one to three sub-agents that work in the background, the persistent subagent
 * pattern of pi-durable (its example 23): each child is a pi conversation owned by a
 * background anchor task, and a background reporter task per child waits for its answer,
 * charges it and posts it to the main conversation as a new message. The main agent's turn
 * ends at once, so the visitor keeps talking while the children work. Children get
 * read-only tools only, no `delegate` and no `run_code`.
 *
 * This module holds the pure part: the children's record, the report a child hands back,
 * and the text that carries it into the main conversation. The tasks are in `site-agent.ts`.
 */

/**
 * How many sub-agents one call may start, how many may work at once in a conversation, and
 * the length limits of their titles and tasks.
 */
export const DELEGATE_LIMITS = {
	min: 1,
	max: 3,
	live: 3,
	titleChars: 60,
	taskChars: 1000
} as const;

/** The system prompt of a child; an LLM reads it, so it stays as written. */
export const CHILD_INSTRUCTIONS =
	'You are a sub-agent working on one part of a larger question for the main agent, not for the visitor. You have a small token budget: go straight to what matters, prefer search_code and the README to reading whole files, and read at most three files. Then answer with the findings only: concrete, under 150 words, with the paths or GitHub links you used. No greetings, no questions back.';

/** Where a child is: at work, answered, failed, or stopped by the visitor. */
export type ChildStatus = 'working' | 'done' | 'failed' | 'stopped';

/** One child of the conversation, as the page lists it and the budget reserves it. */
export type ChildRecord = {
	/** The child's pi conversation, which is also its session id on the socket. */
	id: number;
	title: string;
	/** The `delegate` call (its tool task) that started it: a rerun finds its children again. */
	call: number;
	status: ChildStatus;
	/** Milliseconds since the epoch. */
	started: number;
	ended?: number;
	/** Dollars held back from the visitor's budget while the child works: its worst case. */
	reserved: number;
	tokens?: number;
	usd?: number;
	error?: string;
};

/** The children of a conversation, in the order they started. */
export const Children = defineDoc<{ children: ChildRecord[] }>({
	kind: 'app.children',
	version: 1,
	scope: 'conversation',
	history: 'latest',
	// A fork of the main conversation starts without children.
	fork: 'initial',
	initial: () => ({ children: [] })
});

/** The children still at work. */
export function liveChildren(children: readonly ChildRecord[]): ChildRecord[] {
	return children.filter((c) => c.status === 'working');
}

/** The dollars the children at work hold back from the budget. */
export function reservedUsd(children: readonly ChildRecord[]): number {
	return liveChildren(children).reduce((sum, c) => sum + c.reserved, 0);
}

const STATE: Record<ChildStatus, string> = {
	working: 'working, its report has not arrived yet',
	done: 'finished, its report is in the conversation',
	failed: 'failed, no findings',
	stopped: 'stopped by the visitor, no report'
};

/** The prompt section on the children of a conversation; `undefined` drops it when there are none. */
export function childrenSection(children: readonly ChildRecord[] | undefined): string | undefined {
	if (!children?.length) return undefined;
	const lines = children.map((c) => `- #${c.id} "${c.title}": ${STATE[c.status]}.`);
	return `Your sub-agents in this conversation:\n${lines.join('\n')}`;
}

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

/**
 * `delegate`'s arguments with the common slip repaired: one task passed as `{ task, title }`
 * instead of `{ tasks: [...] }`, which a single sub-agent invites. Anything else is left as it
 * is for validation.
 */
export function delegateArgs(args: unknown): unknown {
	if (typeof args !== 'object' || args === null || 'tasks' in args) return args;
	const { task, title } = args as { task?: unknown; title?: unknown };
	if (typeof task !== 'string') return args;
	const name = typeof title === 'string' && title.trim() ? title : task;
	return { tasks: [{ title: name.slice(0, DELEGATE_LIMITS.titleChars), task }] };
}

/** A finished child, as it reaches the main conversation. */
export type ParsedReport = {
	id: number;
	title: string;
	status: 'finished' | 'failed';
	body: string;
};

const REPORT = /^\[sub-agent #(\d+) "([^"\]]*)" (finished|failed)\]\n([\s\S]*)$/;

/** The title as the report header can carry it: no quotes or brackets, one line. */
function headerTitle(title: string): string {
	return title.replace(/["\]\n]/g, ' ').trim();
}

/**
 * The message that brings a child's findings to the main agent. It starts a turn, so it is a
 * user message: the header tells the model, and the page, that it is not the visitor's.
 */
export function reportText(
	id: number,
	report: Pick<ChildReport, 'title' | 'answer' | 'error'>
): string {
	const status = report.error || !report.answer ? 'failed' : 'finished';
	const body =
		status === 'finished' ? report.answer : `No findings (${report.error ?? 'empty answer'}).`;
	return `[sub-agent #${id} "${headerTitle(report.title)}" ${status}]\n${body}`;
}

/** A child's report from the text of a user message; `null` if the message is not one. */
export function parseReport(text: string): ParsedReport | null {
	const match = REPORT.exec(text);
	if (!match) return null;
	return {
		id: Number(match[1]),
		title: match[2],
		status: match[3] as ParsedReport['status'],
		body: match[4]
	};
}

/** The entry kind of a note about a child for the model only: the page does not show it. */
export const CHILD_NOTE_ENTRY = 'app.child-note';

/** A model-only note for a child the visitor stopped: it has no findings to wait for. */
export function stoppedNote(title: string): string {
	return `[Note from the site, not from the visitor] The visitor stopped the sub-agent "${headerTitle(title)}": it will not report. Do not wait for it; if its part still matters, say so or answer it yourself.`;
}
