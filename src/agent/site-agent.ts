import { DurableObject } from 'cloudflare:workers';
import { Type } from '@earendil-works/pi-ai';
import { createModels } from '@earendil-works/pi-ai/models';
import { createRegistry, Harness, type ToolRegistration } from '@earendil-works/pi-durable';
import { PiHarness } from 'agents/harness/pi';
import { Lifecycle } from 'agents/lifecycle';
import { createAI } from 'agents/models/pi-ai';
import { WebSockets } from 'agents/websockets';
import { searchSite, type SiteDoc } from './site-index';
import { PiSessionSockets } from './sockets';

/**
 * L'agente del sito: un Durable Object per visitatore, con pi-durable dentro (PiHarness
 * dell'Agents SDK) e i modelli da Workers AI e AI Gateway sul binding `AI`. Pi tiene la
 * conversazione nel SQLite dell'oggetto e la riprende se l'oggetto viene sospeso.
 * Il protocollo WebSocket è in `sockets.ts`, la vista per la UI in `view.ts`.
 */

// Modello della prova: economico e capace di chiamare tool. Si sceglie quello vero dopo
// aver misurato costo e qualità.
const MODEL_ID = '@cf/zai-org/glm-4.7-flash';

const PREAMBLE = `You are the agent on esse.dev, the site of Simone Salerno, Lead AI Engineer. You answer questions about his projects, writing and method, using your tools: never invent facts about Simone or his work. Reply in the language the visitor writes in, and pass that language to your tools ("it" or "en"). Be concise. When you cite a page, give its path.`;

const SearchSite = Type.Object({
	query: Type.String({ description: 'Words to look for.' }),
	lang: Type.Union([Type.Literal('it'), Type.Literal('en')], {
		description: 'The language of the visitor.'
	}),
	kind: Type.Optional(
		Type.Union(
			['project', 'article', 'method', 'now', 'about'].map((k) => Type.Literal(k)),
			{ description: 'Only this kind of page.' }
		)
	)
});

export class SiteAgent extends DurableObject<Env> {
	readonly ai = createAI({ binding: this.env.AI });
	readonly registry = createRegistry();
	#index: Promise<SiteDoc[]> | undefined;

	/** L'indice del sito, letto una volta per isolate dagli asset statici. */
	siteIndex(): Promise<SiteDoc[]> {
		this.#index ??= this.env.ASSETS.fetch('https://assets.local/agent/index.json').then(
			async (res) => {
				if (!res.ok) throw new Error(`Site index: HTTP ${res.status}`);
				return (await res.json()) as SiteDoc[];
			}
		);
		return this.#index;
	}

	readonly searchTool: ToolRegistration<typeof SearchSite> = {
		name: 'search_site',
		description:
			'Search the pages of esse.dev: projects, writing, method, now, about. Returns path, kind, title and summary of the best matches.',
		parameters: SearchSite,
		replay: 'safe',
		execute: async ({ query, lang, kind }) => {
			const hits = searchSite(await this.siteIndex(), query, {
				lang,
				kind: kind as SiteDoc['kind'] | undefined
			});
			return { content: [{ type: 'text', text: JSON.stringify(hits) }] };
		}
	};

	readonly harness = new PiHarness({
		harness: async ({ storage, context }) => {
			this.registry.install({
				name: 'site',
				sections: [{ key: 'preamble', render: () => PREAMBLE, tag: false }],
				tools: [this.searchTool]
			});
			const models = createModels();
			models.setProvider(this.ai.provider);
			return Harness.open(
				storage,
				{
					models,
					registry: this.registry,
					settings: { retry: { enabled: true, maxRetries: 3, baseDelayMs: 1000 } },
					onReport: (error) => console.warn('pi report', error)
				},
				context
			);
		},
		defaults: { model: this.ai(MODEL_ID), thinkingLevel: 'low' }
	});

	readonly sockets = new PiSessionSockets(this.harness, this.registry, (tag) =>
		this.ctx.getWebSockets(tag)
	);
	readonly webSockets = new WebSockets(this.sockets.options());
	readonly lifecycle = Lifecycle.install(this).use(this.webSockets).use(this.harness);

	async onStart(): Promise<void> {
		await this.sockets.reattach();
	}
}
