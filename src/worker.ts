import { handle } from '@astrojs/cloudflare/handler';
import { routeAgentRequest } from 'agents';

/**
 * Entry del Worker. Le richieste `/agents/*` vanno ai Durable Object dell'agente (anche
 * l'upgrade a WebSocket); tutto il resto ad Astro, come con l'entry predefinita
 * dell'adapter. Le pagine restano statiche: questo codice gira solo dove gira già il
 * Worker.
 */
export { SiteAgent } from './agent/site-agent';

export default {
	async fetch(request, env, ctx) {
		return (await routeAgentRequest(request, env)) ?? handle(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;
