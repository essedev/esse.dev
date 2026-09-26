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
	<nav class="flex items-center justify-center gap-4" aria-label="Pagination">
		<!-- Previous Page -->
		<a
			href={currentPage > 1 ? createPageLink(currentPage - 1) : '#'}
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-white/80 transition-colors hover:bg-white/10"
			class:disabled={currentPage <= 1}
			aria-label="Previous Page"
		>
			<ChevronLeft class="h-4 w-4" />
			<span>Prev</span>
		</a>

		<span class="text-sm text-white/60">
			Page {currentPage} of {totalPages}
		</span>

		<!-- Next Page -->
		<a
			href={currentPage < totalPages ? createPageLink(currentPage + 1) : '#'}
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-white/80 transition-colors hover:bg-white/10"
			class:disabled={currentPage >= totalPages}
			aria-label="Next Page"
		>
			<span>Next</span>
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
