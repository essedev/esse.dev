// Adattato dall'esempio Pi harness di cloudflare/agents (MIT):
// https://github.com/cloudflare/agents/tree/main/examples/next/harnesses/pi

import type { JsonValue } from '@earendil-works/pi-ai';
import type { AgentEvent, UserInput } from '@earendil-works/pi-durable';
import type { PiSessionId, PiWhenBusy } from 'agents/harness/pi';
import type { Triage } from './triage';

/** Perché un messaggio si è fermato prima del modello. `rate`: troppi messaggi dallo stesso IP. */
export type NoticeReason = 'offtopic' | 'abuse' | 'budget' | 'rate';

/**
 * This app's WebSocket protocol, served by `sockets.ts`. The harness knows
 * nothing about it: it is one way to put `session.events()` and
 * `session.submit()` on a socket.
 */

export type PiToolInfo = {
	readonly name: string;
	readonly description: string;
};

/** Client → server. Commands with an `id` get a `result` or `error` back. */
export type PiClientMessage =
	| {
			readonly type: 'submit';
			readonly id?: string;
			readonly input: UserInput;
			readonly whenBusy?: PiWhenBusy;
			readonly operationId?: string;
	  }
	| { readonly type: 'abort'; readonly id?: string }
	| { readonly type: 'reset'; readonly id?: string; readonly handoff?: string }
	/** Ask for a fresh snapshot. */
	| { readonly type: 'resync'; readonly id?: string }
	/** Il visitatore approva e spedisce una bozza di `draft_message`, dopo Turnstile. */
	| {
			readonly type: 'send-draft';
			readonly id?: string;
			readonly draftId: string;
			readonly subject: string;
			readonly text: string;
			readonly contact: string;
			readonly turnstile: string;
	  };

/** Server → client. */
export type PiServerMessage =
	| {
			readonly type: 'hello';
			readonly session: PiSessionId;
			readonly tools: readonly PiToolInfo[];
	  }
	/**
	 * pi's own agent events for the connection's session. The first batch of a
	 * watch, and any batch after the server lost its watch, starts with a
	 * `snapshot` event that replaces the client's state.
	 */
	| {
			readonly type: 'events';
			readonly session: PiSessionId;
			readonly events: readonly AgentEvent[];
	  }
	/** Il triage di Jev su un messaggio, prima del modello; `null` se Jev non ha risposto. */
	| { readonly type: 'triage'; readonly text: string; readonly triage: Triage | null }
	/** Un messaggio fermato prima del modello: fuori tema, abuso o budget finito. */
	| {
			readonly type: 'notice';
			readonly text: string;
			readonly reason: NoticeReason;
	  }
	/** Le bozze già spedite (per id della chiamata), e l'esito di un invio. */
	| { readonly type: 'drafts'; readonly sent: readonly string[] }
	| {
			readonly type: 'draft';
			readonly draftId: string;
			readonly status: 'sent' | 'error';
			readonly message?: string;
	  }
	/** Quanto resta del budget di oggi, in dollari. */
	| { readonly type: 'budget'; readonly remaining: number; readonly limit: number }
	| { readonly type: 'result'; readonly id: string; readonly result: JsonValue }
	| { readonly type: 'error'; readonly id?: string; readonly message: string };

export type {
	PiClientMessage as ClientMessage,
	PiServerMessage as ServerMessage,
	PiToolInfo as ToolInfo
};
export type { PiMessage as TranscriptMessage, PiMessagePart as TranscriptPart } from './transcript';
export type { PiSessionView as SessionView } from './view';
