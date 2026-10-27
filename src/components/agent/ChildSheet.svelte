<script lang="ts">
	import { AgentClient } from 'agents/client';
	import { onMount } from 'svelte';
	import type { ChildRecord } from '../../agent/delegate';
	import { renderMarkdown } from '../../agent/markdown';
	import { phaseOf, type Phase } from '../../agent/phase';
	import type { ServerMessage, TranscriptPart } from '../../agent/protocol';
	import { callText, describeStep, type Step } from '../../agent/steps';
	import { EMPTY_VIEW, reduceEvents, type PiSessionView } from '../../agent/view';
	import AgentStatus from './AgentStatus.svelte';
	import { ANSWER_PROSE } from './prose';
	import StepDetail from './StepDetail.svelte';
	import StepToken from './StepToken.svelte';

	/**
	 * A `delegate` sub-agent's transcript, live, in a sheet above the conversation (concept N,
	 * variant B). It opens a socket of its own on the child's session: read-only, the server
	 * refuses writes there; Stop sends `abort`. The socket closes with the sheet. Its calls are
	 * the same tokens as a turn of the main chat (concept Q, D2), above its texts.
	 */
	let {
		child,
		name,
		visitor,
		labels,
		statusLabel,
		phaseLabel,
		tokens,
		spent,
		sentence,
		countText,
		stepLabels,
		onclose
	}: {
		child: ChildRecord;
		/** How the visitor calls it: "sotto-agente 2", its order in the conversation. */
		name: string;
		/** The visitor's object, the same as the main socket's. */
		visitor: string;
		labels: {
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
		/** A tool's sentence and what came back, as the main chat writes them. */
		sentence: (name: string, step: Step) => string;
		countText: (step: Step) => string;
		stepLabels: { call: string; result: string };
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
	type Result = Extract<TranscriptPart, { type: 'tool-result' }>;
	const parts = $derived(messages.filter((m) => m.role === 'assistant').flatMap((m) => m.parts));
	/** The texts of the child's answers, in order. */
	const texts = $derived(
		parts.filter(
			(p): p is Extract<TranscriptPart, { type: 'text' }> =>
				p.type === 'text' && Boolean(p.text.trim())
		)
	);
	const results = $derived(
		new Map(
			view.messages
				.flatMap((m) => m.parts)
				.filter((p): p is Result => p.type === 'tool-result')
				.map((p) => [p.id, p])
		)
	);
	const resultText = (part: Result) =>
		part.content.map((c) => (c.type === 'text' ? c.text : '[image]')).join('\n');
	/** The calls as tokens, each with its result once it came back. */
	const calls = $derived(
		parts
			.filter((p): p is Call => p.type === 'tool-call')
			.map((call) => {
				const result = results.get(call.id);
				const text = result && resultText(result);
				return {
					call,
					result,
					text,
					step: describeStep(
						call.name,
						call.arguments,
						result && { text: text ?? '', error: Boolean(result.error) }
					)
				};
			})
	);
	let open: string | null = $state(null);
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
	class="glass flex h-[min(30rem,55dvh)] flex-col rounded-[var(--radius-panel)] bg-surface/40"
	aria-label={name}
	data-agent-child-sheet
>
	<header class="flex items-center gap-2.5 border-b border-line/60 px-3.5 py-2.5 font-mono text-xs">
		<span
			class="led"
			data-status={working ? 'in-progress' : child.status === 'done' ? 'completed' : 'idea'}
		></span>
		<span class="min-w-0 truncate text-fg">{name} · {child.title}</span>
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
		{#if calls.length}
			<div class="flex flex-col gap-2">
				<div class="flex flex-wrap gap-1.5">
					{#each calls as { call, result, step } (call.id)}
						<StepToken
							name={call.name}
							{step}
							text={sentence(call.name, step)}
							count={countText(step)}
							state={!result ? 'running' : result.error ? 'error' : 'done'}
							expanded={open === call.id}
							onclick={() => (open = open === call.id ? null : call.id)}
						/>
					{/each}
				</div>
				{#each calls as { call, text } (call.id)}
					{#if open === call.id}
						<StepDetail
							name={call.name}
							call={callText(call.arguments)}
							result={text}
							labels={stepLabels}
						/>
					{/if}
				{/each}
			</div>
		{/if}
		{#each texts as part, i (i)}
			<div class="{ANSWER_PROSE} text-[0.9375rem]">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown neutralizes HTML and links (src/agent/markdown.ts, with tests) -->
				{@html renderMarkdown(part.text)}
			</div>
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
