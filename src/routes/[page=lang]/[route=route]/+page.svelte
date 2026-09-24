<script lang="ts">
	import Articles from '$lib/sections/Articles.svelte';
	import Projects from '$lib/sections/Projects.svelte';
	import type { ArticleItem, ProjectItem } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// L'indice della sezione non si cabla: è la posizione nella navbar, come in home. Si
	// cerca per ancora (#projects, #blog), che non cambia con la lingua; il nome sì.
	function navIndex(anchor: string): number | undefined {
		const i = data.global.navigation.findIndex((route) => route.link === `#${anchor}`);
		return i >= 0 ? i + 1 : undefined;
	}
</script>

<section class="section mx-auto max-w-screen-2xl px-4 sm:px-8 lg:px-14">
	{#if data.pageType === 'projects'}
		<Projects
			index={navIndex('projects')}
			collection={data.projects}
			projects={data.items.filter((item): item is ProjectItem => 'status' in item.meta)}
			selectedLanguage={data.currentLang}
			navigation={data.navigation}
			projectsPage={data.projectsPage}
			showFilters={true}
			global={data.global}
			activeFilters={data.activeFilters}
			availableTags={data.availableTags}
			availableStatuses={data.availableStatuses}
		/>
	{:else}
		<Articles
			index={navIndex('blog')}
			collection={data.articles}
			articles={data.items.filter((item): item is ArticleItem => 'published_date' in item.meta)}
			selectedLanguage={data.currentLang}
			navigation={data.navigation}
			blogPage={data.blogPage}
			showFilters={true}
			global={data.global}
			pagination={data.pagination}
			activeFilters={data.activeFilters}
			availableTags={data.availableTags}
		/>
	{/if}
</section>
