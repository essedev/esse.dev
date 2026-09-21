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

	// Posizione dell'indicatore che scivola sotto la lingua attiva.
	let activeIndex = $derived(
		Math.max(
			0,
			languages.findIndex((l) => l.code === selectedLanguage)
		)
	);
</script>

{#if variant === 'rail'}
	<!-- Variante telaio: due celle da 24px impilate nel rail sinistro, l'attiva in
	     accento e l'altra in grigio pieno, con la tacca sul bordo esterno a fare da
	     indice. Stessa grammatica dei LED dell'accento, cosi' i due gruppi leggono
	     come una fila di interruttori sullo stesso fianco. L'inattiva resta a
	     opacita' piena: a 9.5px una parola al 32% su nero non si legge. -->
	<div
		class="relative flex w-[var(--chassis-gutter)] flex-col font-mono text-[0.65rem] tracking-[0.1em]"
		role="group"
		aria-label="Lingua"
	>
		<span class="rail-tick pointer-events-none" style="--tick-step: {activeIndex};"></span>
		{#each languages as language (language.code)}
			{#if language.code === selectedLanguage}
				<span aria-current="true" class="flex h-6 items-center justify-center text-accent"
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
					class="flex h-6 items-center justify-center text-gray-400 transition-colors hover:text-white"
					>{language.code.toUpperCase()}</a
				>
			{/if}
		{/each}
	</div>
{:else}
	<!-- Selettore lingua come segmented control mono: un indicatore in accento scivola
	     sotto la lingua attiva (come il thumb del MotionToggle), le altre celle restano
	     spente e cliccabili. -->
	<div
		class="relative inline-flex items-center rounded-md border border-white/10 bg-white/[0.02] p-0.5 font-mono text-xs"
		role="group"
		aria-label="Lingua"
	>
		<!-- Indicatore scivolante (passo = larghezza di una cella). -->
		<span
			class="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 rounded-sm bg-accent/15 transition-transform duration-300 ease-out"
			style="width: calc((100% - 0.25rem) / {languages.length}); transform: translateX({activeIndex *
				100}%);"
			aria-hidden="true"
		></span>
		{#each languages as language (language.code)}
			{#if language.code === selectedLanguage}
				<span
					aria-current="true"
					class="relative z-10 px-2 py-0.5 text-center text-accent transition-colors"
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
					class="relative z-10 px-2 py-0.5 text-center text-gray-500 transition-colors hover:text-white"
					>{language.code.toUpperCase()}</a
				>
			{/if}
		{/each}
	</div>
{/if}
