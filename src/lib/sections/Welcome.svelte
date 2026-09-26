<script lang="ts">
	import type { WelcomeSectionProps } from '$lib/types';
	import { inview, type Options } from 'svelte-inview';
	import { fly } from 'svelte/transition';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';

	// Receive welcome data as props
	let { welcome }: WelcomeSectionProps = $props();

	let isInView = $state(false);
	const options: Options = {
		rootMargin: '-50px',
		unobserveOnEnter: true
	};

	// Split title into words for individual animation
	const titleWords = $derived(welcome.title.split(' '));
</script>

<div
	use:inview={options}
	oninview_change={(event) => {
		const { inView } = event.detail;
		isInView = inView;
	}}
	class="relative flex flex-col items-center {isInView
		? 'inview-reveal animate'
		: 'inview-reveal opacity-0'}"
>
	<div class="mb-12 overflow-hidden">
		<h1
			class="-mt-2 text-center text-[4rem] leading-[1.1] font-medium tracking-tight sm:text-[7rem] lg:-mt-3 xl:-mt-4 xl:text-[8rem] 2xl:-mt-6 2xl:text-[10rem]"
		>
			{#each titleWords as word, i (i)}
				{#if isInView}
					<span
						in:fly={{ y: 30, duration: 600, delay: i * 300 + (i > 0 ? 700 : 0) }}
						class="inline-block"
					>
						{word}
					</span>
				{:else}
					<span class="inline-block opacity-0">{word}</span>
				{/if}
				{#if i < titleWords.length - 1}{/if}
			{/each}
		</h1>
	</div>

	<ContentRenderer
		content={welcome.description}
		className="flex flex-col gap-y-4 text-center"
		blockClasses={{
			paragraph: 'text-lg sm:text-xl lg:text-[1.7rem] 2xl:text-[1.8rem]'
		}}
	/>
</div>
