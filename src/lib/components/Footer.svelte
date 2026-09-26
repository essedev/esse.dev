<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import type { FooterProps } from '$lib/types';
	import { handleAnchorClick } from '$lib/utils';
	import { getTranslation } from '$lib/utils/translations';
	import Logo from './Logo.svelte';
	import MotionToggle from './ui/MotionToggle.svelte';

	// Receive data as props from parent layout
	let { data }: FooterProps = $props();

	let isLanguageCodeValid = $derived(
		data.languages.some((l) => l.code === page.url.pathname.split('/')[1])
	);

	// Get translation with type safety
	let copyrightText = $derived(getTranslation(data.global, 'copyright'));
</script>

<footer class="border-t border-white/5">
	<div class="mx-auto w-full max-w-screen-2xl">
		<nav
			class="flex items-start justify-between px-4 py-8 text-lg sm:px-8 sm:pt-10 sm:pb-8 sm:text-xl md:text-2xl lg:px-14"
		>
			<a
				href={`${base}${page.url.pathname.split('/')[2] ? '/' + data.selectedLanguage : isLanguageCodeValid ? '/' + data.selectedLanguage + '#top' : '/' + 'en'}`}
				onclick={handleAnchorClick}
				aria-label="Logo"
			>
				<Logo />
			</a>

			<div class="flex flex-col gap-x-7 gap-y-2 leading-none opacity-80 md:flex-row">
				{#each data.global.navigation as route (route.name)}
					<a href={`${base}/${data.selectedLanguage}${route.link}`} onclick={handleAnchorClick}
						>{route.name}</a
					>
				{/each}
			</div>
		</nav>
		<div
			class="text-md flex flex-col gap-3 px-4 pt-2 pb-7 text-neutral-200 opacity-70 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:text-lg lg:px-14"
		>
			<span>{copyrightText}</span>
			<div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
				<a
					href={`${base}/${data.selectedLanguage}/rss.xml`}
					class="transition-colors hover:text-white">RSS</a
				>
				<a href={`${base}/sitemap.xml`} class="transition-colors hover:text-white">Sitemap</a>
				<a
					href="https://github.com/essedev/simonesalerno.it"
					target="_blank"
					rel="noreferrer"
					class="transition-colors hover:text-white">Source</a
				>
				<MotionToggle lang={data.selectedLanguage} />
			</div>
		</div>
	</div>
</footer>
