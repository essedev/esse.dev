<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import type { GlobalContent } from '$lib/types';
	import type { FilterState } from '$lib/types/content';
	import { getTranslations, translateTag, type TranslationKey } from '$lib/utils/translations';
	import { Search, X } from '@lucide/svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import DateRangeDropdown from './ui/DateRangeDropdown.svelte';
	import SortDropdown from './ui/SortDropdown.svelte';
	import StatusDropdown from './ui/StatusDropdown.svelte';
	import TagDropdown from './ui/TagDropdown.svelte';

	interface Props {
		filters: FilterState;
		availableTags: string[];
		availableStatuses?: string[];
		showDateFilter?: boolean;
		showStatusFilter?: boolean;
		placeholder: string;
		global?: GlobalContent;
	}

	let {
		filters,
		availableTags,
		availableStatuses = [],
		showDateFilter = false,
		showStatusFilter = false,
		placeholder,
		global
	}: Props = $props();

	const translationKeys: TranslationKey[] = [
		'clearFilters',
		'removeFilter',
		'statusCompleted',
		'statusInProgress',
		'statusIdea',
		'statusArchived'
	];
	let t = $derived(getTranslations(global, translationKeys));

	// Helper function to find original case tag from available tags
	const findOriginalCaseTag = (lowercaseTag: string): string => {
		return (
			availableTags.find((tag) => tag.toLowerCase() === lowercaseTag.toLowerCase()) || lowercaseTag
		);
	};

	const updateUrlParams = (newFilters: Partial<FilterState>) => {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);

		// Reset page to 1 when filters change
		searchParams.set('page', '1');

		for (const [key, value] of Object.entries(newFilters)) {
			if (key === 'selectedTags' && Array.isArray(value)) {
				if (value.length > 0) {
					searchParams.set('tags', value.map((tag) => tag.toLowerCase()).join(','));
				} else {
					searchParams.delete('tags');
				}
			} else if (key === 'selectedStatuses' && Array.isArray(value)) {
				if (value.length > 0) {
					searchParams.set('statuses', value.join(','));
				} else {
					searchParams.delete('statuses');
				}
			} else if (key === 'query' && typeof value === 'string') {
				if (value) {
					searchParams.set('query', value);
				} else {
					searchParams.delete('query');
				}
			} else if (key === 'sortBy' || key === 'sortOrder') {
				searchParams.set(key, value as string);
			} else if (key === 'dateRange' && typeof value === 'object') {
				const dateRange = value as FilterState['dateRange'];
				if (dateRange.from) {
					searchParams.set('from', dateRange.from);
				} else {
					searchParams.delete('from');
				}
				if (dateRange.to) {
					searchParams.set('to', dateRange.to);
				} else {
					searchParams.delete('to');
				}
			}
		}

		goto(`${base}${page.url.pathname}?${searchParams.toString()}`, {
			keepFocus: true,
			noScroll: true
		});
	};

	const handleQueryChange = (event: Event) => {
		const target = event.target as HTMLInputElement;
		updateUrlParams({ query: target.value });
	};

	const handleTagToggle = (tag: string) => {
		const isCurrentlySelected = filters.selectedTags.some(
			(selectedTag) => selectedTag.toLowerCase() === tag.toLowerCase()
		);

		const newTags = isCurrentlySelected
			? filters.selectedTags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
			: [...filters.selectedTags, tag.toLowerCase()];
		updateUrlParams({ selectedTags: newTags });
	};

	const handleStatusToggle = (status: string) => {
		const newStatuses = filters.selectedStatuses.includes(status)
			? filters.selectedStatuses.filter((s) => s !== status)
			: [...filters.selectedStatuses, status];
		updateUrlParams({ selectedStatuses: newStatuses });
	};

	const handleDateChange = (type: 'from' | 'to', value: string) => {
		const newDateRange = { ...filters.dateRange };
		newDateRange[type] = value;
		updateUrlParams({ dateRange: newDateRange });
	};

	const handleSortChange = (sortBy: FilterState['sortBy'], sortOrder: FilterState['sortOrder']) => {
		updateUrlParams({ sortBy, sortOrder });
	};

	const clearTags = () => {
		updateUrlParams({ selectedTags: [] });
	};

	const clearStatuses = () => {
		updateUrlParams({ selectedStatuses: [] });
	};

	const clearDates = () => {
		updateUrlParams({ dateRange: { from: undefined, to: undefined } });
	};

	const clearAllFilters = () => {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		searchParams.delete('query');
		searchParams.delete('tags');
		searchParams.delete('statuses');
		searchParams.delete('from');
		searchParams.delete('to');
		searchParams.delete('page');
		// Keep sorting parameters or clear them as well
		// searchParams.delete('sortBy');
		// searchParams.delete('sortOrder');
		goto(`${base}${page.url.pathname}?${searchParams.toString()}`, {
			keepFocus: true,
			noScroll: true
		});
	};

	const hasActiveFilters = $derived(
		filters.query.trim() !== '' ||
			filters.selectedTags.length > 0 ||
			filters.selectedStatuses.length > 0 ||
			filters.dateRange.from !== undefined ||
			filters.dateRange.to !== undefined
	);
