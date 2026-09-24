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
</script>

<a href={`${base}${link}`} class="panel panel--lift group flex h-full flex-col">
	<div class="px-5 pt-5">
		<OptimizedImage
			src={featuredImage}
			alt={title}
			className="panel__media aspect-video"
			showPlaceholder={Boolean(featuredImagePlaceholder)}
			sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
		/>
	</div>

	<div class="flex flex-1 flex-col p-5">
		<div class="mb-3 flex items-center justify-between">
			{#if status}
				<StatusBadge {status} {global} />
			{/if}
			{#if year}
				<span class="font-mono text-xs text-gray-500">{year}</span>
			{/if}
		</div>

		<h5 class="mb-2 text-xl font-medium text-gray-100">{title}</h5>
		<p class="mb-4 text-sm text-gray-400">{excerpt}</p>

		{#if tags && tags.length > 0}
			<div class="mt-auto flex flex-wrap gap-1.5">
				{#each tags.slice(0, 4) as tag (tag)}
					<span class="chip">{tag}</span>
				{/each}
				{#if tags.length > 4}
					<span class="chip border-transparent text-gray-500">+{tags.length - 4}</span>
				{/if}
			</div>
		{/if}
	</div>
</a>
