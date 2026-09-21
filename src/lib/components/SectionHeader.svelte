<script lang="ts">
	import { reveal } from '$lib/actions/reveal';

	// Header strumentale di sezione: indice numerato, righello che riempie, readout a
	// destra. L'indice è lo stesso che il rail sinistro del telaio mostra scorrendo,
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
	<div
		class="font-mono flex items-center gap-x-4 text-[0.65rem] tracking-[0.18em] text-gray-600 uppercase sm:text-xs"
	>
		{#if n}<span class="text-accent">{n}</span>{/if}
		<span class="h-px flex-1 bg-white/10"></span>
		{#if readout}<span>{readout}</span>{/if}
	</div>
	<svelte:element
		this={level}
		class="text-[2.5rem] leading-none font-normal sm:text-5xl md:text-6xl 2xl:text-7xl"
	>
		{title}
	</svelte:element>
</div>
