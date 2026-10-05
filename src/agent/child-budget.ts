import type { Message } from '@earendil-works/pi-ai';
import {
	defineExtension,
	GenerationTask,
	hook,
	ToolTask,
	UsageDoc,
	type UsageState
} from '@earendil-works/pi-durable';

/**
 * The token cap of a `delegate` sub-agent. Every model turn resends the whole context, so
 * tokens grow faster than the number of reads: without a cap a child used up to 41,000. At
 * the cap the child must answer with what it has: the request is rewritten to ask for the
 * final answer, and a tool call made anyway is blocked. The extension is selected on
 * children only.
 */

/** Tokens per child, input and output of all turns summed. */
export const CHILD_TOKEN_CAP = 12_000;

/** One extra turn past the cap: the request that carries the final answer. */
export const CHILD_TOKEN_OVERSHOOT = 8000;

const WRAP_UP =
	'Your token budget for this task is used up. Do not call tools: write your final findings now, with what you already found.';

/** The tokens used by a conversation, from `pi.usage`. */
export function usedTokens(state: Readonly<UsageState> | undefined): number {
	if (!state) return 0;
	return Object.values(state.models).reduce((sum, usage) => {
		const u = usage as { totalTokens?: number } | null;
		return sum + (u?.totalTokens ?? 0);
	}, 0);
}

/** A rough token estimate for a request: four characters per token. */
export function estimateTokens(messages: readonly Message[]): number {
	return Math.ceil(JSON.stringify(messages).length / 4);
}

/** Would the next request take the child over the cap? */
export function overCap(used: number, nextRequest: number): boolean {
	return used + nextRequest > CHILD_TOKEN_CAP;
}

/** The pi-durable extension that enforces the child token cap. */
export const ChildBudget = defineExtension({
	name: 'child-budget',
	hooks: [
		hook(GenerationTask, {
			beforeRequest: async (request, api, context) => {
				const used = usedTokens(await api.snapshot(UsageDoc, api.conversationId, context));
				if (!overCap(used, estimateTokens(request.messages))) return undefined;
				const wrapUp: Message = { role: 'user', content: WRAP_UP, timestamp: Date.now() };
				return { messages: [...request.messages, wrapUp] };
			}
		}),
		hook(ToolTask, {
			beforeTool: async (_call, api, context) => {
				const used = usedTokens(await api.snapshot(UsageDoc, api.conversationId, context));
				return used > CHILD_TOKEN_CAP ? { block: WRAP_UP } : undefined;
			}
		})
	]
});
