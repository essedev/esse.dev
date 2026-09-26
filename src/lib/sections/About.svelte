<script lang="ts">
	import { inview, type Options } from 'svelte-inview';
	import type { AboutSectionProps } from '$lib/types';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';

	// Receive about data as props
	let { about }: AboutSectionProps = $props();

	let isInView = $state(false);
	const options: Options = {
		rootMargin: '-100px',
		unobserveOnEnter: true
	};
</script>

<div
	use:inview={options}
	oninview_change={(event) => {
		const { inView } = event.detail;
		isInView = inView;
	}}
	class="flex flex-col gap-y-10 sm:gap-y-16 2xl:gap-y-[4.5rem] {isInView
		? 'inview-reveal animate'
		: 'inview-reveal opacity-0'}"
>
	<h2 class="text-[2.5rem] leading-none font-normal sm:text-5xl md:text-6xl 2xl:text-7xl">
		{about.title}
	</h2>
	<ContentRenderer
		content={about.description}
		className="flex flex-col gap-y-4 lg:gap-y-6 2xl:gap-y-8"
		blockClasses={{
			paragraph: 'text-xl sm:text-2xl lg:text-[1.7rem] 2xl:text-3xl'
		}}
	/>
</div>
