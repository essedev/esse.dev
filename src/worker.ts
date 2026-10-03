import { handle } from '@astrojs/cloudflare/handler';
import { routeAgentRequest } from 'agents';

/**
 * Entry del Worker. Le richieste `/agents/*` vanno ai Durable Object dell'agente (anche
 * l'upgrade a WebSocket); tutto il resto ad Astro, come con l'entry predefinita
 * dell'adapter. Le pagine restano statiche: questo codice gira solo dove gira già il
 * Worker.
 */
export { Ledger } from './agent/ledger';
export { SiteAgent } from './agent/site-agent';

export default {
	async fetch(request, env, ctx) {
		// Solo l'agente è raggiungibile da fuori: `Ledger` si usa via RPC dall'agente, e
		// `routeAgentRequest` instraderebbe qualunque classe esportata.
		if (new URL(request.url).pathname.startsWith('/agents/site-agent/')) {
			const response = await routeAgentRequest(request, env);
			if (response) return response;
		}
		return handle(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;
