import { costOf } from './budget';

/**
 * `delegate`: 2 o 3 sotto-agenti in parallelo, ognuno una conversazione di pi posseduta
 * dalla chiamata al tool (lo schema dei sotto-agenti del README di pi-durable): fermare il
 * padre ferma i figli, e una ripresa dopo un crash ritrova i figli e le loro richieste.
 * I figli hanno solo i tool di sola lettura, niente `delegate` né `run_code`.
 *
 * Qui la parte pura: dal transcript di un figlio, la risposta, le chiamate fatte, token e
 * costo, che il padre riceve e la pagina mostra.
 */

export const DELEGATE_LIMITS = { min: 2, max: 3, titleChars: 60, taskChars: 1000 } as const;

export const CHILD_INSTRUCTIONS =
	'You are a sub-agent working on one part of a larger question for the main agent, not for the visitor. You have a small token budget: go straight to what matters, prefer search_code and the README to reading whole files, and read at most three files. Then answer with the findings only: concrete, under 150 words, with the paths or GitHub links you used. No greetings, no questions back.';

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

/** Il resoconto di un figlio dalle sue voci, in ordine: l'ultima risposta di testo è quella. */
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
