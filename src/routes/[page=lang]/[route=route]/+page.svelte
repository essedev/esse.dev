<script lang="ts">
	import Articles from '$lib/sections/Articles.svelte';
	import Projects from '$lib/sections/Projects.svelte';
	import type { ArticleItem, ProjectItem } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section
	class="mx-auto max-w-screen-2xl px-4 pt-14 pb-24 xs:pt-20 xs:pb-32 sm:px-8 sm:pt-28 sm:pb-44 lg:px-14"
>
	{#if data.pageType === 'projects'}
		<Projects
			projects={data.items.filter((item): item is ProjectItem => 'status' in item.meta)}
			selectedLanguage={data.currentLang}
			navigation={data.navigation}
			projectsPage={data.projectsPage}
			showFilters={true}
			global={data.global}
			pagination={data.pagination}
			activeFilters={data.activeFilters}
			availableTags={data.availableTags}
			availableStatuses={data.availableStatuses}
		/>
	{:else}
		<Articles
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
