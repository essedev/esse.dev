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

<!-- Da lg in su il bottone si aggancia alla cella d'angolo del telaio (in basso a
     destra, l'unico spazio che i rail lasciano libero) e perde bordo, sfondo e
     arrotondamento: dentro una cornice un riquadro flottante suona posticcio.
     Sotto lg il telaio non c'e' e resta il bottone di prima. -->
<button
	onclick={scrollToTop}
	class="group fixed right-6 bottom-6 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.045] lg:right-0 lg:bottom-0 lg:h-[var(--chassis-gutter)] lg:w-[var(--chassis-gutter)] lg:rounded-none lg:border-0 lg:bg-accent/12 lg:backdrop-blur-none lg:hover:bg-accent/30"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp
		class="h-5 w-5 text-gray-400 transition-colors lg:h-5 lg:w-5 lg:text-accent/80 lg:group-hover:text-accent lg:group-hover:text-accent"
	/>
</button>