</script>

<div class="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/20 p-6">
	<!-- Search Input -->
	<div class="relative">
		<input
			type="text"
			value={filters.query}
			oninput={handleQueryChange}
			{placeholder}
			class="w-full rounded-2xl border border-white/10 bg-white/2 px-4 py-3 pl-12 text-white placeholder-white/50 backdrop-blur-sm focus:border-white/20 focus:outline-none"
		/>
		<Search class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-white/50" />
	</div>

	<!-- Filters Row -->
	<div class="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 md:flex">
		<!-- Tag Filter -->
		{#if availableTags.length > 0}
			<TagDropdown
				{availableTags}
				selectedTags={filters.selectedTags}
				onTagToggle={handleTagToggle}
				onClearTags={clearTags}
				{global}
			/>
		{/if}

		<!-- Status Filter -->
		{#if showStatusFilter && availableStatuses.length > 0}
			<StatusDropdown
				{availableStatuses}
				selectedStatuses={filters.selectedStatuses}
				onStatusToggle={handleStatusToggle}
				onClearStatuses={clearStatuses}
				{global}
			/>
		{/if}

		<!-- Date Range Filter -->
		{#if showDateFilter}
			<DateRangeDropdown
				dateRange={filters.dateRange}
				onDateChange={handleDateChange}
				onClearDates={clearDates}
				{global}
			/>
		{/if}

		<!-- Sort Options -->
		<SortDropdown
			sortBy={filters.sortBy}
			sortOrder={filters.sortOrder}
			onSortChange={handleSortChange}
			{global}
		/>

		<!-- Clear Filters -->
		{#if hasActiveFilters}
			<button
				onclick={clearAllFilters}
				class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
			>
				{t.clearFilters}
			</button>
		{/if}
	</div>

	<!-- Active Filters -->
	{#if filters.selectedTags.length > 0 || filters.selectedStatuses.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each filters.selectedTags as tag (tag)}
				{@const originalCaseTag = findOriginalCaseTag(tag)}
				<span
					class="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-sm text-white/80"
				>
					{translateTag(global, originalCaseTag)}
					<button
						onclick={() => handleTagToggle(originalCaseTag)}
						class="rounded-full p-1 hover:bg-white/20"
						aria-label="{t.removeFilter} {originalCaseTag}"
					>
						<X class="h-3 w-3" />
					</button>
				</span>
			{/each}
			{#each filters.selectedStatuses as status (status)}
				<span
					class="inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-500/20 px-3 py-1 text-sm text-blue-200"
				>
					{status === 'completed'
						? t.statusCompleted
						: status === 'in-progress'
							? t.statusInProgress
							: status === 'idea'
								? t.statusIdea
								: status === 'archived'
									? t.statusArchived
									: status}
					<button
						onclick={() => handleStatusToggle(status)}
						class="rounded-full p-1 hover:bg-blue-400/20"
						aria-label="{t.removeFilter} {status}"
					>
						<X class="h-3 w-3" />
					</button>
				</span>
			{/each}
		</div>
	{/if}
</div>
