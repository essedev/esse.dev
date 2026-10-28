<script lang="ts">
	import type { GroupKind, ListItem, ThemedPicture } from '../lib/listing';

	/**
	 * A project in the grouped list. `wide` is the row of a project in progress, with the cover
	 * on the left; `compact` fits one line, logo, name, excerpt and year. The logo carries the
	 * status LED in its corner, like the rows of the sidebar.
	 */
	let {
		item,
		kind,
		featuredLabel
	}: {
		item: ListItem;
		/** How the row is drawn. */
		kind: GroupKind;
		/** The badge of a project in the showcase. */
		featuredLabel: string;
	} = $props();

	const MAX_TAGS = 3;
	const FOCUS = { top: 'object-top', center: 'object-center', bottom: 'object-bottom' };
	// Each theme shows its own image; an image without a light variant serves both.
	const variants = (p: ThemedPicture) =>
		p.light
			? [
					{ pic: p.dark, theme: 'light:hidden' },
					{ pic: p.light, theme: 'hidden light:block' }
				]
			: [{ pic: p.dark, theme: '' }];
</script>

{#snippet logo()}
	<span class="relative inline-flex shrink-0">
		{#if item.logo}
			{#each variants(item.logo) as { pic, theme } (pic.src)}
				<img
					src={pic.src}
					srcset={pic.srcset}
					width="20"
					height="20"
					alt=""
					class="size-5 object-contain {theme}"
				/>
			{/each}
		{:else}
			<span class="size-5" aria-hidden="true"></span>
		{/if}
		{#if item.status}
			<span
				class="led led-badge absolute -right-0.5 -bottom-0.5"
				data-status={item.status}
				title={item.statusLabel}
			></span>
		{/if}
	</span>
{/snippet}

{#if kind === 'wide'}
	<a
		href={item.href}
		class="group grid grid-cols-1 gap-3 rounded-[var(--radius-panel)] p-3 transition-colors hover:bg-surface/60 sm:grid-cols-[clamp(10rem,18vw,15rem)_minmax(0,1fr)_auto] sm:items-center sm:gap-x-5 sm:py-2.5"
	>
		<span class="relative aspect-video overflow-hidden rounded-[var(--radius-control)]">
			{#if item.cover}
				{#each variants(item.cover) as { pic, theme } (pic.src)}
					<img
						src={pic.src}
						srcset={pic.srcset}
						sizes="(min-width: 640px) 15rem, 100vw"
						alt=""
						loading="lazy"
						decoding="async"
						class="absolute inset-0 size-full object-cover motion-safe:transition-[scale] motion-safe:duration-500 motion-safe:group-hover:scale-[1.03] {FOCUS[
							item.cover.focus
						]} {theme}"
					/>
				{/each}
			{:else}
				<span class="cover-generated absolute inset-0"></span>
			{/if}
		</span>
		<span class="flex min-w-0 flex-col gap-1.5">
			<span class="flex items-center gap-2.5">
				{@render logo()}
				<span class="text-[1.0625rem] font-medium tracking-tight text-fg">{item.title}</span>
				{#if item.featured !== undefined}
					<span
						class="rounded-[var(--radius-control)] bg-accent/12 px-1.5 py-0.5 font-mono text-[0.65rem] tracking-[0.08em] text-accent uppercase"
					>
						{featuredLabel}
					</span>
				{/if}
			</span>
			<span class="line-clamp-2 text-[0.9375rem] leading-relaxed text-muted">{item.excerpt}</span>
			{#if item.tags.length}
				<span class="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.7rem] text-subtle">
					{#each item.tags.slice(0, MAX_TAGS) as tag (tag)}
						<span>{tag}</span>
					{/each}
					{#if item.tags.length > MAX_TAGS}<span>+{item.tags.length - MAX_TAGS}</span>{/if}
				</span>
			{/if}
		</span>
		<span class="hidden self-start pt-1 font-mono text-xs text-subtle tabular-nums sm:block">
			{item.date.slice(0, 4)}
		</span>
	</a>
{:else}
	<a
		href={item.href}
		class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-[var(--radius-panel)] px-3 py-2.5 transition-colors hover:bg-surface/60 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
	>
		{@render logo()}
		<span class="truncate text-[0.9375rem] font-medium text-fg sm:overflow-visible"
			>{item.title}</span
		>
		<span class="hidden truncate text-[0.8125rem] text-subtle sm:block">{item.excerpt}</span>
		<span class="font-mono text-xs text-subtle tabular-nums">{item.date.slice(0, 4)}</span>
	</a>
{/if}
