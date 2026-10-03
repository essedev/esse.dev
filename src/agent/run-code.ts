import type { JsonObject, TextContent } from '@earendil-works/pi-ai';
import { validateToolArguments } from '@earendil-works/pi-ai/utils/validation';
import type { ToolRegistration } from '@earendil-works/pi-durable';
import {
	DynamicWorkerExecutor,
	generateTypesFromJsonSchema,
	truncateResult
} from '@cloudflare/codemode';

/**
 * `run_code`: il Code Mode di Cloudflare. Il modello scrive una funzione JavaScript che
 * chiama gli altri tool di sola lettura come `codemode.nome({ ... })`, e la funzione gira
 * in un Dynamic Worker usa e getta: niente rete (`globalOutbound: null`), niente
 * ambiente, un tempo massimo. Serve quando una domanda chiede tante chiamate o un calcolo
 * sui risultati: un solo giro del modello invece di dieci.
 *
 * Ogni chiamata dal sandbox passa dalla stessa validazione degli argomenti che pi fa per
 * il modello, e dallo stesso `execute` del tool.
 */

export const RUN_LIMITS = {
	/** Tempo massimo di un'esecuzione, chiamate ai tool comprese. */
	timeoutMs: 20_000,
	/** Chiamate ai tool per esecuzione: un ciclo sbagliato non svuota la quota di GitHub. */
	calls: 40,
	codeChars: 8000,
	/** Il risultato che torna al modello, serializzato. */
	resultChars: 8000,
	logLines: 50
} as const;

export interface RunOutcome {
	result?: unknown;
	error?: string;
	logs: string[];
	calls: number;
}

/** Il testo di un risultato di tool, come JSON se lo è. */
function payload(content: readonly { type: string }[] | undefined): unknown {
	const text = (content ?? [])
		.filter((c): c is TextContent => c.type === 'text')
		.map((c) => c.text)
		.join('\n');
	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
}

/** Le dichiarazioni TypeScript dei tool, da mettere nella descrizione di `run_code`. */
export function sandboxTypes(tools: readonly ToolRegistration[]): string {
	return generateTypesFromJsonSchema(
		Object.fromEntries(
			tools.map((t) => [
				t.name,
				{ description: t.description, inputSchema: t.parameters as object }
			])
		)
	);
}

export async function runCode(
	loader: WorkerLoader,
	tools: readonly ToolRegistration[],
	code: string
): Promise<RunOutcome> {
	if (code.length > RUN_LIMITS.codeChars) {
		return { error: `Code longer than ${RUN_LIMITS.codeChars} characters.`, logs: [], calls: 0 };
	}
	let calls = 0;
	const fns = Object.fromEntries(
		tools.map((tool) => [
			tool.name,
			async (...args: unknown[]) => {
				if (++calls > RUN_LIMITS.calls) {
					throw new Error(`More than ${RUN_LIMITS.calls} tool calls in one run.`);
				}
				const valid = validateToolArguments(tool, {
					type: 'toolCall',
					id: `run-${calls}`,
					name: tool.name,
					arguments: (args[0] ?? {}) as JsonObject
				});
				// I tool di sola lettura non usano l'api dell'invocazione né il contesto di pi.
				const out = await tool.execute(valid, undefined as never, undefined as never);
				if (out.isError) throw new Error(String(payload(out.content)));
				return payload(out.content);
			}
		])
	);
	const executor = new DynamicWorkerExecutor({
		loader,
		timeout: RUN_LIMITS.timeoutMs,
		globalOutbound: null
	});
	const run = await executor.execute(code, [{ name: 'codemode', fns }]);
	return {
		result: truncateResult(run.result, { maxChars: RUN_LIMITS.resultChars }),
		error: run.error,
		logs: (run.logs ?? []).slice(0, RUN_LIMITS.logLines),
		calls
	};
}
