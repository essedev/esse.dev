<script lang="ts">
	import { Bot, FileCode, Search, Wrench } from '@lucide/svelte';
	import type { Step } from '../../agent/steps';
	import { TOKEN } from './prose';

	/**
	 * One tool call on a turn's row (concept Q, D2), in the main chat and in a sub-agent's
	 * sheet: the icon of its family, its sentence, then a lit LED while it runs, an off one on
	 * an error, or what came back. With `onclick` it opens its call and result; without, it is
	 * an example (the empty page) and stays out of the reading.
	 */
	let {
		name,
		step,
		text,
		count = '',
		state,
		expanded = false,
		onclick
	}: {
		name: string;
		step: Step;
		/** The sentence, already filled. */
		text: string;
		/** What came back, already with its unit. */
		count?: string;
		state: 'running' | 'error' | 'done';
		expanded?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<svelte:element
	this={onclick ? 'button' : 'span'}
	type={onclick ? 'button' : undefined}
	aria-expanded={onclick ? expanded : undefined}
	aria-hidden={onclick ? undefined : 'true'}
	data-agent-step={onclick ? name : undefined}
	role={onclick ? undefined : 'presentation'}
	{onclick}
	class="{TOKEN} {onclick
		? 'cursor-pointer transition-colors hover:bg-hover hover:text-fg aria-expanded:bg-hover'
		: ''}"
>
	{#if step.family === 'site'}
		<Search class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
	{:else if step.family === 'code'}
		<FileCode class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
	{:else if step.family === 'agents'}
		<Bot class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
	{:else}
		<Wrench class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
	{/if}
	<span class="truncate">{text}</span>
	{#if state === 'running'}
		<span class="led" data-status="in-progress"></span>
	{:else if state === 'error'}
		<span class="led" data-status="archived"></span>
	{:else if count}
		<span class="font-mono text-[0.7rem] whitespace-nowrap text-subtle">{count}</span>
	{/if}
</svelte:element>
