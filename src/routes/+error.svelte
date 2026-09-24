<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { ContentLoader } from '$lib/utils/content';
	import { getTranslation } from '$lib/utils/translations';
	import type { ErrorPageState } from '$lib/types/content';
	import { onMount } from 'svelte';
	import { ChevronLeft } from '@lucide/svelte';

	// State for translations with proper typing
	let errorState: ErrorPageState = $state({
		global: null,
		currentLang: 'en'
	});

	// Load translations on mount
	onMount(async () => {
		if (browser) {
			try {
				// Determine language from URL
				const pathSegments = page.url.pathname.split('/').filter(Boolean);
				const possibleLang = pathSegments[0];
				errorState.currentLang = ['en', 'it'].includes(possibleLang) ? possibleLang : 'en';

				// Load global translations
				const loader = new ContentLoader();
				errorState.global = await loader.loadGlobal(errorState.currentLang);
			} catch (error) {
				console.error('Error loading translations for error page:', error);
				// Keep global as null, will show missing translation placeholders
			}
		}
	});

	// Use the translation system with type safety
	let notFoundText = $derived(
		getTranslation(errorState.global, 'pageNotFound', '404 - Page Not Found')
	);
	let backHomeText = $derived(getTranslation(errorState.global, 'backHome', 'Back Home'));

	// Generate home URL based on current language
	let homeUrl = $derived(
		`${base}${errorState.currentLang === 'en' ? '/' : `/${errorState.currentLang}`}`
	);
</script>

<div class="flex min-h-[80vh] flex-col items-center justify-center text-center">
	<h1 class="font-mono text-7xl font-medium text-accent sm:text-8xl">{page.status}</h1>
	<p class="mt-4 font-mono text-xl text-gray-400 sm:text-2xl">{notFoundText}</p>
	<a data-sveltekit-reload href={homeUrl} class="key key--ghost mt-8 pl-2.5">
		<ChevronLeft class="h-4 w-4" />
		{backHomeText}
	</a>
</div>
