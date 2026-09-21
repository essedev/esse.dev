<script lang="ts">
	import type { ContactSectionProps } from '$lib/types';
	import { reveal } from '$lib/actions/reveal';
	import SectionHeader from '$lib/components/SectionHeader.svelte';

	// Receive contact data as props
	let { contact, index }: ContactSectionProps = $props();
</script>

<div class="flex w-full flex-col justify-between gap-y-14 tracking-tight sm:gap-y-24">
	<div class="flex flex-col gap-y-4 sm:gap-y-6">
		<SectionHeader {index} title={contact.title} level="h3" />
		<p use:reveal class="reveal text-xl sm:text-2xl md:text-[1.7rem] xl:text-3xl">
			{contact.subtitle}
		</p>
	</div>

	<div class="text-xl sm:text-2xl">
		{#each contact.links as link, index (link.name)}
			<div class="mb-2 {index === 0 ? 'mb-4' : ''}">
				<a
					class="inline-block transition-all duration-300 ease-in-out
            {index === 0 ? 'text-2xl sm:text-3xl md:text-4xl' : ''}"
					href={link.link}
					target="_blank"
					data-sveltekit-reload
				>
					<span
						class="inline-block bg-gradient-to-r from-accent to-accent bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-all duration-500 ease-out hover:bg-[length:100%_2px]"
					>
						{link.name}
					</span>
				</a>
			</div>
		{/each}
	</div>
</div>
