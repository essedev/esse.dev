<script lang="ts">
	import type { ListItem } from '../lib/listing';

	let { item }: { item: ListItem } = $props();
</script>

<a href={item.href} class="group grid gap-1 py-5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6">
	<time datetime={item.date} class="font-mono text-xs text-subtle tabular-nums sm:pt-1">
		{item.dateLabel}
	</time>
	<div class="flex flex-col gap-1.5">
		<h3 class="font-medium tracking-tight group-hover:underline group-hover:underline-offset-4">
			{item.title}
		</h3>
		<p class="line-clamp-2 text-sm leading-relaxed text-muted">{item.excerpt}</p>
	</div>
</a>
