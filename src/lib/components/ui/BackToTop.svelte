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

<!-- Da lg in su il bottone si riduce a un quadratino nel rail destro, appena sopra
     il rail inferiore: bordo e fondo in accento a bassa opacita', che salgono
     sull'hover. Il pieno d'accento era troppo pesante per un controllo secondario
     che compare solo scrollando. Sotto lg il telaio non si monta e resta il bottone
     flottante di prima. -->
<button
	onclick={scrollToTop}
	class="group fixed right-6 bottom-6 z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.045] lg:right-1 lg:bottom-[calc(var(--chassis-gutter)+0.375rem)] lg:h-[26px] lg:w-[26px] lg:rounded-sm lg:border-accent/30 lg:bg-accent/[0.08] lg:backdrop-blur-none lg:hover:border-accent/70 lg:hover:bg-accent/15"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp
		class="h-5 w-5 text-gray-400 transition-colors lg:h-3.5 lg:w-3.5 lg:text-accent/70 lg:group-hover:text-accent"
	/>
</button>
