import type { Api, Model, Provider } from '@earendil-works/pi-ai';
import { createModels, type MutableModels } from '@earendil-works/pi-ai/models';
import { openrouterProvider } from '@earendil-works/pi-ai/providers/openrouter';

/**
 * I modelli dell'agente, da OpenRouter. Un solo modello per ora, `glm-5.3-flash`, sui
 * provider più veloci (Artificial Analysis: BaseTen 225 token/s e 0,5 s al primo token,
 * contro i 45 e 3,3 s di Z.ai): OpenRouter li prova in ordine e passa al successivo se uno
 * non risponde, nella stessa richiesta. Stesso prezzo su tutti e tre, quindi il costo che
 * pi-ai calcola resta esatto anche dopo un cambio di provider.
 */

export const MODEL = { provider: 'openrouter', id: 'z-ai/glm-5.3-flash' } as const;

const ROUTING = {
	order: ['baseten', 'fireworks', 'parasail'],
	allow_fallbacks: true
};

/**
 * Oltre questo tempo senza risposta la chiamata fallisce e pi la riprova (`retry` nelle
 * impostazioni dell'harness). Copre il provider che smette di mandare token senza
 * chiudere la connessione; il predefinito sarebbe 10 minuti.
 */
const STREAM_TIMEOUT_MS = 30_000;

/** Il provider di OpenRouter con solo i nostri modelli, il routing e il timeout. */
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
		// Il cast tiene il generico di `stream`: le opzioni sono le stesse, più il timeout.
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
 * Il registro dei modelli per pi. La chiave arriva dal Worker (`OPENROUTER_API_KEY`):
 * nel Worker non c'è un ambiente di processo da cui pi-ai possa leggerla da solo.
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
