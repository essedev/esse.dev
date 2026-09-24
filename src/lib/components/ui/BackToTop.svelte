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

<!-- Sotto lg: tasto del dock, stesso oggetto del menu e dell'accento. -->
<button
	onclick={scrollToTop}
	class="key key--icon key--float fixed right-4 bottom-4 z-50 lg:hidden"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp class="h-5 w-5" />
</button>

<!-- Da lg in su il bottone non è un riquadro: è un'etichetta al piede della scala
     nel rail destro, sotto la percentuale, vicino all'angolo dove si cerca "torna su".
     Parla come gli altri readout del telaio (mono, uppercase, tracking) e sta in
     accento perché compare solo quando l'azione esiste davvero. La freccia sale in
     ciclo sull'hover: il gesto dice la direzione meglio della parola. La barra resta
     telemetria muta: il rail è aria-hidden apposta, la percentuale si aggiorna a ogni
     scroll, quindi il controllo deve restare un nodo separato appoggiato sopra. -->
<button
	onclick={scrollToTop}
	class="group fixed right-0 bottom-[calc(var(--chassis-track-top)-4.5rem)] z-50 hidden h-9 w-[var(--chassis-gutter)] cursor-pointer flex-col items-center justify-center gap-[3px] lg:flex"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp class="rail-top-arrow h-3 w-3" />
	<span class="rail-top-label">Top</span>
</button>
