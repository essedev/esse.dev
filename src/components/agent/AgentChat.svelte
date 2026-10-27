<script lang="ts">
	import { AgentClient } from 'agents/client';
	import { ArrowUpRight } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';
	import { credits, nextReset, SHOW_BUDGET_BELOW } from '../../agent/budget';
	import { renderMarkdown } from '../../agent/markdown';
	import { parseRender, type RenderView as View } from '../../agent/render';
	import { parseReport, type ChildRecord, type ChildReport } from '../../agent/delegate';
	import { callText, describeStep, fillStep, type Step, type StepCount } from '../../agent/steps';
	import AgentStatus from './AgentStatus.svelte';
	import ChildSheet from './ChildSheet.svelte';
	import DelegateView from './DelegateView.svelte';
	import DraftView from './DraftView.svelte';
	import RenderView from './RenderView.svelte';
	import StepDetail from './StepDetail.svelte';
	import StepToken from './StepToken.svelte';
	import { phosphor } from './phosphor';
	import { ANSWER_PROSE, TOKEN } from './prose';
	import { errorKind, phaseOf, type ErrorKind, type Phase } from '../../agent/phase';
	import type {
		NoticeReason,
		ServerMessage,
		TranscriptMessage,
		TranscriptPart
	} from '../../agent/protocol';
	import type { Triage } from '../../agent/triage';
	import { EMPTY_VIEW, reduceEvents, type PiSessionView } from '../../agent/view';
	import { track } from '../../scripts/track';

	/**
	 * The agent's transcript: a WebSocket to the visitor's Durable Object, pi's events folded
	 * by `reduceEvents` (the same reducer as the server). It shows how the agent works: Jev's
	 * triage of every message and, per turn, the work as tokens under one header (concept Q,
	 * D2: every tool call readable and expandable, the sub-agents, tokens and cost), then the
	 * answer; the budget that is left. The visitor has an object of their own, remembered in the
	 * browser, so they find the conversation again.
	 */

	type Labels = {
		placeholder: string;
		send: string;
		stop: string;
		connecting: string;
		offline: string;
		reconnecting: string;
		reconnected: string;
		/** The socket never opened: the client keeps trying by itself. */
		unreachable: string;
		/** Under a message waiting in pi's inbox behind the answer in progress. */
		queued: string;
		/** The phases of the status line; the one of a tool is its label. */
		phases: { triage: string; think: string; reason: string; write: string; resume: string };
		retrying: string;
		/** `{n}` is the seconds left before pi retries. */
		retryIn: string;
		retryNow: string;
		/** Per kind: the short tag and the sentence for the visitor. */
		errors: Record<ErrorKind, { tag: string; text: string }>;
		errorDetails: string;
		toolsNote: string;
		/** The empty page: what the agent does, each with the token it shows (concept P, D). */
		abilities: {
			title: string;
			rows: { title: string; note: string; tool: string; args: Record<string, unknown> }[];
		};
		/** The header of a turn's work, and the unit of its steps as `singular|plural`. */
		work: string;
		stepUnit: string;
		/** A tool's sentence on its token, with `{name}` slots (src/agent/steps.ts). */
		steps: Record<string, string>;
		/** What a result counts, as `singular|plural`. */
		counts: Record<StepCount, string>;
		/** The line under the field on how long conversations are kept, and its link. */
		privacyNote: string;
		privacyHref: string;
		/** Description for the visitor; without it, the one the server gives the model. */
		toolLabels: Record<string, string>;
		/** The section name for each kind of page, on the `show_page` cards. */
		kinds: Record<string, string>;
		open: string;
		subagents: string;
		answer: string;
		/** One `delegate` sub-agent, its states and the words of its sheet. */
		child: string;
		childWorking: string;
		childDone: string;
		childStopped: string;
		childFailed: string;
		childStop: string;
		childClose: string;
		childTask: string;
		childWatch: string;
		childEnd: string;
		childStoppedNote: string;
		childFailedNote: string;
		draft: string;
		draftSubject: string;
		draftContact: string;
		draftSend: string;
		draftSending: string;
		draftSent: string;
		tryAsking: string;
		suggestions: string[];
		retry: string;
		reasoning: string;
		toolCall: string;
		result: string;
		budget: string;
		credit: string;
		credits: string;
		/** Per language: the notice follows the message's language, not the page's. */
		notice: Record<string, Record<NoticeReason, string>>;
		intent: Record<Triage['intent'], string>;
		weight: Record<Triage['weight'], string>;
	};
	let {
		labels,
		locale,
		turnstileKey
	}: {
		labels: Labels;
		locale: string;
		/** A key set at build time, if any. */ turnstileKey?: string;
	} = $props();

	const VISITOR_KEY = 'agent-visitor';

	/** A message stopped before the model: it lives only in the browser. */
	type Local = { text: string; reason: NoticeReason; after: number };

	let view: PiSessionView = $state(EMPTY_VIEW);
	let status: 'connecting' | 'open' | 'closed' = $state('connecting');
	let input = $state('');
	let triages: Record<string, Triage | null> = $state({});
	let locals: Local[] = $state([]);
	let budget: { remaining: number; limit: number } | null = $state(null);
	let catalog: { name: string; description: string }[] = $state([]);
	/** The state of draft sends, by id of the `draft_message` call. */
	let drafts: Record<string, { status: 'sending' | 'sent' | 'error'; message?: string }> = $state(
		{}
	);
	let client: AgentClient | undefined;
	/** The visitor's object: the sheet of a sub-agent opens its socket on the same one. */
	let visitor = '';
	/** The sub-agents of the conversation, as the server lists them, and the one in the sheet. */
	let children: ChildRecord[] = $state([]);
	let sheet: number | null = $state(null);
	const sheetChild = $derived(children.find((c) => c.id === sheet) ?? null);
	/** On the field: the ones at work and the latest finished, four at most. */
	const rail = $derived.by(() => {
		const live = children.filter((c) => c.status === 'working');
		const rest = children
			.filter((c) => c.status !== 'working')
			.slice(-Math.max(0, 4 - live.length));
		return children.filter((c) => live.includes(c) || rest.includes(c));
	});
	const statusLabel = (status: ChildRecord['status']) =>
		({
			working: labels.childWorking,
			done: labels.childDone,
			stopped: labels.childStopped,
			failed: labels.childFailed
		})[status];
	/** Whether the socket was ever open: a close after that is a drop, not a failed start. */
	let opened = $state(false);
	let reconnected = $state(false);
	let reconnectedTimer: ReturnType<typeof setTimeout> | undefined;
	const RECONNECTED_MS = 2000;
	/** After this long without a first open, the page says the agent is not answering. */
	const UNREACHABLE_MS = 8000;
	let slow = $state(false);
	const unreachable = $derived(!opened && (status === 'closed' || slow));

	function visitorId(): string {
		try {
			const saved = localStorage.getItem(VISITOR_KEY);
			if (saved) return saved;
			const id = crypto.randomUUID();
			localStorage.setItem(VISITOR_KEY, id);
			return id;
		} catch {
			// No storage (private browsing): one conversation per visit.
			return crypto.randomUUID();
		}
	}

	const toolLabel = (name: string) =>
		labels.toolLabels[name] ?? catalog.find((t) => t.name === name)?.description ?? '';

	const shown = $derived(
		[...view.messages, ...(view.live ? [view.live] : [])].filter(
			(m: TranscriptMessage) => m.role === 'user' || m.role === 'assistant'
		)
	);

	// `?ask=` comes from a link (the home): the question lands in the field, it does not send
	// itself. The cost stays the visitor's choice. Not `?q=`: that is the sidebar search.
	const PREFILL_PARAM = 'ask';
	const PREFILL_MAX = 500;
	function prefill() {
		const url = new URL(location.href);
		const ask = url.searchParams.get(PREFILL_PARAM)?.trim();
		if (!ask) return;
		input = ask.slice(0, PREFILL_MAX);
		url.searchParams.delete(PREFILL_PARAM);
		history.replaceState(history.state, '', url);
		tick().then(() => document.querySelector<HTMLTextAreaElement>('[data-agent-input]')?.focus());
	}

	onMount(() => {
		prefill();
		const slowTimer = setTimeout(() => (slow = true), UNREACHABLE_MS);
		visitor = visitorId();
		client = new AgentClient({ agent: 'SiteAgent', name: visitor, host: location.host });
		client.addEventListener('open', () => {
			// Back after a drop: say so for a moment, then the model returns in the line.
			if (status === 'closed') {
				reconnected = true;
				clearTimeout(reconnectedTimer);
				reconnectedTimer = setTimeout(() => (reconnected = false), RECONNECTED_MS);
			}
			status = 'open';
			opened = true;
		});
		client.addEventListener('close', () => (status = 'closed'));
		client.addEventListener('message', (event: MessageEvent) => {
			let message: ServerMessage;
			try {
				message = JSON.parse(String(event.data)) as ServerMessage;
			} catch {
				return;
			}
			switch (message.type) {
				case 'hello':
					catalog = [...message.tools];
					break;
				case 'events': {
					const had = view.messages.length;
					view = reduceEvents(view, message.events);
					loaded = true;
					// An empty snapshot after a conversation: it expired while the page was open (the
					// object empties itself after RETENTION_DAYS). A new empty one, as on a new visit.
					if (
						had > 0 &&
						view.messages.length === 0 &&
						message.events.some((e) => e.type === 'snapshot')
					) {
						forget();
					}
					break;
				}
				case 'triage':
					triages = { ...triages, [message.text]: message.triage };
					break;
				case 'notice':
					unwait(message.text);
					locals = [...locals, { text: message.text, reason: message.reason, after: shown.length }];
					track('agent-notice', { reason: message.reason });
					break;
				case 'drafts':
					drafts = {
						...drafts,
						...Object.fromEntries(message.sent.map((id) => [id, { status: 'sent' as const }]))
					};
					break;
				case 'draft':
					if (message.status === 'sent') track('draft-sent');
					if (message.status === 'error') track('draft-error');
					drafts = {
						...drafts,
						[message.draftId]: { status: message.status, message: message.message }
					};
					break;
				case 'budget':
					budget = { remaining: message.remaining, limit: message.limit };
					break;
				case 'children':
					children = [...message.children];
					if (sheet !== null && !children.some((c) => c.id === sheet)) sheet = null;
					break;
				case 'error':
					pending = [];
					view = { ...view, error: message.message };
					track('agent-error');
					break;
			}
		});
		// "Nuova conversazione" lives in the page toolbar, outside the island.
		const onReset = (event: MouseEvent) => {
			if ((event.target as HTMLElement).closest('[data-agent-reset]')) reset();
		};
		document.addEventListener('click', onReset);
		return () => {
			document.removeEventListener('click', onReset);
			clearTimeout(reconnectedTimer);
			clearTimeout(slowTimer);
			client?.close();
		};
	});

	// The transcript follows the last line as it arrives, but only if the reader is already at
	// the bottom: someone who scrolled up to reread is not pulled back down. The pane scrolls on
	// desktop and the window on mobile, where the pane has no scroll of its own.
	const NEAR_BOTTOM = 160;
	function scroller(): { el: Element; top: number; height: number; client: number } {
		const main = document.querySelector('[data-main-scroll]');
		if (main && main.scrollHeight > main.clientHeight) {
			return {
				el: main,
				top: main.scrollTop,
				height: main.scrollHeight,
				client: main.clientHeight
			};
		}
		const doc = document.scrollingElement ?? document.documentElement;
		return { el: doc, top: doc.scrollTop, height: doc.scrollHeight, client: doc.clientHeight };
	}
	let following = true;
	$effect.pre(() => {
		void shown.length;
		void view.live;
		void locals.length;
		const s = scroller();
		following = s.height - s.top - s.client < NEAR_BOTTOM;
	});
	$effect(() => {
		void shown.length;
		void view.live;
		void locals.length;
		// With an empty conversation there is nothing to follow: the page starts from the top.
		if (!following || empty) return;
		tick().then(() => {
			const s = scroller();
			s.el.scrollTo({ top: s.height });
		});
	});

	function send(message: object) {
		client?.send(JSON.stringify({ id: crypto.randomUUID(), ...message }));
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const text = input.trim();
		if (!text || status !== 'open') return;
		sent = true;
		following = true;
		wait(text);
		send({ type: 'submit', input: text, whenBusy: 'followUp' });
		track('agent-message', { source: 'typed' });
		input = '';
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			(event.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
		}
	}

	// "Riprova" after an error: resends the visitor's last message.
	const lastUserText = $derived(
		[...view.messages]
			.reverse()
			.map((m) => (m.role === 'user' ? userText(m) : null))
			.find((text) => text !== null && !parseReport(text)) ?? ''
	);
	function retry() {
		if (!lastUserText || status !== 'open') return;
		view = { ...view, error: null };
		wait(lastUserText);
		send({ type: 'submit', input: lastUserText, whenBusy: 'followUp' });
		track('agent-retry');
	}

	function ask(text: string) {
		if (status !== 'open') return;
		sent = true;
		following = true;
		wait(text);
		send({ type: 'submit', input: text, whenBusy: 'followUp' });
		track('agent-message', { source: 'suggestion' });
	}

	// The empty state disappears on the first send, without waiting for the server to confirm,
	// and does not show while a conversation already open is coming back.
	let sent = $state(false);
	const empty = $derived(
		!sent && !resuming && shown.length === 0 && locals.length === 0 && !view.running
	);

	/**
	 * The messages sent and not yet in the transcript, in order: they show at once, under the
	 * first the status line says Jev is weighing it. Each knows how many user messages come
	 * before it (`after`) and leaves when pi records it, when a notice stops it, or on an error.
	 */
	let pending: { text: string; after: number }[] = $state([]);
	// A sub-agent's report is a user message too, but not the visitor's.
	const users = $derived(
		view.messages.filter((m) => m.role === 'user' && !parseReport(userText(m))).length
	);
	function wait(text: string) {
		pending = [...pending, { text, after: users + pending.length }];
	}
	/** A notice stopped a message: it will never be recorded, the ones after it move up. */
	function unwait(text: string) {
		const index = pending.findIndex((p) => p.text === text);
		if (index < 0) return;
		pending = pending
			.filter((_, i) => i !== index)
			.map((p, i) => (i >= index ? { ...p, after: p.after - 1 } : p));
	}
	$effect(() => {
		if (pending.some((p) => users > p.after)) pending = pending.filter((p) => users <= p.after);
	});
	const phase: Phase | null = $derived(
		phaseOf(
			view,
			pending.length ? (triages[pending[0].text] === undefined ? 'triage' : 'admitted') : null
		)
	);
	// Messages waiting in pi's inbox behind the answer in progress: the status line, which is
	// about that answer, goes above them.
	const queued = $derived(view.running && view.queued > 0 && pending.length > 0);

	// Seconds since the work started, ticking while there is a phase.
	const working = $derived(phase !== null);
	let since = 0;
	let clock = $state(0);
	$effect(() => {
		if (!working) return;
		since = Date.now();
		clock = since;
		const timer = setInterval(() => (clock = Date.now()), 100);
		return () => clearInterval(timer);
	});
	const seconds = (ms: number) =>
		`${(ms / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
	function phaseLabel(p: Phase): string {
		if (p.kind === 'tool') return toolLabel(p.name) || p.name;
		if (p.kind === 'retry') return labels.retrying;
		return labels.phases[p.kind];
	}
	function phaseMeta(p: Phase): string {
		if (p.kind !== 'retry') return seconds(Math.max(0, clock - since));
		const left = Math.ceil((p.at - clock) / 1000);
		return left > 0 ? labels.retryIn.replace('{n}', String(left)) : labels.retryNow;
	}

	// The page title and subtitle are the welcome, like the example questions: when the
	// conversation starts they disappear (they stay for screen readers). Until the transcript
	// arrives, the memory of the last visit decides, so an already open conversation does not
	// flash the title for a moment.
	const STARTED_KEY = 'agent-started';
	let loaded = $state(false);
	let remembered = false;
	try {
		remembered = localStorage.getItem(STARTED_KEY) === '1';
	} catch {
		// No storage: wait for the transcript.
	}
	const started = $derived(loaded ? !empty : remembered);
	/** A conversation already open is coming: the title is gone, the transcript not here yet. */
	const resuming = $derived(!loaded && remembered && status !== 'closed' && !unreachable);
	$effect(() => {
		document.querySelector('[data-workspace]')?.toggleAttribute('data-agent-started', started);
		if (!loaded) return;
		try {
			if (started) localStorage.setItem(STARTED_KEY, '1');
			else localStorage.removeItem(STARTED_KEY);
		} catch {
			// See above.
		}
	});

	function reset() {
		send({ type: 'reset' });
		track('agent-reset');
		forget();
	}

	/** Back to an empty conversation in the browser: what lives only here goes too. */
	function forget() {
		sent = false;
		sheet = null;
		triages = {};
		locals = [];
		pending = [];
	}

	// Tool results arrive as separate messages: attach them to their call.
	type ToolResult = Extract<TranscriptPart, { type: 'tool-result' }>;
	const results = $derived(
		new Map(
			view.messages
				.flatMap((m) => m.parts)
				.filter((p): p is ToolResult => p.type === 'tool-result')
				.map((p) => [p.id, p])
		)
	);
	const resultText = (part: ToolResult) =>
		part.content.map((c) => (c.type === 'text' ? c.text : '[image]')).join('\n');

	/** The `draft_message` draft from the arguments, if the server accepted it. */
	function drafted(
		args: unknown,
		part: ToolResult | undefined
	): { subject: string; text: string } | null {
		const a = args as { subject?: unknown; text?: unknown } | null;
		if (!part || part.error || typeof a?.subject !== 'string' || typeof a.text !== 'string') {
			return null;
		}
		return { subject: a.subject, text: a.text };
	}

	function sendDraft(
		draftId: string,
		fields: { subject: string; text: string; contact: string; turnstile: string }
	) {
		drafts = { ...drafts, [draftId]: { status: 'sending' } };
		send({ type: 'send-draft', draftId, ...fields });
	}

	/**
	 * The `delegate` tasks from the arguments and, from the result: the children it started
	 * (`details`, DECISIONS #33) or, on calls from before, the reports. `null` for a call the
	 * server refused, which reads as a plain tool call.
	 */
	function delegated(
		args: unknown,
		part: ToolResult | undefined
	): {
		tasks: { title: string; task: string }[];
		reports: ChildReport[] | null;
		children: ChildRecord[];
	} | null {
		const tasks = (args as { tasks?: unknown } | null)?.tasks;
		if (!Array.isArray(tasks) || part?.error) return null;
		if (!part) return { tasks, reports: null, children: [] };
		const started = (part.details as { children?: { id: number }[] } | undefined)?.children;
		if (Array.isArray(started)) {
			// Before the first list from the server, a started child shows as at work.
			const rows = started.map(
				(s) =>
					children.find((c) => c.id === s.id) ??
					({ ...s, title: '', call: 0, status: 'working', started: 0, reserved: 0 } as ChildRecord)
			);
			return { tasks, reports: null, children: rows };
		}
		try {
			const reports = (JSON.parse(resultText(part)) as { reports?: ChildReport[] }).reports;
			return Array.isArray(reports) ? { tasks, reports, children: [] } : null;
		} catch {
			return null;
		}
	}

	/** The `render` view, from the arguments, only if the server accepted it. */
	function drawn(args: unknown, part: ToolResult | undefined): View | null {
		if (!part || part.error) return null;
		try {
			return parseRender(args);
		} catch {
			return null;
		}
	}

	/** The `show_page` card, from the tool result; `null` if it cannot be read. */
	type Card = { path: string; kind: string; title: string; summary: string; status?: string };
	function card(part: ToolResult | undefined): Card | null {
		if (!part || part.error) return null;
		try {
			const value = JSON.parse(resultText(part)) as Card;
			return value.path?.startsWith('/') ? value : null;
		} catch {
			return null;
		}
	}
	const userText = (m: TranscriptMessage) =>
		m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');

	// On the page costs are credits (`budget.ts`); the real cost stays in the tooltip.
	const spent = (usd: number) => {
		const n = credits(usd);
		return `${n.toLocaleString(locale)} ${n === 1 ? labels.credit : labels.credits}`;
	};
	const dollars = (usd: number) => `$${usd.toLocaleString('en', { maximumSignificantDigits: 3 })}`;
	// The counter shows only when credits are about to run out.
	const lowBudget = $derived(
		budget !== null && budget.remaining < budget.limit * SHOW_BUDGET_BELOW
	);
	/**
	 * The text of a notice, in the message's language when Jev recognized it ("ciao" on `/en`
	 * gets the notice in Italian), with the refill time in the reader's time zone.
	 */
	function noticeText(item: Local) {
		const lang = triages[item.text]?.lang ?? locale;
		const texts = labels.notice[lang] ?? labels.notice[locale];
		return texts[item.reason].replace(
			'{time}',
			nextReset(new Date()).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
		);
	}
	const tokens = (n: number) =>
		n >= 1000 ? `${(n / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}k` : String(n);

	/** A count with its unit, from `singular|plural`. */
	function plural(forms: string, n: number) {
		const [one, many = one] = forms.split('|');
		return `${n.toLocaleString(locale)} ${n === 1 ? one : many}`;
	}
	/** A tool's sentence on its token; a tool without one shows its name. */
	const sentence = (name: string, step: Step) =>
		labels.steps[name] ? fillStep(labels.steps[name], step.values) || name : name;
	const countText = (step: Step) =>
		step.count ? plural(labels.counts[step.count.kind], step.count.n) : '';
	const childLed = (child: ChildRecord) =>
		child.status === 'working' ? 'in-progress' : child.status === 'done' ? 'completed' : 'archived';
	const stepState = (result: ToolResult | undefined) =>
		!result ? 'running' : result.error ? 'error' : 'done';

	/** One token of a turn's work: a tool call, or a sub-agent that `delegate` started. */
	type Token =
		| { kind: 'tool'; id: string; name: string; args: unknown; result?: ToolResult; step: Step }
		| { kind: 'child'; id: string; child: ChildRecord; title: string };
	type Report = NonNullable<ReturnType<typeof parseReport>>;
	/**
	 * The transcript read by turn: a message of the visitor, a sub-agent's report, or the
	 * agent's messages between two of them, read as one. `start` and `end` are the indexes in
	 * `shown`, where the notices stopped before the model are anchored.
	 */
	type Item = { start: number; end: number } & (
		| { kind: 'user'; message: TranscriptMessage }
		| { kind: 'report'; message: TranscriptMessage; report: Report }
		| { kind: 'turn'; key: string; messages: TranscriptMessage[] }
	);
	const items = $derived.by(() => {
		const out: Item[] = [];
		shown.forEach((message, index) => {
			if (message.role === 'user') {
				const report = parseReport(userText(message));
				out.push(
					report
						? { kind: 'report', message, report, start: index, end: index }
						: { kind: 'user', message, start: index, end: index }
				);
				return;
			}
			const last = out.at(-1);
			if (last?.kind === 'turn') {
				last.messages = [...last.messages, message];
				last.end = index;
			} else
				out.push({ kind: 'turn', key: message.id, messages: [message], start: index, end: index });
		});
		return out;
	});

	/**
	 * A turn's work and answer: the tokens (tool calls; a `delegate` that started sub-agents is
	 * one token per sub-agent), the reasoning, and the content in order. Cards, drafts and
	 * views are content, not work: they stay in the answer.
	 */
	function workOf(messages: TranscriptMessage[]) {
		const steps: Token[] = [];
		const thinking: string[] = [];
		const content: { part: TranscriptPart; live: boolean }[] = [];
		for (const message of messages) {
			for (const part of message.parts) {
				const live = message.id === 'live';
				if (part.type === 'text') {
					if (part.text.trim()) content.push({ part, live });
					continue;
				}
				if (part.type === 'thinking') {
					if (part.text.trim()) thinking.push(part.text);
					continue;
				}
				if (part.type !== 'tool-call') continue;
				const result = results.get(part.id);
				const work = part.name === 'delegate' ? delegated(part.arguments, result) : null;
				if (
					(part.name === 'draft_message' && drafted(part.arguments, result)) ||
					(part.name === 'render' && drawn(part.arguments, result)) ||
					(part.name === 'show_page' && card(result)) ||
					work?.reports
				) {
					content.push({ part, live });
				} else if (work?.children.length) {
					work.children.forEach((child, i) =>
						steps.push({
							kind: 'child',
							id: `${part.id}:${child.id}`,
							child,
							title: child.title || work.tasks[i]?.title || ''
						})
					);
				} else {
					steps.push({
						kind: 'tool',
						id: part.id,
						name: part.name,
						args: part.arguments,
						result,
						step: describeStep(
							part.name,
							part.arguments,
							result && { text: resultText(result), error: Boolean(result.error) }
						)
					});
				}
			}
		}
		const done = messages.filter((m) => m.usage && m.id !== 'live');
		const usage = done.length
			? {
					tokens: done.reduce((n, m) => n + (m.usage?.tokens ?? 0), 0),
					usd: done.reduce((n, m) => n + (m.usage?.usd ?? 0), 0)
				}
			: null;
		const live = steps.some((t) => (t.kind === 'tool' ? !t.result : t.child.status === 'working'));
		return { steps, thinking, content, usage, live };
	}
	/** The open token, whose call and result show under the row, and the open reasoning. */
	let openStep: string | null = $state(null);
	let openThinking: string | null = $state(null);
</script>

{#snippet verdict(triage: Triage | null | undefined)}
	{#if triage}
		<p class="font-mono text-[0.7rem] text-subtle">
			jev · {labels.intent[triage.intent]}
			{triage.confidence.toLocaleString(locale, { maximumFractionDigits: 2 })} · {labels.weight[
				triage.weight
			]} · {triage.lang} · {triage.ms} ms
		</p>
	{/if}
{/snippet}

{#snippet failure(raw: string, kind: ErrorKind, retryable: boolean)}
	<div class="flex flex-col gap-2" data-agent-error={kind}>
		<p class="text-[0.9375rem] text-pretty text-text">
			<span class="mr-2 font-mono text-xs text-danger">{labels.errors[kind].tag}</span>
			{labels.errors[kind].text}
		</p>
		<div class="flex flex-wrap items-center gap-3">
			{#if retryable}
				<button type="button" onclick={retry} class="chip hover:text-fg">{labels.retry}</button>
			{/if}
			{#if raw}
				{@render details(raw)}
			{/if}
		</div>
	</div>
{/snippet}

{#snippet details(raw: string)}
	<details class="min-w-0">
		<summary
			class="cursor-pointer font-mono text-[0.7rem] text-subtle transition-colors hover:text-fg"
		>
			{labels.errorDetails}
		</summary>
		<pre
			class="mt-2 overflow-x-auto overscroll-x-none rounded-[var(--radius-control)] bg-surface/60 px-3 py-2 text-xs whitespace-pre-wrap text-muted">{raw}</pre>
	</details>
{/snippet}

{#snippet progress()}
	{#if resuming}
		<!-- Nothing above it yet: it starts at the edge, like the line of an unreachable agent. -->
		<AgentStatus label={labels.phases.resume} inset={false} />
	{:else if phase}
		<div class="flex flex-col gap-2">
			<AgentStatus label={phaseLabel(phase)} meta={phaseMeta(phase)} inset={false} />
			{#if phase.kind === 'retry' && phase.error}
				{@render details(phase.error)}
			{/if}
		</div>
	{/if}
{/snippet}

<!-- The visitor's message: a lilac bubble on the right, as the home's card draws it, with
     Jev's verdict under it (concept Q, D2). -->
{#snippet visitorMessage(text: string, queuedNote = false)}
	<div class="flex flex-col items-end gap-1.5">
		<p
			class="max-w-[min(85%,36rem)] rounded-[var(--radius-panel)] rounded-br-[3px] bg-accent/18 px-3.5 py-2.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-fg"
		>
			{text}
		</p>
		{@render verdict(triages[text])}
		{#if queuedNote}
			<p class="font-mono text-[0.7rem] text-subtle">{labels.queued}</p>
		{/if}
	</div>
{/snippet}

{#snippet localNotice(item: Local)}
	{@render visitorMessage(item.text)}
	<p class="text-[0.9375rem] text-muted">{noticeText(item)}</p>
{/snippet}

<div class="flex flex-1 flex-col">
	{#if unreachable}
		<div class="mb-8"><AgentStatus label={labels.unreachable} inset={false} /></div>
	{/if}
	{#if empty}
		<div class="flex flex-col gap-10">
			<section class="flex flex-col gap-3">
				<h2 class="label">{labels.tryAsking}</h2>
				<ul class="flex flex-wrap gap-2">
					{#each labels.suggestions as suggestion (suggestion)}
						<li>
							<button
								type="button"
								onclick={() => ask(suggestion)}
								disabled={status !== 'open'}
								class="rounded-[var(--radius-control)] bg-surface px-3 py-2 text-left text-[0.9375rem] text-text transition-colors hover:bg-hover hover:text-fg disabled:opacity-40"
							>
								{suggestion}
							</button>
						</li>
					{/each}
				</ul>
			</section>
			<!-- What the agent does, each with the token it shows in a conversation (concept P,
			     D): the visitor learns how to read the work before asking. -->
			<section class="flex flex-col gap-3" data-agent-abilities>
				<h2 class="label">{labels.abilities.title}</h2>
				<ul class="flex flex-col">
					{#each labels.abilities.rows as row (row.tool)}
						{@const step = describeStep(row.tool, row.args)}
						<li
							class="grid gap-x-4 gap-y-0.5 py-2 not-first:border-t not-first:border-line/50 sm:grid-cols-[9.5rem_minmax(0,1fr)_minmax(0,17rem)] sm:items-center"
						>
							<span class="text-[0.9375rem] font-medium text-fg">{row.title}</span>
							<span class="text-[0.9375rem] text-muted">{row.note}</span>
							<span class="max-sm:hidden">
								<StepToken
									name={row.tool}
									{step}
									text={sentence(row.tool, step)}
									state={row.tool === 'delegate' ? 'running' : 'done'}
								/>
							</span>
						</li>
					{/each}
				</ul>
				<p class="text-sm text-pretty text-subtle">{labels.toolsNote}</p>
			</section>
		</div>
	{/if}
	<div class="flex flex-1 flex-col gap-6">
		{#each locals.filter((l) => l.after === 0) as item, i (i)}
			{@render localNotice(item)}
		{/each}
		{#each items as item (item.kind === 'turn' ? item.key : item.message.id)}
			{#if item.kind === 'report'}
				{@const report = item.report}
				{@const child = children.find((c) => c.id === report.id)}
				<!-- A sub-agent's findings: they reach the agent as a message, not the visitor's. -->
				<details class="group" data-agent-report>
					<summary
						class="flex cursor-pointer list-none flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-muted transition-colors hover:text-fg [&::-webkit-details-marker]:hidden"
					>
						<span class="led" data-status={report.status === 'finished' ? 'completed' : 'idea'}
						></span>
						<span class="text-fg">{labels.child} #{report.id} · {report.title}</span>
						<span>
							{report.status === 'finished'
								? labels.childDone
								: labels.childFailed}{#if child?.tokens}<span
									>{` · ${tokens(child.tokens)} token · ${spent(child.usd ?? 0)}`}</span
								>{/if}
						</span>
						{#if child}
							<button
								type="button"
								onclick={(e) => {
									e.preventDefault();
									sheet = report.id;
								}}
								class="ml-auto cursor-pointer text-subtle transition-colors hover:text-fg"
							>
								{labels.childWatch}
							</button>
						{/if}
					</summary>
					<div
						class="prose mt-2 max-w-none rounded-[var(--radius-control)] bg-surface/60 px-3.5 py-3 text-[0.9375rem] leading-relaxed prose-invert prose-p:my-2 prose-p:text-muted prose-a:text-fg prose-a:decoration-subtle prose-code:font-normal prose-code:text-fg prose-code:before:content-none prose-code:after:content-none prose-li:text-muted [&>:first-child]:mt-0 [&>:last-child]:mb-0"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown neutralizes HTML and links (src/agent/markdown.ts, with tests) -->
						{@html renderMarkdown(report.body)}
					</div>
				</details>
			{:else if item.kind === 'user'}
				{@render visitorMessage(userText(item.message))}
			{:else}
				{@const work = workOf(item.messages)}
				<div class="flex flex-col gap-3" data-agent-turn>
					{#if work.steps.length || work.thinking.length}
						<!-- The work of the turn: one header, then the tokens; a token opens its call and
						     result under the row, a sub-agent its sheet (concept Q, D2). -->
						<div class="flex flex-col gap-2" data-agent-work>
							<p class="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-muted">
								<span class="led" data-status={work.live ? 'in-progress' : 'completed'}></span>
								<span class="text-fg">{labels.work}</span>
								<span
									>{plural(labels.stepUnit, work.steps.length)}{#if work.usage}{` · ${tokens(
											work.usage.tokens
										)} token · `}<span title={dollars(work.usage.usd)}>{spent(work.usage.usd)}</span
										>{/if}</span
								>
								{#if work.thinking.length}
									<button
										type="button"
										aria-expanded={openThinking === item.key}
										onclick={() => (openThinking = openThinking === item.key ? null : item.key)}
										class="cursor-pointer text-subtle transition-colors hover:text-fg aria-expanded:text-fg"
									>
										{labels.reasoning}
									</button>
								{/if}
							</p>
							{#if openThinking === item.key}
								<p class="font-mono text-xs whitespace-pre-wrap text-subtle">
									{work.thinking.join('\n\n')}
								</p>
							{/if}
							{#if work.steps.length}
								<div class="flex flex-wrap gap-1.5">
									{#each work.steps as token (token.id)}
										{#if token.kind === 'child'}
											<button
												type="button"
												onclick={() => (sheet = sheet === token.child.id ? null : token.child.id)}
												aria-pressed={sheet === token.child.id}
												class="{TOKEN} cursor-pointer transition-colors hover:bg-hover hover:text-fg aria-pressed:bg-hover"
											>
												<span class="led" data-status={childLed(token.child)}></span>
												<span class="truncate text-fg">{token.title}</span>
												<span class="font-mono text-[0.7rem] whitespace-nowrap text-subtle"
													>{statusLabel(token.child.status)}</span
												>
											</button>
										{:else}
											<StepToken
												name={token.name}
												step={token.step}
												text={sentence(token.name, token.step)}
												count={countText(token.step)}
												state={stepState(token.result)}
												expanded={openStep === token.id}
												onclick={() => (openStep = openStep === token.id ? null : token.id)}
											/>
										{/if}
									{/each}
								</div>
							{/if}
							{#each work.steps as token (token.id)}
								{#if token.kind === 'tool' && openStep === token.id}
									<StepDetail
										name={token.name}
										call={callText(token.args)}
										result={token.result && resultText(token.result)}
										labels={{ call: labels.toolCall, result: labels.result }}
									/>
								{/if}
							{/each}
						</div>
					{/if}
					{#each work.content as { part, live }, i (i)}
						{#if part.type === 'text'}
							<div use:phosphor={{ text: part.text, live }} class="{ANSWER_PROSE} text-[1.0625rem]">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown neutralizes HTML and links (src/agent/markdown.ts, with tests) -->
								{@html renderMarkdown(part.text)}
							</div>
						{:else if part.type === 'tool-call' && part.name === 'draft_message' && drafted(part.arguments, results.get(part.id))}
							{@const draft = drafted(part.arguments, results.get(part.id))!}
							<DraftView
								subject={draft.subject}
								text={draft.text}
								delivery={drafts[part.id]}
								siteKey={turnstileKey}
								labels={{
									draft: labels.draft,
									subject: labels.draftSubject,
									contact: labels.draftContact,
									send: labels.draftSend,
									sending: labels.draftSending,
									sent: labels.draftSent
								}}
								onsend={(fields) => sendDraft(part.id, fields)}
							/>
						{:else if part.type === 'tool-call' && part.name === 'delegate' && delegated(part.arguments, results.get(part.id))}
							{@const work = delegated(part.arguments, results.get(part.id))!}
							<DelegateView
								tasks={work.tasks}
								reports={work.reports}
								children={work.children}
								labels={{ subagents: labels.subagents, answer: labels.answer }}
								{tokens}
								{spent}
								{statusLabel}
								onopen={(id) => (sheet = id)}
							/>
						{:else if part.type === 'tool-call' && part.name === 'render' && drawn(part.arguments, results.get(part.id))}
							<RenderView view={drawn(part.arguments, results.get(part.id))!} {locale} />
						{:else if part.type === 'tool-call' && part.name === 'show_page' && card(results.get(part.id))}
							{@const page = card(results.get(part.id))!}
							<a
								href={page.path}
								class="group flex items-start gap-4 rounded-[var(--radius-control)] bg-surface px-4 py-3 transition-colors hover:bg-hover"
							>
								<span class="flex min-w-0 flex-1 flex-col gap-1">
									<span class="flex items-center gap-2 font-mono text-xs text-subtle">
										{#if page.status}<span class="led" data-status={page.status}></span>{/if}
										{labels.kinds[page.kind] ?? page.kind}
									</span>
									<span class="text-fg">{page.title}</span>
									{#if page.summary}
										<span class="text-sm text-pretty text-muted">{page.summary}</span>
									{/if}
								</span>
								<span
									class="flex shrink-0 items-center gap-1 font-mono text-xs text-subtle transition-colors group-hover:text-fg"
								>
									{labels.open}<ArrowUpRight data-motion="external" class="size-3.5" />
								</span>
							</a>
						{/if}
					{/each}
					{#each item.messages as message (message.id)}
						{#if message.error && !(view.error && message.id === shown.at(-1)?.id)}
							{@render failure(
								message.error,
								message.stopReason === 'aborted' ? 'aborted' : errorKind(message.error),
								false
							)}
						{/if}
					{/each}
					{#if !work.steps.length && !work.thinking.length && work.usage}
						<p class="font-mono text-[0.7rem] text-subtle">
							{tokens(work.usage.tokens)} token ·
							<span title={dollars(work.usage.usd)}>{spent(work.usage.usd)}</span>
						</p>
					{/if}
				</div>
			{/if}
			{#each locals.filter((l) => l.after > item.start && l.after <= item.end + 1) as local, i (i)}
				{@render localNotice(local)}
			{/each}
		{/each}
		{#if queued}
			{@render progress()}
		{/if}
		{#each pending as item, i (i)}
			<div data-agent-pending>
				{@render visitorMessage(item.text, queued && triages[item.text] !== undefined)}
			</div>
		{/each}
		{#if !queued}
			{@render progress()}
		{/if}
		{#if view.error}
			{@const kind = errorKind(view.error)}
			{@render failure(
				view.error,
				kind,
				!view.running && Boolean(lastUserText) && kind !== 'aborted'
			)}
		{/if}
	</div>

	<!-- Anchored at the bottom of the pane, the conversation scrolls behind it: a sub-agent's
	     sheet, when open, and the glass panel of the field. Two glasses side by side, neither
	     inside the other (DECISIONS #16). -->
	<div class="sticky bottom-3 z-10 mt-8 mb-3 flex flex-col gap-2">
		{#if sheetChild}
			<ChildSheet
				child={sheetChild}
				{visitor}
				labels={{
					subagent: labels.child,
					stop: labels.childStop,
					close: labels.childClose,
					task: labels.childTask,
					end: labels.childEnd,
					stoppedNote: labels.childStoppedNote,
					failedNote: labels.childFailedNote
				}}
				{statusLabel}
				{phaseLabel}
				{tokens}
				{spent}
				{sentence}
				{countText}
				stepLabels={{ call: labels.toolCall, result: labels.result }}
				onclose={() => (sheet = null)}
			/>
		{/if}
		<div class="glass rounded-[var(--radius-panel)] bg-surface/40 px-3 pt-3 pb-2.5">
			{#if rail.length}
				<div class="mb-2.5 flex flex-wrap gap-1.5 border-b border-line/60 pb-2.5" data-agent-rail>
					{#each rail as child (child.id)}
						<button
							type="button"
							onclick={() => (sheet = sheet === child.id ? null : child.id)}
							aria-pressed={sheet === child.id}
							class="chip max-w-full cursor-pointer hover:text-fg aria-pressed:bg-hover aria-pressed:text-fg"
						>
							<span
								class="led"
								data-status={child.status === 'working'
									? 'in-progress'
									: child.status === 'done'
										? 'completed'
										: 'idea'}
							></span>
							<span class="truncate">{child.title}</span>
							<span class="text-subtle">{statusLabel(child.status)}</span>
						</button>
					{/each}
				</div>
			{/if}
			<form onsubmit={submit} class="flex items-end gap-3">
				<span class="pb-1.5 font-mono text-sm text-accent glow select-none" aria-hidden="true"
					>›</span
				>
				<textarea
					bind:value={input}
					data-agent-input
					onkeydown={onKey}
					rows="1"
					placeholder={status === 'open'
						? labels.placeholder
						: status === 'connecting'
							? labels.connecting
							: labels.offline}
					aria-label={labels.placeholder}
					class="[field-sizing:content] min-h-8 flex-1 resize-none bg-transparent py-1.5 font-mono text-[0.875rem] text-fg outline-none placeholder:text-subtle"
				></textarea>
				{#if view.running}
					<button type="button" onclick={() => send({ type: 'abort' })} class="chip hover:text-fg">
						{labels.stop}
					</button>
				{:else}
					<button
						type="submit"
						disabled={status !== 'open'}
						class="chip hover:text-fg disabled:opacity-40"
					>
						{labels.send}
					</button>
				{/if}
			</form>
			<div
				class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1 font-mono text-[0.7rem] text-subtle"
			>
				<span class="flex items-center gap-2" aria-live="polite">
					<span class="led" data-status={status === 'open' ? 'in-progress' : 'idea'}></span>
					{#if reconnected}
						<span class="text-live">{labels.reconnected}</span>
					{:else if status === 'closed' && opened}
						{labels.reconnecting}
					{:else}
						{view.model?.modelId ??
							(status === 'open'
								? ''
								: status === 'connecting'
									? labels.connecting
									: labels.offline)}
					{/if}
				</span>
				{#if budget && lowBudget}
					<span>{credits(budget.remaining).toLocaleString(locale)} {labels.budget}</span>
				{/if}
				<a href={labels.privacyHref} class="ml-auto transition-colors hover:text-fg"
					>{labels.privacyNote}</a
				>
			</div>
		</div>
	</div>
</div>
