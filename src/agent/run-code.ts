import type { JsonObject, TextContent } from '@earendil-works/pi-ai';
import { validateToolArguments } from '@earendil-works/pi-ai/utils/validation';
import type { ToolRegistration } from '@earendil-works/pi-durable';
import {
	DynamicWorkerExecutor,
	generateTypesFromJsonSchema,
	truncateResult
} from '@cloudflare/codemode';

/**
 * `run_code`: Cloudflare's Code Mode. The model writes a JavaScript function that calls the
 * other read-only tools as `codemode.name({ ... })`, and the function runs in a throwaway
 * Dynamic Worker: no network (`globalOutbound: null`), no environment, a time limit. It
 * helps when a question needs many calls or a computation over the results: one model turn
 * instead of ten.
 *
 * Every call from the sandbox goes through the same argument validation pi applies for the
 * model, and through the tool's own `execute`.
 */

/** The limits of one execution. */
export const RUN_LIMITS = {
	/** Maximum time of an execution, tool calls included. */
	timeoutMs: 20_000,
	/** Tool calls per execution: a wrong loop does not drain the GitHub quota. */
	calls: 40,
	codeChars: 8000,
	/** The result that goes back to the model, serialized. */
	resultChars: 8000,
	logLines: 50
} as const;

/** The outcome of one execution. */
export interface RunOutcome {
	result?: unknown;
	error?: string;
	logs: string[];
	calls: number;
}

/** The text of a tool result, as JSON when it parses. */
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

/** The TypeScript declarations of the tools, for the description of `run_code`. */
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

/** Runs `code` in a Dynamic Worker with the tools exposed as `codemode.*`. */
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
				// Read-only tools use neither the invocation api nor pi's context.
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
