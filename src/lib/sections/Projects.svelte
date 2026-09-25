<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import EntryIndex from '$lib/components/EntryIndex.svelte';
	import type { FilterState, ProjectItem, ProjectsSectionProps } from '$lib/types/content';
	import { getTranslations, translateTags, type TranslationKey } from '$lib/utils/translations';
	import { ArrowRight, FileText } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { reveal } from '$lib/actions/reveal';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import { SHOWCASE_STATUSES, splitByDensity } from '$lib/utils/shelf';

	// Receive data as props
	let {
		projects,
		selectedLanguage,
		navigation,
		projectsPage,
		showFilters = false,
		showViewAllButton = false,
		global,
		activeFilters,
		availableTags,
		availableStatuses,
		index,
		collection
	}: ProjectsSectionProps & {
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

	// Solo i progetti tradotti nella lingua corrente; i filtri arrivano già applicati.
	let languageFiltered = $derived(
		projects.filter((project) => project.translations[selectedLanguage])
	);

	let viewLimit = $derived(screenSize === 'mobile' ? 3 : screenSize === 'tablet' ? 4 : 6);

	// Due densità (vedi utils/shelf). In home si mostra solo la vetrina, nell'ordine dei
	// featured e tagliata al limite responsivo; nel listing vetrina a card e, sotto,
	// archivio e idee come indice.
	let shelves = $derived(splitByDensity(languageFiltered));
	let showcase = $derived(
		showViewAllButton
			? languageFiltered
					.filter((p) => (SHOWCASE_STATUSES as readonly string[]).includes(p.meta.status))
					.slice(0, viewLimit)
			: shelves.showcase
	);
	// Una riga dello scaffale: anno, titolo, una frase.
	const toEntry = (p: ProjectItem) => {
		const tr = p.translations[selectedLanguage];
		return {
			key: p.meta.id,
			href: `/${selectedLanguage}/${navigation[selectedLanguage].projects}/${tr.slug}`,
			meta: p.meta.created_date.slice(0, 4),
			title: tr.title,
			excerpt: tr.excerpt,
			tags: translateTags(global, tr.tags)
		};
	};

	let showShelves = $derived(
		!showViewAllButton && (shelves.archived.length > 0 || shelves.ideas.length > 0)
	);

	// Get all required translations at once
	const translationKeys: TranslationKey[] = [
		'viewAll',
		'searchProjects',
		'noResultsFound',
		'tryAdjusting',
		'noProjectsHome',
		'checkBackLater',
		'shelfArchived',
		'shelfIdeas'
	];

	let t = $derived(getTranslations(global, translationKeys));

	// Generate link to projects page
	let projectsPageLink = $derived(
		`${base}/${selectedLanguage}/${navigation[selectedLanguage].projects}`
	);

	// Stagger d'ingresso delle card: cascata leggera sulle prime, cappata così le card
	// rivelate scrollando non restano indietro.
	const cardStagger = (i: number) => Math.min(i, 4) * 60;

	// Readout dell'header: conteggio e arco di anni, presi dai meta.json. Il totale arriva
	// da fuori (`collection`) perché `projects` può essere già filtrato.
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

	{#if showcase.length > 0 || showShelves}
		{#if showcase.length > 0}
			<div class="grid grid-cols-1 gap-6 sm:gap-10 md:grid-cols-2 xl:grid-cols-3">
				{#each showcase as project, i (project.meta.id)}
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
		{/if}

		{#if showShelves}
			<div class="flex flex-col gap-y-6 pt-4">
				{#if shelves.archived.length > 0}
					<EntryIndex label={t.shelfArchived} entries={shelves.archived.map(toEntry)} />
				{/if}
				{#if shelves.ideas.length > 0}
					<EntryIndex label={t.shelfIdeas} entries={shelves.ideas.map(toEntry)} />
				{/if}
			</div>
		{/if}

		<!-- In home il pulsante porta a tutto il resto: vetrina completa, archivio e idee. -->
		{#if showViewAllButton && languageFiltered.length > showcase.length}
			<div class="flex justify-center">
				<a href={projectsPageLink} class="group key key--primary px-8 py-4">
					<span>{t.viewAll}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
				</a>
			</div>
		{/if}
	{:else}
		<!-- No results found or no projects at all -->
		<div class="flex flex-col items-center gap-4 py-16 text-center">
			<FileText class="h-16 w-16 text-gray-700" />
			<div class="text-gray-400">
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
