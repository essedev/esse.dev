import { DurableObject } from 'cloudflare:workers';
import { Type, type AssistantMessage } from '@earendil-works/pi-ai';
import { createModels } from '@earendil-works/pi-ai/models';
import { createRegistry, Harness, type ToolRegistration } from '@earendil-works/pi-durable';
import { PiHarness, ROOT_SESSION, type PiReceipt, type PiSessionId } from 'agents/harness/pi';
import { Lifecycle } from 'agents/lifecycle';
import { createAI } from 'agents/models/pi-ai';
import { WebSockets } from 'agents/websockets';
import { costOf, remaining, today, VISITOR_DAILY_USD, type Spend } from './budget';
import type { PiServerMessage } from './protocol';
import { searchSite, type SiteDoc } from './site-index';
import { PiSessionSockets } from './sockets';
import { admits, jevInput, parseTriage, type JevOutput, type Lang, type Triage } from './triage';

/**
 * L'agente del sito: un Durable Object per visitatore, con pi-durable dentro (PiHarness
 * dell'Agents SDK) e i modelli da Workers AI sul binding `AI`. Pi tiene la conversazione
 * nel SQLite dell'oggetto e la riprende se l'oggetto viene sospeso.
 *
 * Prima del modello ogni messaggio passa da Jev (`triage.ts`): fuori tema e abuso si
 * fermano lì, la lingua decide quella della risposta. Il costo reale di ogni risposta si
 * scala dal budget del visitatore e da quello del sito (`Ledger`).
 */

const MODEL_ID = '@cf/zai-org/glm-5.3-flash';

/**
 * Da dove passa Jev. `typesafe`: API di TypeSafe con la chiave `TYPESAFE_API_KEY` (secret
 * del Worker, `.dev.vars` in locale). `workers-ai`: binding `AI`, senza chiavi, ma con
 * crediti AI Gateway sull'account. Stesse domande e stesse risposte: cambia solo il
 * trasporto. Per ora TypeSafe; si passa al binding quando ci sono i crediti.
 */
const JEV_TRANSPORT: 'typesafe' | 'workers-ai' = 'typesafe';
const TYPESAFE_URL = 'https://api.typesafe.ai/v1/systemone';
/** Oltre questo tempo il triage si abbandona e il messaggio passa (il tetto resta). */
const JEV_TIMEOUT_MS = 3000;
/** Un file di testo oltre questa misura si taglia: il resto costerebbe token per niente. */
const PAGE_MAX_CHARS = 12_000;

const PREAMBLE = `You are the agent on esse.dev, the site of Simone Salerno, Lead AI Engineer. You answer questions about his projects, writing and method using your tools: search first, then read the pages you need. Never invent facts about Simone or his work; if the site does not say it, say so. Be concise and concrete. Cite the pages you used by their path, as Markdown links.`;

const Lang = Type.Union([Type.Literal('it'), Type.Literal('en')], {
	description: 'The language of the visitor.'
});
const SearchSite = Type.Object({
	query: Type.String({ description: 'Words to look for.' }),
	lang: Lang,
	kind: Type.Optional(
		Type.Union(
			['project', 'article', 'method', 'now', 'about'].map((k) => Type.Literal(k)),
			{ description: 'Only this kind of page.' }
		)
	)
});
const ReadPage = Type.Object({
	path: Type.String({ description: 'The path of a page on esse.dev, as search_site returns it.' })
});

type Reply = (message: PiServerMessage) => void;

export class SiteAgent extends DurableObject<Env> {
	readonly ai = createAI({ binding: this.env.AI });
	readonly registry = createRegistry();
	#index: Promise<SiteDoc[]> | undefined;
	/** La lingua dell'ultimo messaggio secondo Jev; `null` se il triage non ha risposto. */
	#lang: Lang | null = null;

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

	readonly readTool: ToolRegistration<typeof ReadPage> = {
		name: 'read_page',
		description:
			'Read one page of esse.dev in full: its facts (status, dates, stack, links) and its text in Markdown.',
		parameters: ReadPage,
		replay: 'safe',
		execute: async ({ path }) => {
			const doc = (await this.siteIndex()).find((d) => d.path === path.replace(/\/$/, ''));
			if (!doc) throw new Error(`No page at ${path}: use search_site to find the path.`);
			const { body, ...facts } = doc;
			const text = body.length > PAGE_MAX_CHARS ? `${body.slice(0, PAGE_MAX_CHARS)}\n[…]` : body;
			return {
				content: [{ type: 'text', text: `${JSON.stringify(facts)}\n\n${text}` }]
			};
		}
	};

