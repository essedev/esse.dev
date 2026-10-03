<script lang="ts">
	import { AgentClient } from 'agents/client';
	import { onMount, tick } from 'svelte';
	import { renderMarkdown } from '../../agent/markdown';
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
		retry: string;
		reasoning: string;
		toolCall: string;
		result: string;
		budget: string;
		notice: Record<'offtopic' | 'abuse' | 'budget', string>;
		intent: Record<Triage['intent'], string>;
		weight: Record<Triage['weight'], string>;
	};
	let { labels, locale }: { labels: Labels; locale: string } = $props();

	const VISITOR_KEY = 'agent-visitor';

	/** Un messaggio fermato prima del modello: vive solo nel browser. */
	type Local = { text: string; reason: 'offtopic' | 'abuse' | 'budget'; after: number };

	let view: PiSessionView = $state(EMPTY_VIEW);
	let status: 'connecting' | 'open' | 'closed' = $state('connecting');
	let input = $state('');
	let triages: Record<string, Triage | null> = $state({});
	let locals: Local[] = $state([]);
	let budget: { remaining: number; limit: number } | null = $state(null);
	let client: AgentClient | undefined;
	let end: HTMLElement | undefined = $state();

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
				case 'events':
					view = reduceEvents(view, message.events);
					break;
				case 'triage':
					triages = { ...triages, [message.text]: message.triage };
					break;
				case 'notice':
					locals = [...locals, { text: message.text, reason: message.reason, after: shown.length }];
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

	// La trascrizione segue l'ultima riga mentre arriva.
	$effect(() => {
		void shown.length;
		void view.live;
		void locals.length;
		tick().then(() => end?.scrollIntoView({ block: 'end' }));
	});

	function send(message: object) {
		client?.send(JSON.stringify({ id: crypto.randomUUID(), ...message }));
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const text = input.trim();
		if (!text || status !== 'open') return;
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

	function reset() {
		send({ type: 'reset' });
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
	const userText = (m: TranscriptMessage) =>
		m.parts.map((p) => (p.type === 'text' ? p.text : '')).join('');

	const cents = (usd: number) =>
		`${(usd * 100).toLocaleString(locale, { maximumFractionDigits: usd * 100 < 0.1 ? 3 : 2 })}¢`;
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
			<span class="text-accent select-none" aria-hidden="true">›</span>
			<span class="whitespace-pre-wrap">{item.text}</span>
		</p>
		{@render verdict(triages[item.text])}
	</div>
	<p class="pl-6 text-[0.9375rem] text-muted">{labels.notice[item.reason]}</p>
{/snippet}

<div class="flex min-h-[55vh] flex-col">
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
						<span class="text-accent select-none" aria-hidden="true">›</span>
						<span class="whitespace-pre-wrap">{text}</span>
					</p>
					{@render verdict(triage)}
				</div>
			{:else}
				<div class="flex flex-col gap-3 pl-6">
					{#each message.parts as part, i (i)}
						{#if part.type === 'text' && part.text.trim()}
							<div
								class="agent-prose text-[1.0625rem] leading-relaxed text-text [&_li]:ml-5 [&_li]:list-disc [&_p+p]:mt-3 [&_strong]:text-fg [&_ul]:mt-2"
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
									<span class="truncate">{JSON.stringify(part.arguments)}</span>
								</summary>
								<div class="flex flex-col gap-2 px-3 pb-3 font-mono text-xs">
									<p class="label">{labels.toolCall}</p>
									<pre class="overflow-x-auto whitespace-pre-wrap text-muted">{JSON.stringify(
											part.arguments,
											null,
											2
										)}</pre>
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
							{tokens(message.usage.tokens)} token · {cents(message.usage.usd)}
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
		<div bind:this={end}></div>
	</div>

	<form
		onsubmit={submit}
		class="mt-8 flex items-end gap-3 rounded-[var(--radius-panel)] bg-surface p-3"
	>
		<span class="pb-1.5 font-mono text-sm text-accent select-none" aria-hidden="true">›</span>
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
	<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.7rem] text-subtle">
		<span class="flex items-center gap-2">
			<span class="led" data-status={status === 'open' ? 'in-progress' : 'idea'}></span>
			{view.model?.modelId ??
				(status === 'open' ? '' : status === 'connecting' ? labels.connecting : labels.offline)}
		</span>
		{#if budget}
			<span>{labels.budget} {cents(budget.remaining)} / {cents(budget.limit)}</span>
		{/if}
		<button type="button" onclick={reset} class="ml-auto transition-colors hover:text-fg">
			{labels.reset}
		</button>
	</div>
</div>
