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
	class="fixed right-6 bottom-[calc(1.5rem+var(--chassis-gutter))] z-50 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-white/[0.02] backdrop-blur-md transition-colors duration-200 hover:border-accent/50 hover:bg-white/[0.045]"
	aria-label={backToTopText}
	in:fly={{ y: 10, duration: 300 }}
	out:fly={{ y: 10, duration: 200 }}
>
	<ChevronUp class="h-5 w-5 text-gray-400" />
</button>
