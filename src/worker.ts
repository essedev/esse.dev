import { handle } from '@astrojs/cloudflare/handler';
import { routeAgentRequest } from 'agents';

/**
 * The Worker entry. Requests to `/agents/*` go to the agent's Durable Objects (the
 * WebSocket upgrade too); everything else goes to Astro, as with the adapter's default
 * entry. Pages stay static: this code runs only where the Worker already runs.
 */
export { Ledger } from './agent/ledger';
export { SiteAgent } from './agent/site-agent';

export default {
	async fetch(request, env, ctx) {
		// Only the agent is reachable from outside: `Ledger` is used over RPC by the agent, and
		// `routeAgentRequest` would route any exported class.
		if (new URL(request.url).pathname.startsWith('/agents/site-agent/')) {
			const response = await routeAgentRequest(request, env);
			if (response) return response;
		}
		return handle(request, env, ctx);
	}
} satisfies ExportedHandler<Env>;
