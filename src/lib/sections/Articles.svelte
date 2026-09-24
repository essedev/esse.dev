<script lang="ts">
	import { base } from '$app/paths';
	import EntryIndex from '$lib/components/EntryIndex.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { ArticleItem, ArticlesSectionProps, FilterState } from '$lib/types/content';
	import { getTranslations, translateTags, type TranslationKey } from '$lib/utils/translations';
	import { ArrowRight, FileText } from '@lucide/svelte';
	import { reveal } from '$lib/actions/reveal';
	import SectionHeader from '$lib/components/SectionHeader.svelte';

	// Receive data as props
	let {
		articles,
		selectedLanguage,
		navigation,
		blogPage,
		showFilters = false,
		showViewAllButton = false,
		global,
		pagination,
		activeFilters,
		availableTags,
		index,
		collection
	}: ArticlesSectionProps & {
		pagination?: { currentPage: number; totalPages: number };
		activeFilters?: FilterState;
		availableTags?: string[];
	} = $props();

	// The `articles` prop now contains only the items for the current page.
	// We can still apply a language filter for robustness, though data should be pre-filtered.
	let currentArticles = $derived(
		articles
			.filter((article) => article.translations[selectedLanguage])
			.slice(0, showViewAllButton ? 3 : articles.length)
	);

	const translationKeys: TranslationKey[] = [
		'viewAll',
		'searchArticles',
		'noResultsFound',
		'tryAdjusting',
		'noArticlesHome',
		'checkBackLater'
	];

	let t = $derived(getTranslations(global, translationKeys));

	let blogPageLink = $derived(
		`${base}/${selectedLanguage}/${navigation[selectedLanguage].articles}`
	);

	// Il blog è un indice a righe, non una griglia di card: i pezzi sono testo, e una card
	// con immagine segnaposto non aggiunge niente a titolo, data e una frase.
	const formatDate = (iso: string) =>
		new Date(iso).toLocaleDateString(selectedLanguage === 'it' ? 'it-IT' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

	const toEntry = (a: ArticleItem) => {
		const tr = a.translations[selectedLanguage];
		return {
			key: a.meta.id,
			href: `/${selectedLanguage}/${navigation[selectedLanguage].articles}/${tr.slug}`,
			meta: formatDate(a.meta.published_date),
			title: tr.title,
			excerpt: tr.excerpt,
			tags: translateTags(global, tr.tags)
		};
	};

	// Readout dell'header: sotto i due pezzi resta vuoto, un conteggio a 1 punterebbe
	// un riflettore sul blog vuoto invece di dire qualcosa.
	let headerReadout = $derived.by(() => {
		const source = collection ?? articles;
		const count = source.length;
		if (count < 2) return undefined;
		const years = source
			.map((a) => a.meta.published_date?.slice(0, 4))
			.filter((y): y is string => Boolean(y))
			.sort();
		const lo = years[0];
		const hi = years[years.length - 1];
		if (!lo || !hi) return `${count} items`;
		return `${count} items \u00b7 ${lo === hi ? lo : `${lo}-${hi}`}`;
	});
</script>

<div class="flex flex-col gap-y-10 sm:gap-y-16 2xl:gap-y-[4.5rem]">
	<SectionHeader {index} title={blogPage.title} readout={headerReadout} />

	<!-- Search and Filter Component -->
	{#if showFilters && activeFilters && availableTags}
		<div use:reveal={{ delay: 80 }} class="reveal relative z-10">
			<SearchFilter
				filters={activeFilters}
				{availableTags}
				showDateFilter={true}
				placeholder={t.searchArticles}
				{global}
			/>
		</div>
	{/if}

	{#if currentArticles && currentArticles.length > 0}
		<EntryIndex entries={currentArticles.map(toEntry)} wideMeta />

		<!-- Pagination -->
		{#if pagination && pagination.totalPages > 1}
			<div class="mt-8">
				<Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
			</div>
		{/if}

		<!-- View All Button - only show if in home page and there are more articles -->
		{#if showViewAllButton && articles.length > 3}
			<div class="flex justify-center">
				<a href={blogPageLink} class="group key key--primary px-8 py-4">
					<span>{t.viewAll}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
				</a>
			</div>
		{/if}
	{:else}
		<!-- No results found or no articles at all -->
		<div class="flex flex-col items-center gap-4 py-16 text-center">
			<FileText class="h-16 w-16 text-white/20" />
			<div class="text-white/60">
				{#if activeFilters && (activeFilters.query || activeFilters.selectedTags.length > 0 || activeFilters.dateRange.from || activeFilters.dateRange.to)}
					<p class="text-lg">{t.noResultsFound}</p>
					<p class="mt-2 text-sm">{t.tryAdjusting}</p>
				{:else}
					<p class="text-lg">{t.noArticlesHome}</p>
					<p class="mt-2 text-sm">{t.checkBackLater}</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
