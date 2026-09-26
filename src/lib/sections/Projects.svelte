<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { FilterState, ProjectsSectionProps } from '$lib/types/content';
	import { getTranslations, translateTags, type TranslationKey } from '$lib/utils/translations';
	import { ArrowRight, FileText } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { inview, type Options } from 'svelte-inview';

	// Receive data as props
	let {
		projects,
		selectedLanguage,
		navigation,
		projectsPage,
		showFilters = false,
		showViewAllButton = false,
		global,
		pagination,
		activeFilters,
		availableTags,
		availableStatuses
	}: ProjectsSectionProps & {
		pagination?: { currentPage: number; totalPages: number };
		activeFilters?: FilterState;
		availableTags?: string[];
		availableStatuses?: string[];
	} = $props();

	let isInView = $state(false);
	let screenSize = $state('desktop'); // 'mobile' | 'tablet' | 'desktop'

	const options: Options = {
		rootMargin: '-100px',

		unobserveOnEnter: true
	};

	// Check screen size for responsive project limits
	onMount(() => {
		if (browser) {
			const updateScreenSize = () => {
				if (window.matchMedia('(min-width: 1280px)').matches) {
					screenSize = 'desktop';
				} else if (window.matchMedia('(min-width: 768px)').matches) {
					screenSize = 'tablet';
				} else {
					screenSize = 'mobile';
				}
			};

			updateScreenSize();
			window.addEventListener('resize', updateScreenSize);
			return () => window.removeEventListener('resize', updateScreenSize);
		}
	});

	// Data is now pre-filtered, but we ensure it has translations.
	// We also apply the view limit reactively based on screen size.
	let currentProjects = $derived.by(() => {
		const languageFiltered = projects.filter((project) => project.translations[selectedLanguage]);

		if (!showViewAllButton) {
			return languageFiltered;
		}

		const limit = screenSize === 'mobile' ? 3 : screenSize === 'tablet' ? 4 : 6;
		return languageFiltered.slice(0, limit);
	});

	// Get all required translations at once
	const translationKeys: TranslationKey[] = [
		'viewAll',
		'searchProjects',
		'noResultsFound',
		'tryAdjusting',
		'noProjectsHome',
		'checkBackLater'
	];

	let t = $derived(getTranslations(global, translationKeys));

	// Generate link to projects page
	let projectsPageLink = $derived(
		`${base}/${selectedLanguage}/${navigation[selectedLanguage].projects}`
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
		{projectsPage.title}
	</h2>

	<!-- Search and Filter Component -->
	{#if showFilters && activeFilters && availableTags}
		<div class="relative z-10">
			<SearchFilter
				filters={activeFilters}
				{availableTags}
				{availableStatuses}
				showDateFilter={false}
				showStatusFilter={true}
				placeholder={t.searchProjects}
				{global}
			/>
		</div>
	{/if}

	{#if currentProjects && currentProjects.length > 0}
		<div class="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-2 xl:grid-cols-3">
			{#each currentProjects as project (project.meta.id)}
				<ProjectCard
					title={project.translations[selectedLanguage].title}
					excerpt={project.translations[selectedLanguage].excerpt}
					featuredImage={project.meta.featured_image}
					featuredImagePlaceholder={project.meta.featuredImagePlaceholder}
					tags={translateTags(global, project.translations[selectedLanguage].tags)}
					status={project.meta.status}
					{global}
					link={'/' +
						selectedLanguage +
						'/' +
						navigation[selectedLanguage].projects +
						'/' +
						project.translations[selectedLanguage].slug}
				/>
			{/each}
		</div>

		<!-- Pagination -->
		{#if pagination && pagination.totalPages > 1}
			<div class="mt-8">
				<Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} />
			</div>
		{/if}

		<!-- View All Button - only show if in home page and there are more projects -->
		{#if showViewAllButton && projects.length > (screenSize === 'mobile' ? 3 : screenSize === 'tablet' ? 4 : 6)}
			<div class="flex justify-center">
				<a
					href={projectsPageLink}
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
		<!-- No results found or no projects at all -->
		<div class="flex flex-col items-center gap-4 py-16 text-center">
			<FileText class="h-16 w-16 text-white/20" />
			<div class="text-white/60">
				{#if activeFilters && (activeFilters.query || activeFilters.selectedTags.length > 0 || activeFilters.selectedStatuses.length > 0)}
					<p class="text-lg">{t.noResultsFound}</p>
					<p class="mt-2 text-sm">{t.tryAdjusting}</p>
				{:else}
					<p class="text-lg">{t.noProjectsHome}</p>
					<p class="mt-2 text-sm">{t.checkBackLater}</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
