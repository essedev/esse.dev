<script lang="ts">
	import type { WelcomeSectionProps } from '$lib/types';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';

	// Receive welcome data as props
	let { welcome }: WelcomeSectionProps = $props();
</script>

<div class="hero-enter relative flex flex-col items-start text-left">
	<p class="font-mono mb-6 flex items-center text-sm text-gray-400 sm:text-base">
		<span>{welcome.eyebrow}</span>
		<!-- Desktop: il marchio resta nel rail; rimuoverlo dalla cornice avrebbe indebolito
		     l'identità persistente, mentre qui era una replica a pochi pixel di distanza. -->
		<span class="mx-3 text-gray-600 lg:hidden">·</span>
		<span class="lg:hidden">esse<span class="text-accent">dev</span></span>
	</p>

	<div class="mb-12 overflow-hidden">
		<h1
			class="font-mono -mt-2 text-left text-[3rem] leading-[1.15] font-medium sm:text-[5rem] lg:-mt-3 xl:-mt-4 xl:text-[6rem] 2xl:-mt-6 2xl:text-[7.5rem]"
		>
			{welcome.title}
		</h1>
	</div>

	<ContentRenderer
		content={welcome.description}
		className="flex max-w-xl flex-col gap-y-4 text-left"
		blockClasses={{
			paragraph: 'text-base text-gray-300 sm:text-lg lg:text-xl'
		}}
	/>

	<p class="font-mono mt-10 text-sm text-gray-500">
		half engineer, <span class="text-accent">half wizard</span>
	</p>
</div>
