<script lang="ts">
	import { base } from '$app/paths';
	import type { ProjectCardProps } from '$lib/types';
	import OptimizedImage from './OptimizedImage.svelte';
	import StatusBadge from './StatusBadge.svelte';

	let {
		title,
		excerpt,
		featuredImage,
		featuredImagePlaceholder,
		link,
		tags,
		status,
		year,
		global
	}: ProjectCardProps = $props();

	// Tre tag al massimo, su una riga sola: se non ci stanno si stringono con l'ellissi,
	// il conteggio dice quanti ne restano. La lista completa sta nel dettaglio.
	const MAX_TAGS = 3;
	let shown = $derived((tags ?? []).slice(0, MAX_TAGS));
	let hidden = $derived(Math.max(0, (tags ?? []).length - MAX_TAGS));
</script>

<!-- Sotto sm la miniatura è una fascia 21:9: la card resta una vetrina ma non spende
     metà schermo in un'immagine sola. Da sm torna 16:9. -->
<a href={`${base}${link}`} class="panel panel--lift group flex h-full flex-col p-4 sm:p-5">
	<OptimizedImage
		src={featuredImage}
		alt={title}
		className="panel__media aspect-[21/9] sm:aspect-video"
		showPlaceholder={Boolean(featuredImagePlaceholder)}
		sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
	/>

	<div class="mt-4 flex flex-1 flex-col">
		<div class="mb-2.5 flex items-center justify-between gap-x-3">
			{#if status}
				<StatusBadge {status} {global} />
			{/if}
			{#if year}
				<span class="font-mono text-xs text-gray-500 tabular-nums">{year}</span>
			{/if}
		</div>

		<h5 class="mb-1.5 text-lg font-medium text-gray-100">{title}</h5>
		<p class="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-400">{excerpt}</p>

		{#if shown.length > 0}
			<div class="mt-auto flex min-w-0 gap-1.5">
				{#each shown as tag (tag)}
					<span class="chip">{tag}</span>
				{/each}
				{#if hidden > 0}
					<span class="chip chip--count shrink-0">+{hidden}</span>
				{/if}
			</div>
		{/if}
	</div>
</a>
