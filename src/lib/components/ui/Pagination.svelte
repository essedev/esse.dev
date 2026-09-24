<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	interface Props {
		currentPage: number;
		totalPages: number;
	}

	let { currentPage, totalPages }: Props = $props();

	const createPageLink = (pageNumber: number) => {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		searchParams.set('page', pageNumber.toString());
		return `${base}${page.url.pathname}?${searchParams.toString()}`;
	};
</script>

{#if totalPages > 1}
	<nav class="flex items-center justify-center gap-4 font-mono" aria-label="Pagination">
		<!-- Previous Page -->
		<a
			href={currentPage > 1 ? createPageLink(currentPage - 1) : '#'}
			class="key h-9 w-9 justify-center p-0"
			class:disabled={currentPage <= 1}
			aria-label="Previous Page"
		>
			<ChevronLeft class="h-4 w-4" />
		</a>

		<span class="text-sm tracking-wider text-gray-500">
			<span class="text-accent">{String(currentPage).padStart(2, '0')}</span>
			<span class="px-1 text-gray-600">/</span>
			{String(totalPages).padStart(2, '0')}
		</span>

		<!-- Next Page -->
		<a
			href={currentPage < totalPages ? createPageLink(currentPage + 1) : '#'}
			class="key h-9 w-9 justify-center p-0"
			class:disabled={currentPage >= totalPages}
			aria-label="Next Page"
		>
			<ChevronRight class="h-4 w-4" />
		</a>
	</nav>
{/if}

<style>
	.disabled {
		pointer-events: none;
		opacity: 0.5;
	}
</style>
