<script lang="ts">
	import { reveal } from '$lib/actions/reveal';
	import type { AboutSectionProps } from '$lib/types';
	import ContentRenderer from '$lib/components/ui/ContentRenderer.svelte';
	import SectionHeader from '$lib/components/SectionHeader.svelte';

	// Receive about data as props
	let { about, index }: AboutSectionProps = $props();
</script>

<div class="flex flex-col gap-y-10 sm:gap-y-16 2xl:gap-y-[4.5rem]">
	<SectionHeader {index} title={about.title} />
	<div use:reveal class="reveal">
		<ContentRenderer
			content={about.description}
			className="flex flex-col gap-y-4 lg:gap-y-6 2xl:gap-y-8"
			blockClasses={{
				paragraph: 'text-xl sm:text-2xl lg:text-[1.7rem] 2xl:text-3xl'
			}}
		/>
	</div>
</div>
