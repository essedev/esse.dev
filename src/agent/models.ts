import type { Api, Model, Provider } from '@earendil-works/pi-ai';
import { createModels, type MutableModels } from '@earendil-works/pi-ai/models';
import { openrouterProvider } from '@earendil-works/pi-ai/providers/openrouter';

/**
 * The agent's models, from OpenRouter. One model for now, `glm-5.3-flash`, on the fastest
 * providers (Artificial Analysis: BaseTen 225 tokens/s and 0.5 s to first token, against 45
 * and 3.3 s for Z.ai): OpenRouter tries them in order and moves to the next if one does not
 * answer, within the same request. The price is the same on all three, so the cost pi-ai
 * computes stays exact even after a provider change.
 */

/** The model the agent runs on. */
export const MODEL = { provider: 'openrouter', id: 'z-ai/glm-5.3-flash' } as const;

const ROUTING = {
	order: ['baseten', 'fireworks', 'parasail'],
	allow_fallbacks: true
};

/**
 * Past this time without a response the call fails and pi retries it (`retry` in the
 * harness settings). It covers a provider that stops sending tokens without closing the
 * connection; the default would be 10 minutes.
 */
const STREAM_TIMEOUT_MS = 30_000;

/** The OpenRouter provider with only our models, the routing and the timeout. */
function siteProvider(): Provider {
	const base = openrouterProvider() as Provider;
	const model = base.getModels().find((m) => m.id === MODEL.id);
	if (!model) throw new Error(`OpenRouter catalog has no ${MODEL.id}`);
	const routed: Model<Api> = {
		...model,
		compat: { ...model.compat, openRouterRouting: ROUTING }
	} as Model<Api>;
	return {
		...base,
		getModels: () => [routed],
		getAllModels: undefined,
		// The cast keeps the generic of `stream`: the options are the same, plus the timeout.
		stream: ((m, context, options) =>
			base.stream(m, context, {
				timeoutMs: STREAM_TIMEOUT_MS,
				...options
			} as typeof options)) as Provider['stream'],
		streamSimple: (m, context, options) =>
			base.streamSimple(m, context, { timeoutMs: STREAM_TIMEOUT_MS, ...options })
	};
}

/**
 * The model registry for pi. The key comes from the Worker (`OPENROUTER_API_KEY`): a Worker
 * has no process environment pi-ai could read it from on its own.
 */
export function siteModels(apiKey: string | undefined): MutableModels {
	const models = createModels({
		authContext: {
			env: async (name) => (name === 'OPENROUTER_API_KEY' ? apiKey : undefined),
			fileExists: async () => false
		}
	});
	models.setProvider(siteProvider());
	return models;
}
