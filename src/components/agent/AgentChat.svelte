<script lang="ts">
	import { AgentClient } from 'agents/client';
	import { ArrowUpRight } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { credits, nextReset, SHOW_BUDGET_BELOW } from '../../agent/budget';
	import { renderMarkdown } from '../../agent/markdown';
	import { parseRender, type RenderView as View } from '../../agent/render';
	import type { ChildReport } from '../../agent/delegate';
	import DelegateView from './DelegateView.svelte';
	import DraftView from './DraftView.svelte';
	import RenderView from './RenderView.svelte';
	import type { ServerMessage, TranscriptMessage, TranscriptPart } from '../../agent/protocol';
	import type { Triage } from '../../agent/triage';
	import { EMPTY_VIEW, reduceEvents, type PiSessionView } from '../../agent/view';

	/**
	 * La trascrizione dell'agente: un WebSocket verso il Durable Object del visitatore,
	 * gli eventi di pi piegati da `reduceEvents` (lo stesso riduttore del server). Si vede
	 * come lavora: il triage di Jev su ogni messaggio, ogni chiamata ai tool (apribile),
	 * token e costo di ogni risposta, il budget che resta. Il visitatore ha un oggetto suo,
	 * ricordato nel browser, così ritrova la conversazione.
	 */

	type Labels = {
		placeholder: string;
		send: string;
		stop: string;
		reset: string;
		connecting: string;
		offline: string;
		thinking: string;
		retrying: string;
		tools: string;
		toolsNote: string;
		/** Descrizione per il visitatore; senza, quella che il server dà al modello. */
		toolLabels: Record<string, string>;
		/** Come raggruppare il catalogo; un tool fuori dai gruppi finisce in coda. */
		toolGroups: { label: string; names: string[] }[];
		/** Il nome della sezione per ogni tipo di pagina, sulle schede di `show_page`. */
		kinds: Record<string, string>;
		open: string;
		subagents: string;
		answer: string;
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
		notice: Record<'offtopic' | 'abuse' | 'budget', string>;
		intent: Record<Triage['intent'], string>;
		weight: Record<Triage['weight'], string>;
	};
	let { labels, locale, turnstileKey }: { labels: Labels; locale: string; turnstileKey: string } =
		$props();

	const VISITOR_KEY = 'agent-visitor';

	/** Un messaggio fermato prima del modello: vive solo nel browser. */
	type Local = { text: string; reason: 'offtopic' | 'abuse' | 'budget'; after: number };

	let view: PiSessionView = $state(EMPTY_VIEW);
	let status: 'connecting' | 'open' | 'closed' = $state('connecting');
	let input = $state('');
	let triages: Record<string, Triage | null> = $state({});
	let locals: Local[] = $state([]);
	let budget: { remaining: number; limit: number } | null = $state(null);
	let catalog: { name: string; description: string }[] = $state([]);
	/** Lo stato degli invii delle bozze, per id della chiamata a `draft_message`. */
	let drafts: Record<string, { status: 'sending' | 'sent' | 'error'; message?: string }> = $state(
		{}
	);
	let client: AgentClient | undefined;

	function visitorId(): string {
		try {
			const saved = localStorage.getItem(VISITOR_KEY);
			if (saved) return saved;
			const id = crypto.randomUUID();
			localStorage.setItem(VISITOR_KEY, id);
			return id;
		} catch {
			// Niente storage (navigazione privata): una conversazione per visita.
			return crypto.randomUUID();
		}
	}

	// Il catalogo è quello che il server annuncia: i gruppi lo ordinano, non lo decidono.
	const groups = $derived.by(() => {
		const known = new Set(labels.toolGroups.flatMap((g) => g.names));
		const pick = (names: string[]) => catalog.filter((t) => names.includes(t.name));
		return [
			...labels.toolGroups.map((g) => ({
				label: g.label,
				tools: g.names.flatMap((n) => pick([n]))
			})),
			{ label: '', tools: catalog.filter((t) => !known.has(t.name)) }
		].filter((g) => g.tools.length > 0);
	});

	/** Il tool di cui si legge la descrizione: quello sotto il puntatore, a fuoco o toccato. */
	let picked: string | null = $state(null);
	const toolLabel = (name: string) =>
		labels.toolLabels[name] ?? catalog.find((t) => t.name === name)?.description ?? '';

	const shown = $derived(
		[...view.messages, ...(view.live ? [view.live] : [])].filter(
			(m: TranscriptMessage) => m.role === 'user' || m.role === 'assistant'
		)
	);

	onMount(() => {
		client = new AgentClient({ agent: 'SiteAgent', name: visitorId(), host: location.host });
		client.addEventListener('open', () => (status = 'open'));
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
				case 'events':
					view = reduceEvents(view, message.events);
					break;
				case 'triage':
					triages = { ...triages, [message.text]: message.triage };
					break;
				case 'notice':
					locals = [...locals, { text: message.text, reason: message.reason, after: shown.length }];
					break;
				case 'drafts':
					drafts = {
						...drafts,
						...Object.fromEntries(message.sent.map((id) => [id, { status: 'sent' as const }]))
					};
					break;
				case 'draft':
					drafts = {
						...drafts,
						[message.draftId]: { status: message.status, message: message.message }
					};
					break;
				case 'budget':
					budget = { remaining: message.remaining, limit: message.limit };
					break;
				case 'error':
					view = { ...view, error: message.message };
					break;
			}
		});
		return () => client?.close();
	});

	// La trascrizione segue l'ultima riga mentre arriva, ma solo se chi legge è già in
	// fondo: chi è risalito a rileggere non viene riportato giù. Scorre il riquadro su
	// desktop e la finestra su mobile, dove il riquadro non ha uno scroll suo.
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
		if (!following) return;
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
		send({ type: 'submit', input: text, whenBusy: 'followUp' });
		input = '';
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			(event.currentTarget as HTMLTextAreaElement).form?.requestSubmit();
		}
	}

	// "Riprova" dopo un errore: rimanda l'ultimo messaggio del visitatore.
	const lastUserText = $derived(
		[...view.messages]
			.reverse()
			.find((m) => m.role === 'user')
			?.parts.map((p) => (p.type === 'text' ? p.text : ''))
			.join('') ?? ''
	);
	function retry() {
		if (!lastUserText || status !== 'open') return;
		view = { ...view, error: null };
		send({ type: 'submit', input: lastUserText, whenBusy: 'followUp' });
	}

	function ask(text: string) {
		if (status !== 'open') return;
		sent = true;
		following = true;
		send({ type: 'submit', input: text, whenBusy: 'followUp' });
	}

	// Lo stato vuoto sparisce al primo invio, senza aspettare che il server lo confermi.
	let sent = $state(false);
	const empty = $derived(!sent && shown.length === 0 && locals.length === 0 && !view.running);

	function reset() {
		send({ type: 'reset' });
		sent = false;
		triages = {};
		locals = [];
	}

	// I risultati dei tool arrivano come messaggi a sé: li si aggancia alla loro chiamata.
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

	/** Il codice di `run_code`, da mostrare come codice e non come stringa JSON. */
	const code = (args: unknown) =>
		args && typeof args === 'object' && typeof (args as { code?: unknown }).code === 'string'
			? (args as { code: string }).code
			: undefined;

	/** Nella riga chiusa, la prima riga che dice qualcosa: non la firma della funzione. */
	const codeLine = (args: unknown) =>
		code(args)
			?.split('\n')
			.map((l) => l.trim())
			.find((l) => l && !/^async\s*\(.*\)\s*=>\s*\{$/.test(l));

	/** La bozza di `draft_message` dagli argomenti, se il server l'ha accettata. */
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

	/** I compiti di `delegate` dagli argomenti, e i resoconti dal risultato quando c'è. */
	function delegated(
		args: unknown,
		part: ToolResult | undefined
	): { tasks: { title: string; task: string }[]; reports: ChildReport[] | null } | null {
		const tasks = (args as { tasks?: unknown } | null)?.tasks;
		if (!Array.isArray(tasks) || part?.error) return null;
		if (!part) return { tasks, reports: null };
		try {
			const reports = (JSON.parse(resultText(part)) as { reports?: ChildReport[] }).reports;
			return Array.isArray(reports) ? { tasks, reports } : null;
		} catch {
			return null;
		}
	}

	/** La vista di `render`, dagli argomenti, solo se il server l'ha accettata. */
	function drawn(args: unknown, part: ToolResult | undefined): View | null {
		if (!part || part.error) return null;
		try {
			return parseRender(args);
		} catch {
			return null;
		}
	}

	/** La scheda di `show_page`, dal risultato del tool; `null` se non è leggibile. */
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

	// In pagina i costi sono crediti (`budget.ts`); il costo vero resta nel tooltip.
	const spent = (usd: number) => {
		const n = credits(usd);
		return `${n.toLocaleString(locale)} ${n === 1 ? labels.credit : labels.credits}`;
	};
	const dollars = (usd: number) => `$${usd.toLocaleString('en', { maximumSignificantDigits: 3 })}`;
	// Il contatore si vede solo quando i crediti stanno per finire.
	const lowBudget = $derived(
		budget !== null && budget.remaining < budget.limit * SHOW_BUDGET_BELOW
	);
	/** Il testo di un avviso, con l'ora della ricarica nel fuso di chi legge. */
	const noticeText = (reason: Local['reason']) =>
		labels.notice[reason].replace(
			'{time}',
			nextReset(new Date()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
		);
	const tokens = (n: number) =>
		n >= 1000 ? `${(n / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}k` : String(n);
</script>

{#snippet verdict(triage: Triage | null | undefined)}
	{#if triage}
		<p class="pl-6 font-mono text-[0.7rem] text-subtle">
			jev · {labels.intent[triage.intent]}
			{triage.confidence.toLocaleString(locale, { maximumFractionDigits: 2 })} · {labels.weight[
				triage.weight
			]} · {triage.lang} · {triage.ms} ms
		</p>
	{/if}
{/snippet}

{#snippet localNotice(item: Local)}
	<div class="flex flex-col gap-1.5">
		<p class="flex gap-3 font-mono text-[0.875rem] text-fg">
			<span class="text-accent glow select-none" aria-hidden="true">›</span>
			<span class="whitespace-pre-wrap">{item.text}</span>
		</p>
		{@render verdict(triages[item.text])}
	</div>
	<p class="pl-6 text-[0.9375rem] text-muted">{noticeText(item.reason)}</p>
{/snippet}

<div class="flex flex-1 flex-col">
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
			{#if catalog.length}
				<!-- Solo i nomi, per gruppo; la descrizione di uno alla volta nella riga sotto. -->
				<section
					class="flex flex-col gap-3"
					onmouseleave={() => (picked = null)}
					onfocusout={(e) => {
						if (!e.currentTarget.contains(e.relatedTarget as Node | null)) picked = null;
					}}
				>
					<h2 class="label">{labels.tools}</h2>
					<dl class="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-6 gap-y-1.5">
						{#each groups as group (group.label)}
							<dt class="font-mono text-xs text-subtle">{group.label}</dt>
							<dd class="flex flex-wrap gap-1">
								{#each group.tools as tool (tool.name)}
									<button
										type="button"
										aria-describedby="agent-tool-detail"
										data-active={picked === tool.name || undefined}
										onmouseenter={() => (picked = tool.name)}
										onfocus={() => (picked = tool.name)}
										onclick={() => (picked = tool.name)}
										class="cursor-pointer rounded-[var(--radius-control)] px-1.5 py-0.5 font-mono text-sm text-text transition-colors hover:bg-hover hover:text-fg data-active:bg-hover data-active:text-fg"
									>
										{tool.name}
									</button>
								{/each}
							</dd>
						{/each}
					</dl>
					<p
						id="agent-tool-detail"
						aria-live="polite"
						class="min-h-[1.5em] text-sm text-pretty text-subtle"
					>
						{#key picked}
							<span in:fade={{ duration: 140 }}>
								{#if picked}
									<span class="font-mono text-fg">{picked}</span>
									<span class="text-muted">· {toolLabel(picked)}</span>
								{:else}
									{labels.toolsNote}
								{/if}
							</span>
						{/key}
					</p>
				</section>
			{/if}
		</div>
	{/if}
	<div class="flex flex-1 flex-col gap-6">
		{#each locals.filter((l) => l.after === 0) as item, i (i)}
			{@render localNotice(item)}
		{/each}
		{#each shown as message, index (message.id)}
			{#if message.role === 'user'}
				{@const text = userText(message)}
				{@const triage = triages[text]}
				<div class="flex flex-col gap-1.5">
					<p class="flex gap-3 font-mono text-[0.875rem] text-fg">
						<span class="text-accent glow select-none" aria-hidden="true">›</span>
						<span class="whitespace-pre-wrap">{text}</span>
					</p>
					{@render verdict(triage)}
				</div>
			{:else}
				<div class="flex flex-col gap-3 pl-6">
					{#each message.parts as part, i (i)}
						{#if part.type === 'text' && part.text.trim()}
							<div
								class="prose max-w-none text-[1.0625rem] leading-relaxed prose-invert prose-headings:mt-6 prose-headings:mb-2 prose-headings:font-medium prose-headings:text-fg prose-h1:text-[1.2em] prose-h2:text-[1.1em] prose-h3:text-[1em] prose-p:my-3 prose-p:text-text prose-a:text-fg prose-a:decoration-subtle prose-a:underline-offset-4 prose-strong:font-medium prose-strong:text-fg prose-code:rounded prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-fg prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-[var(--radius-control)] prose-pre:bg-panel prose-pre:text-xs prose-ol:my-3 prose-ul:my-3 prose-li:my-1 prose-li:text-text prose-li:marker:text-accent [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&>:first-child]:mt-0 [&>:last-child]:mb-0"
							>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown neutralizza HTML e link (src/agent/markdown.ts, con test) -->
								{@html renderMarkdown(part.text)}
							</div>
						{:else if part.type === 'thinking' && part.text.trim()}
							<details class="group">
								<summary
									class="cursor-pointer font-mono text-[0.7rem] text-subtle transition-colors hover:text-muted"
								>
									{labels.reasoning}
								</summary>
								<p class="mt-2 font-mono text-xs whitespace-pre-wrap text-subtle">{part.text}</p>
							</details>
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
								labels={{ subagents: labels.subagents, answer: labels.answer }}
								{tokens}
								{spent}
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
									{labels.open}<ArrowUpRight class="size-3.5" />
								</span>
							</a>
						{:else if part.type === 'tool-call'}
							{@const result = results.get(part.id)}
							<details class="rounded-[var(--radius-control)] bg-panel">
								<summary
									class="flex cursor-pointer items-center gap-2.5 px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-fg"
								>
									<span
										class="led"
										data-status={result ? (result.error ? 'archived' : 'completed') : 'in-progress'}
									></span>
									<span class="text-fg">{part.name}</span>
									<span class="truncate"
										>{codeLine(part.arguments) ?? JSON.stringify(part.arguments)}</span
									>
								</summary>
								<div class="flex flex-col gap-2 px-3 pb-3 font-mono text-xs">
									<p class="label">{labels.toolCall}</p>
									<pre class="overflow-x-auto whitespace-pre-wrap text-muted">{code(
											part.arguments
										) ?? JSON.stringify(part.arguments, null, 2)}</pre>
									{#if result}
										<p class="label">{labels.result}</p>
										<pre class="max-h-64 overflow-auto whitespace-pre-wrap text-muted">{resultText(
												result
											)}</pre>
									{/if}
								</div>
							</details>
						{/if}
					{/each}
					{#if message.error}
						<p class="font-mono text-xs text-danger">{message.error}</p>
					{/if}
					{#if message.usage && message.id !== 'live'}
						<p class="font-mono text-[0.7rem] text-subtle">
							{tokens(message.usage.tokens)} token ·
							<span title={dollars(message.usage.usd)}>{spent(message.usage.usd)}</span>
						</p>
					{/if}
				</div>
			{/if}
			{#each locals.filter((l) => l.after === index + 1) as item, i (i)}
				{@render localNotice(item)}
			{/each}
		{/each}
		{#if view.running && !view.live}
			<p class="flex items-center gap-2.5 pl-6 font-mono text-xs text-subtle">
				<span class="led" data-status="in-progress"></span>{labels.thinking}
			</p>
		{/if}
		{#if view.retry}
			<p class="pl-6 font-mono text-xs text-subtle">{labels.retrying}: {view.retry.error}</p>
		{/if}
		{#if view.error}
			<div class="flex items-center gap-3 pl-6">
				<p class="font-mono text-xs text-danger">{view.error}</p>
				{#if !view.running && lastUserText}
					<button type="button" onclick={retry} class="chip hover:text-fg">{labels.retry}</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Ancorato in fondo al riquadro: la conversazione scorre sopra e sfuma sul bordo. -->
	<div
		class="sticky bottom-0 mt-8 bg-bg pt-2 pb-4 before:pointer-events-none before:absolute before:inset-x-0 before:-top-8 before:h-8 before:bg-linear-to-t before:from-bg before:to-transparent"
	>
		<form
			onsubmit={submit}
			class="flex items-end gap-3 rounded-[var(--radius-panel)] bg-surface p-3"
		>
			<span class="pb-1.5 font-mono text-sm text-accent glow select-none" aria-hidden="true">›</span
			>
			<textarea
				bind:value={input}
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
			class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.7rem] text-subtle"
		>
			<span class="flex items-center gap-2">
				<span class="led" data-status={status === 'open' ? 'in-progress' : 'idea'}></span>
				{view.model?.modelId ??
					(status === 'open' ? '' : status === 'connecting' ? labels.connecting : labels.offline)}
			</span>
			{#if budget && lowBudget}
				<span>{credits(budget.remaining).toLocaleString(locale)} {labels.budget}</span>
			{/if}
			<button type="button" onclick={reset} class="ml-auto transition-colors hover:text-fg">
				{labels.reset}
			</button>
		</div>
	</div>
</div>
