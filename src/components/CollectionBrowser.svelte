<script lang="ts">
	import { X } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import {
		applyFilters,
		countBy,
		DEFAULT_FILTERS,
		filtersFromSearch,
		searchFromFilters,
		STATUS_ORDER,
		tagsByFrequency,
		type Filters,
		type ListItem,
		type SortKey,
		type Status
	} from '../lib/listing';
	import EntryRow from './EntryRow.svelte';
	import Select from './ui/Select.svelte';

	interface Labels {
		status: string;
		tags: string;
		searchTags: string;
		noMatches: string;
		clearSelection: string;
		removeFilter: string;
		sort: string;
		sortNewest: string;
		sortOldest: string;
		sortTitle: string;
		noResults: string;
		clearFilters: string;
	}

	let {
		items,
		labels,
		statusLabels = {},
		locale
	}: {
		items: ListItem[];
		labels: Labels;
		statusLabels?: Partial<Record<Status, string>>;
		locale: string;
	} = $props();

	// The static render starts from the default filters (full list); those from the URL are
	// applied on mount, so a link with ?tag=... opens the list already filtered.
	let filters: Filters = $state({ ...DEFAULT_FILTERS });
	let mounted = $state(false);

	onMount(() => {
		filters = filtersFromSearch(window.location.search);
		mounted = true;
		// The text search is the site's only one, at the top of the list: it arrives here as an
		// event, so the registry and the list filter together.
		const onSearch = (event: Event) => {
			filters.query = (event as CustomEvent<string>).detail;
		};
		addEventListener('workspace:search', onSearch);
		return () => removeEventListener('workspace:search', onSearch);
	});

	$effect(() => {
		if (!mounted) return;
		const search = searchFromFilters(filters);
		if (search !== window.location.search) {
			history.replaceState(history.state, '', window.location.pathname + search);
		}
	});

	const visible = $derived(applyFilters(items, filters, locale));

	const tagCounts = $derived(countBy(items, 'tags'));
	const tagOptions = $derived(
		tagsByFrequency(items, locale).map((tag) => ({
			value: tag,
			label: tag,
			count: tagCounts.get(tag)
		}))
	);
	const statusCounts = $derived(countBy(items, 'status'));
	const statusOptions = $derived(
		STATUS_ORDER.filter((s) => statusCounts.has(s)).map((s) => ({
			value: s,
			label: statusLabels[s] ?? s,
			count: statusCounts.get(s)
		}))
	);
	const sortOptions = [
		{ value: 'newest', label: labels.sortNewest },
		{ value: 'oldest', label: labels.sortOldest },
		{ value: 'title', label: labels.sortTitle }
	];

	const chips = $derived([
		...filters.statuses.map((s) => ({
			label: statusLabels[s] ?? s,
			remove: () => (filters.statuses = filters.statuses.filter((x) => x !== s))
		})),
		...filters.tags.map((t) => ({
			label: t,
			remove: () => (filters.tags = filters.tags.filter((x) => x !== t))
		}))
	]);
	const active = $derived(
		!!filters.query.trim() || chips.length > 0 || filters.sort !== DEFAULT_FILTERS.sort
	);
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3">
		<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
			<div class="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
				{#if statusOptions.length > 1}
					<Select
						label={labels.status}
						options={statusOptions}
						bind:selected={
							() => filters.statuses, (v: string[]) => (filters.statuses = v as Status[])
						}
						multiple
						clearLabel={labels.clearSelection}
					/>
				{/if}
				{#if tagOptions.length}
					<Select
						label={labels.tags}
						options={tagOptions}
						bind:selected={filters.tags}
						multiple
						searchable
						searchPlaceholder={labels.searchTags}
						noMatches={labels.noMatches}
						clearLabel={labels.clearSelection}
					/>
				{/if}
				<Select
					label={labels.sort}
					options={sortOptions}
					bind:selected={
						() => [filters.sort], (v: string[]) => (filters.sort = (v[0] ?? 'newest') as SortKey)
					}
					align="end"
				/>
			</div>
		</div>

		{#if active}
			<div class="flex flex-wrap items-center gap-2">
				{#each chips as chip (chip.label)}
					<button
						type="button"
						onclick={chip.remove}
						aria-label={`${labels.removeFilter}: ${chip.label}`}
						class="chip pr-1.5 transition-colors hover:bg-hover hover:text-fg"
					>
						{chip.label}
						<X data-motion="x" class="size-3.5" />
					</button>
				{/each}
				<button
					type="button"
					onclick={() => {
						filters = { ...DEFAULT_FILTERS };
						dispatchEvent(new CustomEvent('workspace:set-search', { detail: '' }));
					}}
					class="h-7 px-1 font-mono text-xs text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
				>
					{labels.clearFilters}
				</button>
			</div>
		{/if}
	</div>

	{#if visible.length === 0}
		<p class="py-12 text-center text-sm text-muted">{labels.noResults}</p>
	{:else}
		<ul class="-mx-3 flex flex-col sm:-mx-4">
			{#each visible as item (item.id)}
				<li><EntryRow {item} /></li>
			{/each}
		</ul>
	{/if}
</div>
