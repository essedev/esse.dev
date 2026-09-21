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
	import { reveal } from '$lib/actions/reveal';
	import SectionHeader from '$lib/components/SectionHeader.svelte';

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
		availableStatuses,
		index,
		collection
	}: ProjectsSectionProps & {
		pagination?: { currentPage: number; totalPages: number };
		activeFilters?: FilterState;
		availableTags?: string[];
		availableStatuses?: string[];
	} = $props();

	let screenSize = $state('desktop'); // 'mobile' | 'tablet' | 'desktop'

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

	// Stagger d'ingresso delle card: cascata leggera sulle prime, cappata così le card
	// rivelate scrollando non restano indietro.
	const cardStagger = (i: number) => Math.min(i, 4) * 60;

	// Readout dell'header: conteggio e arco di anni, presi dai meta.json. Nel listing
	// `projects` è solo la pagina corrente, quindi il totale arriva da fuori.
	let headerReadout = $derived.by(() => {
		const source = collection ?? projects;
		const count = source.length;
		if (!count) return undefined;
		const years = source
			.map((p) => p.meta.created_date?.slice(0, 4))
			.filter((y): y is string => Boolean(y))
			.sort();
		const lo = years[0];
		const hi = years[years.length - 1];
		if (!lo || !hi) return `${count} items`;
		return `${count} items \u00b7 ${lo === hi ? lo : `${lo}-${hi}`}`;
	});
</script>

<div class="flex flex-col gap-y-10 sm:gap-y-16 2xl:gap-y-[4.5rem]">
	<SectionHeader {index} title={projectsPage.title} readout={headerReadout} />

	<!-- Search and Filter Component -->
	{#if showFilters && activeFilters && availableTags}
		<div use:reveal={{ delay: 80 }} class="reveal relative z-10">
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
			{#each currentProjects as project, i (project.meta.id)}
				<div use:reveal={{ delay: cardStagger(i) }} class="reveal h-full [--reveal-shift:2rem]">
					<ProjectCard
						title={project.translations[selectedLanguage].title}
						excerpt={project.translations[selectedLanguage].excerpt}
						featuredImage={project.meta.featured_image}
						featuredImagePlaceholder={project.meta.featuredImagePlaceholder}
						tags={translateTags(global, project.translations[selectedLanguage].tags)}
						status={project.meta.status}
						year={project.meta.created_date?.slice(0, 4)}
						{global}
						link={'/' +
							selectedLanguage +
							'/' +
							navigation[selectedLanguage].projects +
							'/' +
							project.translations[selectedLanguage].slug}
					/>
				</div>
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
					class="group flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-8 py-4 backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.045]"
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
