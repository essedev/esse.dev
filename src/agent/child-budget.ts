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
 * Il tetto di token di un sotto-agente di `delegate`. Ogni giro del modello rimanda tutto
 * il contesto, quindi i token crescono più che in proporzione alle letture: senza tetto un
 * figlio ne ha usati fino a 41.000. Arrivato al tetto, il figlio deve rispondere con quello
 * che ha: prima della richiesta gli si chiede la risposta finale, e un tool chiamato lo
 * stesso viene bloccato. L'estensione è selezionata solo sui figli.
 */

/** Token per figlio, input e output di tutti i giri sommati. */
export const CHILD_TOKEN_CAP = 12_000;

/** Un giro in più dopo il tetto: la richiesta che porta la risposta finale. */
export const CHILD_TOKEN_OVERSHOOT = 8000;

const WRAP_UP =
	'Your token budget for this task is used up. Do not call tools: write your final findings now, with what you already found.';

/** I token usati da una conversazione, da `pi.usage`. */
export function usedTokens(state: Readonly<UsageState> | undefined): number {
	if (!state) return 0;
	return Object.values(state.models).reduce((sum, usage) => {
		const u = usage as { totalTokens?: number } | null;
		return sum + (u?.totalTokens ?? 0);
	}, 0);
}

/** Una stima grezza dei token di una richiesta: quattro caratteri per token. */
export function estimateTokens(messages: readonly Message[]): number {
	return Math.ceil(JSON.stringify(messages).length / 4);
}

/** La prossima richiesta porterebbe il figlio oltre il tetto? */
export function overCap(used: number, nextRequest: number): boolean {
	return used + nextRequest > CHILD_TOKEN_CAP;
}

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
