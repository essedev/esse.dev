<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutData } from '$lib/types/content';
	import { handleAnchorClick } from '$lib/utils';
	import { Menu, X } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import Logo from './Logo.svelte';
	import LanguageSelector from './ui/LanguageSelector.svelte';

	// Ricevi dati come props
	let { data, menuOpen = $bindable() }: { data: LayoutData; menuOpen: boolean } = $props();

	function handleMenuClick() {
		menuOpen = !menuOpen;
	}

	let isLanguageCodeValid = $derived(
		data.languages.some((l) => l.code === page.url.pathname.split('/')[1])
	);

	// Stessa destinazione del logo, riusata dall'overlay mobile.
	let homeHref = $derived(
		`${base}${page.url.pathname.split('/')[2] ? '/' + data.selectedLanguage : isLanguageCodeValid ? '/' + data.selectedLanguage + '#top' : '/' + 'en'}`
	);
</script>

<!-- Desktop: quattro celle danno peso alla navigazione senza aggiungere una seconda
     superficie; il semplice aumento dei link avrebbe lasciato la barra otticamente vuota. -->
<header
	id="top"
	class="border-b border-white/5 lg:fixed lg:top-[calc(var(--chassis-gutter)+1px)] lg:right-[calc(var(--chassis-gutter)+1px)] lg:left-[calc(var(--chassis-gutter)+1px)] lg:z-40 lg:h-[var(--chassis-nav-h)] lg:bg-[#0c0c0c]/85 lg:backdrop-blur-md"
>
	<nav
		class="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-6 sm:px-8 lg:h-full lg:w-[90vw] lg:px-14 lg:py-0"
	>
		<a href={homeHref} onclick={handleAnchorClick} aria-label="Simone Salerno" class="lg:hidden">
			<Logo />
		</a>

		<div class="hidden h-full w-full grid-cols-4 items-stretch whitespace-nowrap lg:grid">
			{#each data.global.navigation as route, i (route.name)}
				<a
					href={`${base}/${data.selectedLanguage}${route.link}`}
					onclick={handleAnchorClick}
					class="group flex h-full items-center gap-x-3 border-l border-white/5 pl-5 font-mono text-lg font-medium text-gray-300 transition-colors first:border-l-0 first:pl-0 hover:text-white"
				>
					<span class="text-[0.65rem] text-accent/70 transition-colors group-hover:text-accent"
						>0{i + 1}</span
					>
					<span>{route.name}</span>
				</a>
			{/each}
		</div>

		<!-- Hamburger: stessa cella (px + py) della X nell'overlay, così aprendo non salta. -->
		<div class="flex h-10 w-10 items-center justify-center lg:hidden">
			{#if !menuOpen}
				<button
					transition:fade={{ duration: 150 }}
					onclick={handleMenuClick}
					aria-label="Menu"
					aria-expanded="false"
				>
					<Menu class="h-7 w-7" />
				</button>
			{/if}
		</div>
	</nav>

	<!-- Da lg in su il claim e la città li porta il rail superiore del telaio. -->
	<div
		class="mx-auto flex w-full max-w-screen-2xl items-center justify-between border-t border-white/5 px-4 py-1.5 font-mono text-[0.7rem] tracking-wide text-gray-500 sm:px-8 lg:hidden"
	>
		<span>Human vision &middot; <span class="text-accent">AI execution</span></span>
		<span class="hidden sm:block">Milano, IT</span>
	</div>

	{#if menuOpen}
		<!-- Overlay mobile autocontenuto: contenuto dentro lo stesso max-w-[90vw] del
		     sito, così logo e padding-x combaciano con la navbar (niente salto). -->
		<div
			class="fullscreen-overlay z-40 bg-black/90 backdrop-blur-md lg:hidden"
			transition:fade={{ duration: 200 }}
		>
			<div class="mx-auto flex h-full w-full max-w-[90vw] flex-col">
				<div class="flex items-center justify-between px-4 py-6 sm:px-8">
					<a
						href={homeHref}
						onclick={(event) => (handleAnchorClick(event), handleMenuClick())}
						aria-label="Simone Salerno"
					>
						<Logo />
					</a>
					<button
						onclick={handleMenuClick}
						aria-label="Chiudi menu"
						class="flex h-10 w-10 items-center justify-center text-gray-300 transition-colors hover:text-white"
					>
						<X class="h-7 w-7" />
					</button>
				</div>

				<nav class="flex flex-1 flex-col justify-center gap-y-7 px-4 font-mono sm:px-8">
					{#each data.global.navigation as route, i (route.name)}
						<a
							href={`${base}/${data.selectedLanguage}${route.link}`}
							onclick={(event) => (handleAnchorClick(event), handleMenuClick())}
							class="group flex items-baseline gap-4 text-3xl text-gray-200 transition-colors hover:text-white"
						>
							<span class="text-lg text-accent">0{i + 1}</span>
							<span>{route.name}</span>
						</a>
					{/each}
				</nav>

				<div
					class="flex items-center justify-between border-t border-white/5 px-4 py-6 font-mono text-xs text-gray-500 sm:px-8"
				>
					<span>Human vision &middot; <span class="text-accent">AI execution</span></span>
					<LanguageSelector
						languages={data.languages}
						selectedLanguage={data.selectedLanguage}
						navigation={data.navigation}
						slugMap={data.slugMap}
					/>
				</div>
			</div>
		</div>
	{/if}
</header>
