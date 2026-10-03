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
	import SearchField from './ui/SearchField.svelte';
	import Select from './ui/Select.svelte';

	interface Labels {
		search: string;
		clearSearch: string;
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

	// Il render statico parte dai filtri di default (lista completa); quelli dell'URL si
	// applicano al mount, così un link con ?tag=... apre la lista già filtrata.
	let filters: Filters = $state({ ...DEFAULT_FILTERS });
	let mounted = $state(false);

	onMount(() => {
		filters = filtersFromSearch(window.location.search);
		mounted = true;
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
			<SearchField
				bind:value={filters.query}
				label={labels.search}
				clearLabel={labels.clearSearch}
			/>
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
						class="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface pr-2 pl-3 text-xs text-muted transition-colors hover:border-subtle hover:text-fg"
					>
						{chip.label}
						<X class="size-3.5" />
					</button>
				{/each}
				<button
					type="button"
					onclick={() => (filters = { ...DEFAULT_FILTERS })}
					class="h-7 px-1 text-xs text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
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
