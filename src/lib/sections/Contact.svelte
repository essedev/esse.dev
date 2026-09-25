<script lang="ts">
	import type { ContactSectionProps } from '$lib/types';
	import { reveal } from '$lib/actions/reveal';
	import SectionHeader from '$lib/components/SectionHeader.svelte';
	import { ArrowUpRight } from '@lucide/svelte';

	let { contact, index }: ContactSectionProps = $props();

	let primary = $derived(contact.links[0]);
	let profiles = $derived(contact.links.slice(1));

	// I profili si aprono in una scheda nuova; un mailto no, aprirebbe una scheda vuota.
	const external = (href: string) =>
		href.startsWith('mailto:')
			? {}
			: { target: '_blank', rel: 'noopener noreferrer', 'data-sveltekit-reload': true };
</script>

<div class="flex w-full flex-col justify-between gap-y-14 tracking-tight sm:gap-y-24">
	<div class="flex flex-col gap-y-4 sm:gap-y-6">
		<SectionHeader {index} title={contact.title} level="h3" />
		<p use:reveal class="reveal max-w-prose text-xl sm:text-2xl md:text-[1.7rem] xl:text-3xl">
			{contact.subtitle}
		</p>
	</div>

	<!-- L'email è il contatto vero e resta grande; i profili sono una riga sola, in mono,
	     come i readout del telaio: servono a chi li cerca, non devono competere con l'email. -->
	<div use:reveal class="reveal flex flex-col gap-y-6">
		{#if primary}
			<a
				class="inline-block self-start text-2xl sm:text-3xl md:text-4xl"
				href={primary.link}
				{...external(primary.link)}
			>
				<span
					class="inline-block bg-gradient-to-r from-accent to-accent bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-all duration-500 ease-out hover:bg-[length:100%_2px]"
				>
					{primary.name}
				</span>
			</a>
		{/if}
		{#if profiles.length > 0}
			<div
				class="flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-xs tracking-label text-gray-400 uppercase sm:text-sm"
			>
				{#each profiles as link (link.name)}
					<a
						class="group inline-flex items-center gap-x-1.5 transition-colors hover:text-white"
						href={link.link}
						{...external(link.link)}
					>
						{link.name}
						<ArrowUpRight
							class="h-3.5 w-3.5 text-gray-600 transition-colors group-hover:text-accent"
							aria-hidden="true"
						/>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
