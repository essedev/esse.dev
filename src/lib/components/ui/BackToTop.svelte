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

<!-- Da lg in su è l'unico tasto fisico sul telaio: un keycap da 26px al piede della
     scala nel rail destro, sotto la percentuale. La barra resta telemetria muta: il
     rail è aria-hidden apposta, quindi il controllo è un nodo separato appoggiato
     sopra, centrato nei 34px della gutter. -->
<button
	onclick={scrollToTop}
	class="key key--hw fixed right-[4px] bottom-[calc(var(--chassis-track-top)-4rem)] z-50 hidden h-[26px] w-[26px] justify-center p-0 lg:inline-flex"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp class="h-3 w-3" />
</button>
