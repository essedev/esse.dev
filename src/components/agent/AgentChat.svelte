<script lang="ts">
	import { AgentClient } from 'agents/client';
	import { onMount, tick } from 'svelte';
	import type { ServerMessage, TranscriptMessage, TranscriptPart } from '../../agent/protocol';
	import { EMPTY_VIEW, reduceEvents, type PiSessionView } from '../../agent/view';

	/**
	 * La trascrizione dell'agente: un WebSocket verso il Durable Object del visitatore,
	 * gli eventi di pi piegati da `reduceEvents` (lo stesso riduttore del server), e ogni
	 * chiamata ai tool visibile e apribile. Il visitatore ha un oggetto suo, ricordato nel
	 * browser, così ritrova la conversazione.
	 */

	type Labels = {
		placeholder: string;
		send: string;
		stop: string;
		reset: string;
		connecting: string;
		offline: string;
		thinking: string;
		toolCall: string;
		result: string;
	};
	let { labels }: { labels: Labels } = $props();

	const VISITOR_KEY = 'agent-visitor';

	let view: PiSessionView = $state(EMPTY_VIEW);
	let status: 'connecting' | 'open' | 'closed' = $state('connecting');
	let input = $state('');
	let client: AgentClient | undefined;
	let scroller: HTMLElement | undefined = $state();

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
			if (message.type === 'events') view = reduceEvents(view, message.events);
			else if (message.type === 'error') view = { ...view, error: message.message };
		});
		return () => client?.close();
	});

	// La trascrizione segue l'ultima riga mentre arriva.
	$effect(() => {
		void view.messages.length;
		void view.live;
		tick().then(() => scroller?.scrollTo({ top: scroller.scrollHeight }));
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

	// I risultati dei tool arrivano come messaggi a sé: li si aggancia alla loro chiamata.
	const results = $derived(
		new Map(
			view.messages
				.flatMap((m) => m.parts)
				.filter(
					(p): p is Extract<TranscriptPart, { type: 'tool-result' }> => p.type === 'tool-result'
				)
				.map((p) => [p.id, p])
		)
	);
	const shown = $derived(
		[...view.messages, ...(view.live ? [view.live] : [])].filter(
			(m: TranscriptMessage) => m.role === 'user' || m.role === 'assistant'
		)
	);
	const text = (part: Extract<TranscriptPart, { type: 'tool-result' }>) =>
		part.content.map((c) => (c.type === 'text' ? c.text : '[image]')).join('\n');
</script>

<div class="flex min-h-[60vh] flex-col">
	<div bind:this={scroller} class="flex flex-1 flex-col gap-6 font-mono text-[0.875rem]">
		{#each shown as message (message.id)}
			{#if message.role === 'user'}
				<p class="flex gap-3 text-fg">
					<span class="text-accent select-none" aria-hidden="true">›</span>
					<span class="whitespace-pre-wrap"
						>{message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')}</span
					>
				</p>
			{:else}
				<div class="flex flex-col gap-3 pl-6">
					{#each message.parts as part, i (i)}
						{#if part.type === 'text' && part.text.trim()}
							<p class="font-sans text-[1.0625rem] leading-relaxed whitespace-pre-wrap text-text">
								{part.text}
							</p>
						{:else if part.type === 'thinking' && part.text.trim()}
							<p class="text-xs whitespace-pre-wrap text-subtle">{part.text}</p>
						{:else if part.type === 'tool-call'}
							{@const result = results.get(part.id)}
							<details class="group rounded-[var(--radius-control)] bg-panel">
								<summary
									class="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-xs text-muted transition-colors hover:text-fg"
								>
									<span
										class="led"
										data-status={result ? (result.error ? 'archived' : 'completed') : 'in-progress'}
									></span>
									<span class="text-fg">{part.name}</span>
									<span class="truncate">{JSON.stringify(part.arguments)}</span>
								</summary>
								<div class="flex flex-col gap-2 px-3 pb-3 text-xs">
									<p class="label">{labels.toolCall}</p>
									<pre class="overflow-x-auto whitespace-pre-wrap text-muted">{JSON.stringify(
											part.arguments,
											null,
											2
										)}</pre>
									{#if result}
										<p class="label">{labels.result}</p>
										<pre class="max-h-64 overflow-auto whitespace-pre-wrap text-muted">{text(
												result
											)}</pre>
									{/if}
								</div>
							</details>
						{/if}
					{/each}
					{#if message.error}
						<p class="text-xs text-danger">{message.error}</p>
					{/if}
				</div>
			{/if}
		{/each}
		{#if view.running && !view.live}
			<p class="flex items-center gap-2.5 pl-6 text-xs text-subtle">
				<span class="led" data-status="in-progress"></span>{labels.thinking}
			</p>
		{/if}
		{#if view.error}
			<p class="pl-6 text-xs text-danger">{view.error}</p>
		{/if}
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
			<button type="button" onclick={() => send({ type: 'abort' })} class="chip hover:text-fg"
				>{labels.stop}</button
			>
		{:else}
			<button
				type="submit"
				disabled={status !== 'open'}
				class="chip hover:text-fg disabled:opacity-40">{labels.send}</button
			>
		{/if}
	</form>
	<div class="mt-3 flex items-center justify-between font-mono text-[0.7rem] text-subtle">
		<span class="flex items-center gap-2">
			<span class="led" data-status={status === 'open' ? 'in-progress' : 'idea'}></span>
			{view.model?.modelId ??
				(status === 'open' ? '' : status === 'connecting' ? labels.connecting : labels.offline)}
		</span>
		<button
			type="button"
			onclick={() => send({ type: 'reset' })}
			class="transition-colors hover:text-fg">{labels.reset}</button
		>
	</div>
</div>
