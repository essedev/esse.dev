<script lang="ts">
	import { base } from '$app/paths';
	import ArticleCard from '$lib/components/ArticleCard.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { ArticlesSectionProps, FilterState } from '$lib/types/content';
	import { getTranslations, translateTags, type TranslationKey } from '$lib/utils/translations';
	import { ArrowRight, FileText } from '@lucide/svelte';
	import { inview, type Options } from 'svelte-inview';

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
		availableTags
	}: ArticlesSectionProps & {
		pagination?: { currentPage: number; totalPages: number };
		activeFilters?: FilterState;
		availableTags?: string[];
	} = $props();

	let isInView = $state(false);
	const options: Options = {
		rootMargin: '-100px',
		unobserveOnEnter: true
	};

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
</script>

<div
	use:inview={options}
	oninview_change={(event) => {
		const { inView } = event.detail;
		isInView = inView;
	}}
	class="flex flex-col gap-y-10 sm:gap-y-16 2xl:gap-y-[4.5rem] {isInView ? 'animate' : 'opacity-0'}"
>
	<h2 class="text-[2.5rem] leading-none font-normal sm:text-5xl md:text-6xl 2xl:text-7xl">
		{blogPage.title}
	</h2>

	<!-- Search and Filter Component -->
	{#if showFilters && activeFilters && availableTags}
		<div class="relative z-10">
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
		<div class="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-2 xl:grid-cols-3">
			{#each currentArticles as article (article.meta.id)}
				<ArticleCard
					title={article.translations[selectedLanguage].title}
					excerpt={article.translations[selectedLanguage].excerpt}
					featuredImage={article.meta.featured_image}
					featuredImagePlaceholder={article.meta.featuredImagePlaceholder}
					link={'/' +
						selectedLanguage +
						'/' +
						navigation[selectedLanguage].articles +
						'/' +
						article.translations[selectedLanguage].slug}
					publishedDate={article.meta.published_date}
					tags={translateTags(global, article.translations[selectedLanguage].tags)}
					{selectedLanguage}
				/>
			{/each}
		</div>

		<!-- Pagination -->
		{#if pagination && pagination.totalPages > 1}
			<div class="mt-8">
				<Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
			</div>
		{/if}

		<!-- View All Button - only show if in home page and there are more articles -->
		{#if showViewAllButton && articles.length > 3}
			<div class="flex justify-center">
				<a
					href={blogPageLink}
					class="group flex items-center gap-3 rounded-full border border-white/10 bg-white/[.01] px-8 py-4 backdrop-blur-md transition-all duration-300 ease-in-out hover:scale-105 hover:border-white/20 hover:bg-white/[.05]"
				>
					<span class="text-lg font-medium text-gray-300">{t.viewAll}</span>
					<ArrowRight
						class="h-5 w-5 text-gray-300 transition-transform duration-300 group-hover:translate-x-1"
					/>
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
