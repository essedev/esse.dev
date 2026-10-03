<script lang="ts">
	import type { ListItem } from '../lib/listing';

	/**
	 * Riga del registro, uguale per progetti e scritti: stato (o data), titolo e
	 * sommario, tag, anno. Densa, senza bordi: la separazione la fa lo spazio.
	 */
	let { item }: { item: ListItem } = $props();
	const MAX_TAGS = 3;
</script>

<a
	href={item.href}
	class="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 rounded-[var(--radius-panel)] px-3 py-4 transition-colors hover:bg-panel sm:px-4"
>
	{#if item.status && item.statusLabel}
		<span class="led -translate-y-px" data-status={item.status} title={item.statusLabel}></span>
	{:else}
		<span class="w-[7px]" aria-hidden="true"></span>
	{/if}
	<div class="flex min-w-0 flex-col gap-1">
		<span class="text-[1.0625rem] font-medium tracking-tight text-fg">{item.title}</span>
		<span class="line-clamp-2 text-[0.9375rem] leading-relaxed text-muted">{item.excerpt}</span>
		{#if item.tags.length}
			<span class="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.7rem] text-subtle">
				{#each item.tags.slice(0, MAX_TAGS) as tag (tag)}
					<span>{tag}</span>
				{/each}
				{#if item.tags.length > MAX_TAGS}<span>+{item.tags.length - MAX_TAGS}</span>{/if}
			</span>
		{/if}
	</div>
	<span class="font-mono text-xs text-subtle tabular-nums">
		{item.status ? item.date.slice(0, 4) : item.dateLabel}
	</span>
</a>
