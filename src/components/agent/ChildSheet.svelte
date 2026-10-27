<script lang="ts">
	import { AgentClient } from 'agents/client';
	import { onMount } from 'svelte';
	import type { ChildRecord } from '../../agent/delegate';
	import { renderMarkdown } from '../../agent/markdown';
	import { phaseOf, type Phase } from '../../agent/phase';
	import type { ServerMessage, TranscriptPart } from '../../agent/protocol';
	import { EMPTY_VIEW, reduceEvents, type PiSessionView } from '../../agent/view';
	import AgentStatus from './AgentStatus.svelte';
	import { ANSWER_PROSE } from './prose';

	/**
	 * A `delegate` sub-agent's transcript, live, in a sheet above the conversation (concept N,
	 * variant B). It opens a socket of its own on the child's session: read-only, the server
	 * refuses writes there; Stop sends `abort`. The socket closes with the sheet.
	 */
	let {
		child,
		visitor,
		labels,
		statusLabel,
		phaseLabel,
		tokens,
		spent,
		onclose
	}: {
		child: ChildRecord;
		/** The visitor's object, the same as the main socket's. */
		visitor: string;
		labels: {
			subagent: string;
			stop: string;
			close: string;
			task: string;
			end: string;
			stoppedNote: string;
			failedNote: string;
		};
		statusLabel: (status: ChildRecord['status']) => string;
		phaseLabel: (phase: Phase) => string;
		tokens: (n: number) => string;
		spent: (usd: number) => string;
		onclose: () => void;
	} = $props();

	let view: PiSessionView = $state(EMPTY_VIEW);
	let client: AgentClient | undefined;

	onMount(() => {
		client = new AgentClient({
			agent: 'SiteAgent',
			name: visitor,
			host: location.host,
			query: { session: String(child.id) }
		});
		client.addEventListener('message', (event: MessageEvent) => {
			let message: ServerMessage;
			try {
				message = JSON.parse(String(event.data)) as ServerMessage;
			} catch {
				return;
			}
			if (message.type === 'events') view = reduceEvents(view, message.events);
		});
		return () => client?.close();
	});

	const stop = () => client?.send(JSON.stringify({ id: crypto.randomUUID(), type: 'abort' }));

	const messages = $derived([...view.messages, ...(view.live ? [view.live] : [])]);
	/** The task: the first message of the child's conversation, written by the main agent. */
	const task = $derived(
		messages
			.find((m) => m.role === 'user')
			?.parts.map((p) => (p.type === 'text' ? p.text : ''))
			.join('') ?? ''
	);
	type Call = Extract<TranscriptPart, { type: 'tool-call' }>;
	/** The calls and the texts of the child's answers, in order. */
	const steps = $derived(
		messages
			.filter((m) => m.role === 'assistant')
			.flatMap((m) =>
				m.parts.filter(
					(p): p is Call | Extract<TranscriptPart, { type: 'text' }> =>
						p.type === 'tool-call' || (p.type === 'text' && Boolean(p.text.trim()))
				)
			)
	);
	/** A call as one line: the values of its arguments, the repo first. */
	const argLine = (call: Call) =>
		call.arguments && typeof call.arguments === 'object'
			? Object.values(call.arguments as Record<string, unknown>)
					.map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
					.join(' ')
			: '';
	const working = $derived(child.status === 'working');
	const phase = $derived(working ? (phaseOf(view, null) ?? { kind: 'think' as const }) : null);

	// Esc closes the sheet before the workspace takes it as "go up a level".
	function onKey(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.preventDefault();
		event.stopPropagation();
		onclose();
	}
</script>

<svelte:window onkeydowncapture={onKey} />

<section
	class="glass flex h-[min(30rem,55dvh)] flex-col rounded-[var(--radius-panel)] bg-panel/70"
	aria-label="{labels.subagent} #{child.id}"
	data-agent-child-sheet
>
	<header class="flex items-center gap-2.5 border-b border-line/60 px-3.5 py-2.5 font-mono text-xs">
		<span
			class="led"
			data-status={working ? 'in-progress' : child.status === 'done' ? 'completed' : 'idea'}
		></span>
		<span class="min-w-0 truncate text-fg">{labels.subagent} #{child.id} · {child.title}</span>
		<span class="shrink-0 text-subtle">{statusLabel(child.status)}</span>
		<span class="ml-auto flex shrink-0 gap-1.5">
			{#if working}
				<button type="button" onclick={stop} class="chip cursor-pointer hover:text-fg">
					{labels.stop}
				</button>
			{/if}
			<button type="button" onclick={onclose} class="chip cursor-pointer hover:text-fg">
				{labels.close} <span class="text-subtle">esc</span>
			</button>
		</span>
	</header>
	<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-none px-4 py-4">
		{#if task}
			<p class="font-mono text-[0.8125rem] leading-relaxed text-muted">
				<span class="label mb-1 block">{labels.task}</span>{task}
			</p>
		{/if}
		{#each steps as step, i (i)}
			{#if step.type === 'tool-call'}
				<p class="flex min-w-0 items-center gap-2 font-mono text-xs text-muted">
					<span class="led" data-status="completed"></span>
					<span class="shrink-0 text-fg">{step.name}</span>
					<span class="truncate">{argLine(step)}</span>
				</p>
			{:else}
				<div class="{ANSWER_PROSE} text-[0.9375rem]">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown neutralizes HTML and links (src/agent/markdown.ts, with tests) -->
					{@html renderMarkdown(step.text)}
				</div>
			{/if}
		{/each}
		{#if phase}
			<AgentStatus label={phaseLabel(phase)} inset={false} />
		{:else if child.status === 'done'}
			<p class="font-mono text-xs text-subtle">
				{tokens(child.tokens ?? 0)} token · {spent(child.usd ?? 0)}. {labels.end}
			</p>
		{:else}
			<p class="font-mono text-xs text-subtle">
				{child.status === 'stopped' ? labels.stoppedNote : labels.failedNote}
			</p>
		{/if}
	</div>
</section>
