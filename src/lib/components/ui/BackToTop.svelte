<script lang="ts">
	import type { GlobalContent } from '$lib/types';
	import { getTranslation } from '$lib/utils/translations';
	import { ChevronUp } from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	interface Props {
		global?: GlobalContent;
	}

	let { global }: Props = $props();

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	};

	// Get translation with type safety
	let backToTopText = $derived(getTranslation(global, 'backToTop'));
</script>

<!-- Da lg in su il bottone non e' un riquadro: e' un'etichetta al piede della scala
     nel rail destro, sotto la percentuale, vicino all'angolo dove si cerca "torna su".
     Parla come gli altri readout del telaio (mono, uppercase, tracking) e sta in
     accento perche' compare solo quando l'azione esiste davvero. La freccia sale in
     ciclo sull'hover: il gesto dice la direzione meglio della parola. La barra resta
     telemetria muta: il rail e' aria-hidden apposta, la percentuale si aggiorna a ogni
     scroll, quindi il controllo deve restare un nodo separato appoggiato sopra.
     Sotto lg il telaio non si monta e resta il bottone flottante di prima. -->
<button
	onclick={scrollToTop}
	class="group fixed right-6 bottom-6 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.045] lg:right-0 lg:bottom-[calc(var(--chassis-track-top)-4.5rem)] lg:h-9 lg:flex-col lg:gap-[3px] lg:w-[var(--chassis-gutter)] lg:rounded-none lg:border-0 lg:bg-transparent lg:backdrop-blur-none"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp class="h-5 w-5 text-gray-400 lg:hidden" />
	<ChevronUp class="rail-top-arrow hidden h-3 w-3 lg:block" />
	<span class="rail-top-label hidden lg:block">Top</span>
</button>
