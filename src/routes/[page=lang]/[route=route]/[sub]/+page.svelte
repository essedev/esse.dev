<script lang="ts">
	import Article from '$lib/sections/Article.svelte';
	import Project from '$lib/sections/Project.svelte';

	let { data } = $props();
</script>

<div
	class="mx-auto w-full max-w-screen-2xl px-4 pt-8 pb-52 sm:px-8 sm:pt-10 sm:pb-64 lg:px-14 2xl:pt-14 2xl:pb-72"
>
	{#if data.type === 'project'}
		<Project
			content={data.content as import('$lib/types').ProjectItem}
			currentLang={data.currentLang}
			global={data.global}
			navigation={data.navigation}
		/>
	{:else if data.type === 'article'}
		<Article
			content={data.content as import('$lib/types').ArticleItem}
			currentLang={data.currentLang}
			global={data.global}
			related={data.related}
			navigation={data.navigation}
		/>
	{/if}
</div>
