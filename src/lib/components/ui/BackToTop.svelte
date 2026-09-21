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

<!-- Da lg in su il bottone non e' piu' un oggetto: e' un bersaglio trasparente
     allineato allo zero della scala nel rail destro, etichettato "00" come la home
     nel rail sinistro, che gia' si chiama "00 / HOME". Una tacca muta non diceva
     che si poteva cliccare; un numero della stessa famiglia si.
     La barra resta telemetria muta (il rail e' aria-hidden apposta, la percentuale
     si aggiorna a ogni scroll), quindi il controllo deve restare un nodo separato
     appoggiato sopra. Niente drag e niente scrub: quella gutter e' la zona della
     scrollbar di sistema e un salto accidentale sarebbe peggio di un bottone brutto.
     Sotto lg il telaio non si monta e resta il bottone flottante di prima. -->
<button
	onclick={scrollToTop}
	class="group fixed right-6 bottom-6 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.045] lg:top-[calc(var(--chassis-track-top)-1.5rem)] lg:right-0 lg:bottom-auto lg:h-6 lg:w-[var(--chassis-gutter)] lg:rounded-none lg:border-0 lg:bg-transparent lg:backdrop-blur-none"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp class="h-5 w-5 text-gray-400 lg:hidden" />
	<span class="rail-zero-label hidden lg:block">00</span>
</button>
