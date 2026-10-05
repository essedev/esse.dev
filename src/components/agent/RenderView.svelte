<script lang="ts">
	import { isNumeric, type RenderView } from '../../agent/render';

	/**
	 * Una vista di `render` disegnata coi token del sito. Le barre sono SVG: la larghezza è
	 * un attributo, non uno stile inline, che la CSP bloccherebbe.
	 */
	let { view, locale }: { view: RenderView; locale: string } = $props();

	const max = $derived(
		view.type === 'bars' ? Math.max(...view.items.map((i) => i.value), 0) || 1 : 1
	);
	const number = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });
</script>

<figure class="flex flex-col gap-4 rounded-[var(--radius-control)] bg-surface/60 px-4 py-4">
	<figcaption class="font-mono text-xs text-subtle">{view.title}</figcaption>
	{#if view.type === 'bars'}
		<dl class="grid grid-cols-[minmax(0,auto)_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2">
			{#each view.items as item, i (i)}
				<dt class="truncate text-sm text-text">{item.label}</dt>
				<dd class="h-2">
					<svg
						viewBox="0 0 100 2"
						preserveAspectRatio="none"
						class="block h-2 w-full overflow-visible"
						aria-hidden="true"
					>
						<rect x="0" y="0" width="100" height="2" rx="1" class="fill-surface" />
						<rect
							x="0"
							y="0"
							width={(item.value / max) * 100}
							height="2"
							rx="1"
							class="fill-accent"
						/>
					</svg>
				</dd>
				<dd class="text-right font-mono text-xs text-muted tabular-nums">
					{number(item.value)}{view.unit ? ` ${view.unit}` : ''}
				</dd>
			{/each}
		</dl>
	{:else if view.type === 'table'}
		<div class="overflow-x-auto overscroll-x-none">
			<table class="w-full text-left text-sm">
				<thead>
					<tr>
						{#each view.columns as column, i (i)}
							<th class="pr-6 pb-2 font-mono text-xs font-normal text-subtle last:pr-0">{column}</th
							>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each view.rows as row, r (r)}
						<tr class="transition-colors hover:bg-hover">
							{#each row as cell, i (i)}
								<td
									class={[
										'py-1.5 pr-6 align-top last:pr-0',
										i === 0 ? 'text-fg' : 'text-text',
										isNumeric(cell) && 'text-right font-mono text-xs tabular-nums'
									]}>{cell}</td
								>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<ol class="flex flex-col gap-3">
			{#each view.items as item, i (i)}
				<li class="grid grid-cols-[5.5rem_auto_minmax(0,1fr)] items-baseline gap-x-3">
					<span class="font-mono text-xs text-subtle tabular-nums">{item.date}</span>
					<span class="led self-center" data-status="in-progress"></span>
					<span class="flex flex-col gap-0.5">
						<span class="text-sm text-fg">{item.label}</span>
						{#if item.detail}<span class="text-sm text-muted">{item.detail}</span>{/if}
					</span>
				</li>
			{/each}
		</ol>
	{/if}
</figure>
