<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, X } from '@lucide/svelte';
	import {
		applyFilters,
		DEFAULT_FILTERS,
		filtersFromSearch,
		searchFromFilters,
		tagsByFrequency,
		type Filters,
		type ListItem,
		type SortKey,
		type Status
	} from '../lib/listing';
	import ArticleRow from './ArticleRow.svelte';
	import ProjectCard from './ProjectCard.svelte';

	interface Labels {
		search: string;
		all: string;
		status: string;
		tags: string;
		sort: string;
		sortNewest: string;
		sortOldest: string;
		sortTitle: string;
		noResults: string;
		clearFilters: string;
	}

	let {
		kind,
		items,
		labels,
		statusLabels = {},
		locale
	}: {
		kind: 'projects' | 'articles';
		items: ListItem[];
		labels: Labels;
		statusLabels?: Partial<Record<Status, string>>;
		locale: string;
	} = $props();

	// Il render statico parte dai filtri di default (lista completa): i filtri dell'URL si
	// applicano al mount, così chi arriva con ?tag=... vede la lista filtrata.
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
	const tags = $derived(tagsByFrequency(items, locale));
	const statuses = $derived(
		(['in-progress', 'completed', 'idea', 'archived'] as Status[]).filter((s) =>
			items.some((i) => i.status === s)
		)
	);
	const active = $derived(
		!!filters.query.trim() || !!filters.tag || !!filters.status || filters.sort !== 'newest'
	);

	const sorts: { key: SortKey; label: string }[] = [
		{ key: 'newest', label: labels.sortNewest },
		{ key: 'oldest', label: labels.sortOldest },
		{ key: 'title', label: labels.sortTitle }
	];

	const control =
		'border-line bg-surface text-fg h-10 rounded-md border px-3 text-sm focus-visible:outline-2';
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
		<label class="relative flex-1 sm:min-w-64">
			<span class="sr-only">{labels.search}</span>
			<Search
				class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
			/>
			<input
				type="search"
				bind:value={filters.query}
				placeholder={labels.search}
				class="{control} w-full pl-9"
			/>
		</label>

		<div class="flex flex-wrap gap-3">
			{#if kind === 'projects' && statuses.length > 1}
				<label class="flex items-center gap-2">
					<span class="sr-only">{labels.status}</span>
					<select bind:value={filters.status} class={control}>
						<option value={null}>{labels.status}: {labels.all}</option>
						{#each statuses as s (s)}
							<option value={s}>{statusLabels[s] ?? s}</option>
						{/each}
					</select>
				</label>
			{/if}

			{#if tags.length}
				<label class="flex items-center gap-2">
					<span class="sr-only">{labels.tags}</span>
					<select bind:value={filters.tag} class="{control} max-w-48">
						<option value={null}>{labels.tags}: {labels.all}</option>
						{#each tags as tag (tag)}
							<option value={tag}>{tag}</option>
						{/each}
					</select>
				</label>
			{/if}

			<label class="flex items-center gap-2">
				<span class="sr-only">{labels.sort}</span>
				<select bind:value={filters.sort} class={control}>
					{#each sorts as s (s.key)}
						<option value={s.key}>{s.label}</option>
					{/each}
				</select>
			</label>

			{#if active}
				<button
					type="button"
					onclick={() => (filters = { ...DEFAULT_FILTERS })}
					class="inline-flex h-10 items-center gap-1.5 px-1 text-sm text-muted transition-colors hover:text-fg"
				>
					<X class="size-4" />
					{labels.clearFilters}
				</button>
			{/if}
		</div>
	</div>

	{#if visible.length === 0}
		<p class="py-12 text-center text-sm text-muted">{labels.noResults}</p>
	{:else if kind === 'projects'}
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each visible as item (item.id)}
				<li><ProjectCard {item} /></li>
			{/each}
		</ul>
	{:else}
		<ul class="divide-y divide-line border-y border-line">
			{#each visible as item (item.id)}
				<li><ArticleRow {item} /></li>
			{/each}
		</ul>
	{/if}
</div>