	readonly harness = new PiHarness({
		harness: async ({ storage, context }) => {
			this.registry.install({
				name: 'site',
				sections: [
					{ key: 'preamble', render: () => PREAMBLE, tag: false },
					{
						key: 'language',
						// Senza triage decide il modello, dalla lingua del messaggio.
						render: () =>
							this.#lang
								? `Reply in ${this.#lang === 'it' ? 'Italian' : 'English'}, and pass "${this.#lang}" to search_site.`
								: 'Reply in the language of the last visitor message, and pass it to search_site ("it" for Italian, "en" otherwise).'
					}
				],
				tools: [this.searchTool, this.readTool]
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

	readonly sockets = new PiSessionSockets(
		this.harness,
		this.registry,
		(tag) => this.ctx.getWebSockets(tag),
		{
			admit: (text, reply) => this.admit(text, reply),
			settled: (session, receipt) => this.ctx.waitUntil(this.settle(session, receipt)),
			status: (reply) => this.status(reply)
		}
	);
	readonly webSockets = new WebSockets(this.sockets.options());
	readonly lifecycle = Lifecycle.install(this).use(this.webSockets).use(this.harness);

	async onStart(): Promise<void> {
		await this.#syncModel();
		await this.sockets.reattach();
	}

	/**
	 * Una sessione tiene il modello con cui è nata: `defaults` vale solo per quelle nuove.
	 * Quando il modello del sito cambia, le conversazioni esistenti passano al nuovo.
	 */
	async #syncModel(): Promise<void> {
		const session = this.harness.session(ROOT_SESSION);
		const stream = await session.events();
		const current = stream.snapshot.agent.model?.modelId;
		await stream.stop();
		if (current !== MODEL_ID) await session.setModel(this.ai(MODEL_ID));
	}

	#ledger() {
		return this.env.Ledger.get(this.env.Ledger.idFromName('site'));
	}

	async #spend(): Promise<Spend> {
		return today(await this.ctx.storage.get<Spend>('spend'), new Date());
	}

	/** Quanto resta oggi al visitatore: il minimo tra il suo budget e quello del sito. */
	async #remaining(): Promise<number> {
		const [spend, site] = await Promise.all([this.#spend(), this.#ledger().remaining()]);
		return Math.min(remaining(spend, VISITOR_DAILY_USD), site);
	}

	async status(reply: Reply): Promise<void> {
		reply({ type: 'budget', remaining: await this.#remaining(), limit: VISITOR_DAILY_USD });
	}

	/** Una chiamata a Jev sul trasporto scelto; la forma della risposta la valida `parseTriage`. */
	async #jev(input: ReturnType<typeof jevInput>): Promise<JevOutput> {
		if (JEV_TRANSPORT === 'workers-ai') {
			// Jev non ha un tipo nel catalogo dei modelli del binding.
			const run = this.env.AI.run as (model: string, input: unknown) => Promise<unknown>;
			return (await run('typesafe/jev', input)) as JevOutput;
		}
		const key = (this.env as Env & { TYPESAFE_API_KEY?: string }).TYPESAFE_API_KEY;
		if (!key) throw new Error('TYPESAFE_API_KEY is not set');
		const res = await fetch(TYPESAFE_URL, {
			method: 'POST',
			headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
			body: JSON.stringify({ model: 'jev-latest', ...input }),
			signal: AbortSignal.timeout(JEV_TIMEOUT_MS)
		});
		if (!res.ok) throw new Error(`TypeSafe: HTTP ${res.status} ${await res.text()}`);
		return (await res.json()) as JevOutput;
	}

	async #triage(text: string): Promise<Triage | null> {
		const started = Date.now();
		try {
			return parseTriage(await this.#jev(jevInput(text)), Date.now() - started);
		} catch (error) {
			// Senza triage la richiesta passa: il limite vero è il budget in costo reale.
			console.error('Jev triage failed', error);
			return null;
		}
	}

	/** Prima del modello: budget, poi triage. Restituisce se il messaggio può passare. */
	async admit(text: string, reply: Reply): Promise<boolean> {
		if ((await this.#remaining()) <= 0) {
			reply({ type: 'notice', text, reason: 'budget' });
			return false;
		}
		const triage = await this.#triage(text);
		reply({ type: 'triage', text, triage });
		if (triage && !admits(triage)) {
			reply({ type: 'notice', text, reason: triage.intent === 'abuse' ? 'abuse' : 'offtopic' });
			return false;
		}
		this.#lang = triage?.lang ?? null;
		return true;
	}

	/**
	 * A risposta finita, scala il costo reale dei messaggi del modello non ancora addebitati.
	 * Il segno è l'id dell'ultima voce addebitata (gli id di pi crescono): così due richieste
	 * accodate non si contano due volte, e una risposta non si perde se l'altra finisce prima.
	 */
	async settle(session: PiSessionId, receipt: PiReceipt): Promise<void> {
		const handle = this.harness.session(session);
		await handle.wait(receipt.operationId);
		const mark = (await this.ctx.storage.get<number>('charged-through')) ?? 0;
		const entries = (await handle.messages()).filter((e) => e.id > mark);
		if (entries.length === 0) return;
		const usd = costOf(
			entries.map((e) => e.model?.[0]).filter((m): m is AssistantMessage => m?.role === 'assistant')
		);
		await this.ctx.storage.put('charged-through', Math.max(...entries.map((e) => e.id)));
		if (usd <= 0) return;
		const spend = await this.#spend();
		await this.ctx.storage.put('spend', { day: spend.day, usd: spend.usd + usd });
		await this.#ledger().charge(usd);
		for (const socket of this.ctx.getWebSockets()) {
			await this.status((message) => socket.send(JSON.stringify(message)));
		}
	}
}
