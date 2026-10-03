// Adattato dall'esempio Pi harness di cloudflare/agents (MIT):
// https://github.com/cloudflare/agents/tree/main/examples/next/harnesses/pi

import type { JsonValue } from '@earendil-works/pi-ai';
import type { AgentEventStream, RegistryReader } from '@earendil-works/pi-durable';
import type { Connection, ConnectionContext } from 'agents/lifecycle';
import type { WebSocketMessage, WebSocketsOptions } from 'agents/websockets';
import { ROOT_SESSION, type PiHarness, type PiReceipt, type PiSessionId } from 'agents/harness/pi';
import type { PiClientMessage, PiServerMessage } from './protocol';

/**
 * Agganci del sito attorno all'invio (non c'erano nell'esempio): `admit` decide se il
 * messaggio arriva al modello (triage e budget) e manda al client cosa ha deciso;
 * `settled` riceve la ricevuta per addebitare il costo reale a risposta finita.
 */
export interface SubmitHooks {
	admit(text: string, reply: (message: PiServerMessage) => void): Promise<boolean>;
	settled(session: PiSessionId, receipt: PiReceipt): void;
	status(reply: (message: PiServerMessage) => void): Promise<void>;
}

const SESSION_TAG_PREFIX = 'pi-session:';
const SESSION_QUERY = 'session';
/** `WebSocket.OPEN`; the constant is not defined on every runtime's global. */
const OPEN = 1;

function sessionTag(session: PiSessionId): string {
	return `${SESSION_TAG_PREFIX}${session}`;
}

function sessionFromRequest(request: Request, fallback: PiSessionId): string {
	const session = new URL(request.url).searchParams.get(SESSION_QUERY);
	if (session === null || session === '') return fallback;
	if (!/^[1-9][0-9]{0,15}$/.test(session)) {
		throw new Error(`Invalid pi session ${JSON.stringify(session)}`);
	}
	return session;
}

function sessionOf(tags: readonly string[]): string | undefined {
	const tag = tags.find((candidate) => candidate.startsWith(SESSION_TAG_PREFIX));
	return tag?.slice(SESSION_TAG_PREFIX.length);
}

function send(socket: WebSocket, message: PiServerMessage): void {
	if (socket.readyState !== OPEN) return;
	try {
		socket.send(JSON.stringify(message));
	} catch {
		// The socket closed between the state check and the send.
	}
}

/**
 * App glue: this app's session protocol over the `WebSockets` capability,
 * built only on the harness's public API.
 *
 * Each socket follows one session, picked by `?session=`, through its own
 * `session.events()` stream: a `snapshot`, then one batch of pi's agent
 * events per commit. Commands on the socket call `session.submit()`,
 * `abort()`, and `reset()`. Watches live in memory, so the host calls
 * `reattach()` from its `onStart` to give sockets that outlived the last
 * isolate a new watch and a fresh snapshot.
 */
export class PiSessionSockets {
	readonly #harness: PiHarness;
	readonly #registry: RegistryReader;
	readonly #getWebSockets: (tag?: string) => WebSocket[];
	readonly #watches = new Map<WebSocket, AgentEventStream>();
	readonly #hooks: SubmitHooks | undefined;

	constructor(
		harness: PiHarness,
		/** The registry pi was opened with, for the tool list sent on connect. */
		registry: RegistryReader,
		getWebSockets: (tag?: string) => WebSocket[],
		hooks?: SubmitHooks
	) {
		this.#hooks = hooks;
		this.#harness = harness;
		this.#registry = registry;
		this.#getWebSockets = getWebSockets;
	}

	options(): WebSocketsOptions {
		return {
			getConnectionTags: (_connection, ctx) => [
				sessionTag(sessionFromRequest(ctx.request, ROOT_SESSION))
			],
			handlers: {
				onConnect: (connection, ctx) => this.#onConnect(connection, ctx),
				onMessage: (connection, message) => this.#onMessage(connection, message),
				onClose: (connection) => this.#unwatch(connection),
				onError: (connection) => this.#unwatch(connection)
			}
		};
	}

	/** Give every hibernated socket a new watch after the object restarts. */
	async reattach(): Promise<void> {
		if (this.#getWebSockets().length === 0) return;
		// Sockets are found by tag, not tags by socket, so walk the sessions
		// and look up each one's tag.
		for (const { id } of await this.#harness.sessions.list()) {
			for (const socket of this.#getWebSockets(sessionTag(id))) {
				await this.#watch(socket, id);
			}
		}
	}

	async close(): Promise<void> {
		const watches = [...this.#watches.values()];
		this.#watches.clear();
		await Promise.all(watches.map((watch) => watch.stop()));
	}

	async #onConnect(connection: Connection, ctx: ConnectionContext) {
		const session = sessionFromRequest(ctx.request, ROOT_SESSION);
		send(connection, {
			type: 'hello',
			session,
			tools: this.#registry
				.snapshot()
				.tools()
				.map(({ tool }) => ({ name: tool.name, description: tool.description }))
		});
		await this.#watch(connection, session);
		await this.#hooks?.status((message) => send(connection, message));
	}

	async #watch(socket: WebSocket, session: PiSessionId): Promise<void> {
		await this.#unwatch(socket);
		const stream = await this.#harness.session(session).events();
		this.#watches.set(socket, stream);
		send(socket, { type: 'events', session, events: [stream.snapshot] });
		stream.start(async (events) => {
			if (socket.readyState !== OPEN) {
				void this.#unwatch(socket);
				return;
			}
			send(socket, { type: 'events', session, events });
		});
	}

	async #unwatch(socket: WebSocket): Promise<void> {
		const watch = this.#watches.get(socket);
		if (!watch) return;
		this.#watches.delete(socket);
		await watch.stop();
	}

	async #onMessage(connection: Connection, raw: WebSocketMessage) {
		if (typeof raw !== 'string') return;
		let message: PiClientMessage;
		try {
			message = JSON.parse(raw) as PiClientMessage;
		} catch {
			send(connection, { type: 'error', message: 'Malformed JSON' });
			return;
		}
		const session = sessionOf(connection.tags) ?? ROOT_SESSION;
		try {
			const result = await this.#dispatch(connection, session, message);
			if (message.id !== undefined) {
				send(connection, { type: 'result', id: message.id, result });
			}
		} catch (error) {
			send(connection, {
				type: 'error',
				...(message.id === undefined ? {} : { id: message.id }),
				message: error instanceof Error ? error.message : String(error)
			});
		}
	}

	async #dispatch(
		connection: Connection,
		session: PiSessionId,
		message: PiClientMessage
	): Promise<JsonValue> {
		const handle = this.#harness.session(session);
		switch (message.type) {
			case 'submit': {
				const text = typeof message.input === 'string' ? message.input : '';
				const reply = (out: PiServerMessage) => send(connection, out);
				if (this.#hooks && !(await this.#hooks.admit(text, reply))) return null;
				const receipt = await handle.submit(message.input, {
					...(message.whenBusy ? { whenBusy: message.whenBusy } : {}),
					...(message.operationId ? { operationId: message.operationId } : {})
				});
				this.#hooks?.settled(session, receipt);
				return receipt;
			}
			case 'abort':
				return await handle.abort();
			case 'reset':
				await handle.reset(message.handoff);
				return null;
			case 'resync':
				await this.#watch(connection, session);
				return null;
			default:
				throw new Error(
					`Unknown pi message type ${JSON.stringify((message as { type: string }).type)}`
				);
		}
	}
}
