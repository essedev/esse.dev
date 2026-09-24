<script lang="ts">
	import type { WelcomeSectionProps } from '$lib/types';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';

	// Receive welcome data as props
	let { welcome }: WelcomeSectionProps = $props();

	// L'ultima parola del titolo va in accento, come "dev" nel logo: è il punto della
	// frase ("spells"), e il colore la fa leggere per prima senza cambiare il testo.
	let titleParts = $derived.by(() => {
		const title = welcome.title.trim();
		const cut = title.lastIndexOf(' ');
		return cut < 0
			? { head: '', tail: title }
			: { head: title.slice(0, cut + 1), tail: title.slice(cut + 1) };
	});
</script>

<div class="hero-enter relative flex flex-col items-start text-left">
	<p class="font-mono mb-6 flex items-center text-sm text-gray-400 sm:text-base">
		<span>{welcome.eyebrow}</span>
		<!-- Desktop: il marchio resta nel rail; rimuoverlo dalla cornice avrebbe indebolito
		     l'identità persistente, mentre qui era una replica a pochi pixel di distanza. -->
		<span class="mx-3 text-gray-600 lg:hidden">·</span>
		<span class="lg:hidden">esse<span class="text-accent">dev</span></span>
	</p>

	<div class="mb-8 overflow-hidden sm:mb-10">
		<h1
			class="font-mono -mt-2 text-left text-[3rem] leading-[1.15] font-medium sm:text-[5rem] lg:-mt-3 xl:-mt-4 xl:text-[6rem] 2xl:-mt-6 2xl:text-[7.5rem]"
		>
			{titleParts.head}<span class="text-accent">{titleParts.tail}</span>
		</h1>
	</div>

	<ContentRenderer
		content={welcome.description}
		className="flex flex-col gap-y-3 text-left lg:gap-y-1"
		blockClasses={{
			// Una frase per blocco e, da lg, una per riga: gli a capo li decide il senso, non
			// la larghezza del contenitore. Il corpo cresce con il titolo (da xl a 2xl), così
			// il rapporto fra i due resta costante invece di schiacciare il testo in nota.
			paragraph:
				'text-lg leading-snug text-pretty text-gray-300 sm:text-xl lg:whitespace-nowrap xl:text-2xl 2xl:text-[1.75rem]'
		}}
	/>

	<p class="font-mono mt-10 text-sm text-gray-500">
		half engineer, <span class="text-accent">half wizard</span>
	</p>
</div>
