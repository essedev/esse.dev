<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	// Header strumentale di sezione: indice numerato, righello che riempie, readout a
	// destra. Il titolo è in mono come l'hero e la nav: è un'etichetta dello strumento,
	// non contenuto (i titoli di card e dettaglio restano in sans). L'indice è lo stesso che il rail sinistro del telaio mostra scorrendo,
	// così cornice e contenuto parlano la stessa lingua. Il readout compare solo dove
	// c'è un dato vero da mostrare: una riga inventata varrebbe meno del vuoto.
	let {
		index,
		title,
		readout,
		level = 'h2'
	}: { index?: number; title: string; readout?: string; level?: 'h2' | 'h3' } = $props();

	let n = $derived(typeof index === 'number' ? String(index).padStart(2, '0') : undefined);
</script>

<div use:reveal class="reveal flex flex-col gap-y-5 sm:gap-y-7">
	<div class="label flex items-center gap-x-4 text-gray-600 sm:text-xs">
		{#if n}<span class="text-accent">{n}</span>{/if}
		<span class="h-px flex-1 bg-line-2"></span>
		{#if readout}<span>{readout}</span>{/if}
	</div>
	<svelte:element
		this={level}
		class="font-mono text-[2rem] leading-[1.1] font-medium tracking-tight sm:text-[2.75rem] md:text-[3.25rem] 2xl:text-[3.75rem]"
	>
		{title}
	</svelte:element>
</div>
