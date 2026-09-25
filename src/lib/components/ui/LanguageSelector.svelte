<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import type { LanguageSelectorProps } from '$lib/types';
	import { getLanguageUrl } from '$lib/utils/language-url';

	// Props ricevuti dal layout parent.
	let {
		languages = [],
		selectedLanguage = 'en',
		navigation = {},
		slugMap = { projects: {}, articles: {} },
		variant = 'pill'
	}: LanguageSelectorProps & { variant?: 'pill' | 'rail' } = $props();

	function buildLanguageUrl(targetLang: string): string {
		return getLanguageUrl({
			pathname: page.url.pathname,
			search: page.url.search,
			navigation,
			slugMap,
			targetLang
		});
	}

	// Posizione dell'indicatore che scivola sotto la lingua attiva (variante pill).
	let activeIndex = $derived(
		Math.max(
			0,
			languages.findIndex((l) => l.code === selectedLanguage)
		)
	);
</script>

{#if variant === 'rail'}
	<!-- Variante telaio: due keycap da 26px impilati nel rail sinistro, quello attivo
	     premuto in accento. Stessa taglia e stesso passo dei LED dell'accento e del
	     torna-su: il fianco del dispositivo è una fila di tasti fisici. -->
	<div
		class="flex w-[var(--chassis-gutter)] flex-col items-center gap-1.5"
		role="group"
		aria-label="Lingua"
	>
		{#each languages as language (language.code)}
			{#if language.code === selectedLanguage}
				<span
					aria-current="true"
					class="key key--hw is-on h-[26px] w-[26px] justify-center p-0 text-tele tracking-label"
					>{language.code.toUpperCase()}</span
				>
			{:else}
				{@const url = `${base}${buildLanguageUrl(language.code)}`}
				<a
					href={url}
					onclick={(e) => {
						e.preventDefault();
						goto(url, { noScroll: true });
					}}
					class="key key--hw h-[26px] w-[26px] justify-center p-0 text-tele tracking-label"
					>{language.code.toUpperCase()}</a
				>
			{/if}
		{/each}
	</div>
{:else}
	<!-- Selettore lingua come segmented control mono: un indicatore in accento scivola
	     sotto la lingua attiva (come il thumb del MotionToggle), le altre celle restano
	     spente e cliccabili. -->
	<div class="key-group relative p-0.5 text-xs" role="group" aria-label="Lingua">
		<!-- Indicatore scivolante (passo = larghezza di una cella). -->
		<span
			class="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-[3px] bg-accent shadow-[0_0_10px] shadow-accent/45 transition-transform duration-300 ease-out"
			style="width: calc((100% - 0.25rem) / {languages.length}); transform: translateX({activeIndex *
				100}%);"
			aria-hidden="true"
		></span>
		{#each languages as language (language.code)}
			{#if language.code === selectedLanguage}
				<span
					aria-current="true"
					class="relative z-10 px-2 py-0.5 text-center text-[#041018] transition-colors"
					>{language.code.toUpperCase()}</span
				>
			{:else}
				{@const url = `${base}${buildLanguageUrl(language.code)}`}
				<a
					href={url}
					onclick={(e) => {
						e.preventDefault();
						goto(url, { noScroll: true });
					}}
					class="relative z-10 px-2 py-0.5 text-center text-gray-300 transition-colors hover:text-white"
					>{language.code.toUpperCase()}</a
				>
			{/if}
		{/each}
	</div>
{/if}
