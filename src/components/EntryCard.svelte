<script lang="ts">
	import type { ListItem } from '../lib/listing';
	import StatusBadge from './StatusBadge.svelte';

	/**
	 * Card unica per progetti e articoli: stessa forma, cambia solo la riga in alto
	 * (stato e anno per un progetto, data per un articolo).
	 */
	let { item }: { item: ListItem } = $props();
	const MAX_TAGS = 3;
</script>

<a
	href={item.href}
	class="flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-5 transition-colors hover:border-subtle"
>
	<div class="flex min-h-4 items-center justify-between gap-3">
		{#if item.status && item.statusLabel}
			<StatusBadge status={item.status} label={item.statusLabel} />
			<span class="font-mono text-xs text-subtle tabular-nums">{item.date.slice(0, 4)}</span>
		{:else}
			<time datetime={item.date} class="font-mono text-xs text-subtle tabular-nums">
				{item.dateLabel}
			</time>
		{/if}
	</div>
	<h3 class="text-lg font-medium tracking-tight">{item.title}</h3>
	<p class="line-clamp-3 text-sm leading-relaxed text-muted">{item.excerpt}</p>
	{#if item.tags.length}
		<ul class="mt-auto flex flex-wrap gap-1.5 pt-1">
			{#each item.tags.slice(0, MAX_TAGS) as tag (tag)}
				<li class="rounded border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted">
					{tag}
				</li>
			{/each}
			{#if item.tags.length > MAX_TAGS}
				<li class="px-1 py-0.5 font-mono text-[11px] text-subtle">
					+{item.tags.length - MAX_TAGS}
				</li>
			{/if}
		</ul>
	{/if}
</a>
