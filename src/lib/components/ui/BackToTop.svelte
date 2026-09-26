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

<button
	onclick={scrollToTop}
	class="fixed right-8 bottom-8 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[.01] backdrop-blur-md transition-all duration-300 ease-in-out hover:scale-110 hover:bg-white/[.05]"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp class="h-5 w-5 text-gray-300" />
</button>
