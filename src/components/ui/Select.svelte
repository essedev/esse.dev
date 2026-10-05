<script lang="ts" module>
	export interface SelectOption {
		value: string;
		label: string;
		count?: number;
	}
</script>

<script lang="ts">
	import { Check, ChevronDown, Search } from '@lucide/svelte';
	import { tick } from 'svelte';

	/**
	 * Custom select with the ARIA listbox pattern: button trigger, panel with optional search,
	 * single or multiple selection. Focus stays on the search field (or the list) and the
	 * active option moves with aria-activedescendant. Keyboard: arrows, Home/End, Enter (and
	 * Space without search) to choose, Esc to close, typing to jump to an option when there is
	 * no search.
	 */
	let {
		label,
		options,
		selected = $bindable([]),
		multiple = false,
		searchable = false,
		searchPlaceholder = '',
		noMatches = '',
		clearLabel = '',
		align = 'start'
	}: {
		/** Name of the control: accessible label and trigger text when nothing is selected. */
		label: string;
		options: SelectOption[];
		/** Chosen values. In single mode it always holds exactly one value. */
		selected?: string[];
		multiple?: boolean;
		searchable?: boolean;
		searchPlaceholder?: string;
		noMatches?: string;
		clearLabel?: string;
		align?: 'start' | 'end';
	} = $props();

	const id = $props.id();
	const listId = `${id}-list`;
	const optionId = (i: number) => `${id}-opt-${i}`;

	let open = $state(false);
	let query = $state('');
	let active = $state(0);
	let root: HTMLDivElement;
	let trigger: HTMLButtonElement;
	let searchInput: HTMLInputElement | undefined = $state();
	let listbox: HTMLUListElement | undefined = $state();
	let panel: HTMLDivElement | undefined = $state();
	// The side the panel anchors to: the requested one, unless it would leave the screen.
	let side: 'start' | 'end' = $state('start');
	let typeahead = '';
	let typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

	const visible = $derived(
		query.trim()
			? options.filter((o) =>
					o.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
				)
			: options
	);
	const selectedOptions = $derived(options.filter((o) => selected.includes(o.value)));
	const summary = $derived.by(() => {
		if (!selectedOptions.length) return label;
		if (!multiple) return selectedOptions[0].label;
		return selectedOptions.length === 1
			? selectedOptions[0].label
			: `${label} · ${selectedOptions.length}`;
	});

	async function openPanel(at: 'first' | 'last' | 'selected' = 'selected') {
		side = align;
		open = true;
		query = '';
		const firstSelected = options.findIndex((o) => selected.includes(o.value));
		active =
			at === 'last' ? options.length - 1 : at === 'first' || firstSelected < 0 ? 0 : firstSelected;
		await tick();
		place();
		(searchable ? searchInput : listbox)?.focus({ preventScroll: true });
		scrollActive();
	}

	/** If the panel would leave the screen, anchors it to the other edge of the trigger. */
	function place() {
		if (!panel) return;
		const margin = 8;
		const rect = panel.getBoundingClientRect();
		if (side === 'start' && rect.right > window.innerWidth - margin) side = 'end';
		else if (side === 'end' && rect.left < margin) side = 'start';
	}

	function closePanel(returnFocus = true) {
		open = false;
		query = '';
		if (returnFocus) trigger.focus();
	}

	function choose(option: SelectOption) {
		if (multiple) {
			selected = selected.includes(option.value)
				? selected.filter((v) => v !== option.value)
				: [...selected, option.value];
		} else {
			selected = [option.value];
			closePanel();
		}
	}

	function move(to: number) {
		if (!visible.length) return;
		active = Math.max(0, Math.min(visible.length - 1, to));
		scrollActive();
	}

	async function scrollActive() {
		await tick();
		document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
	}

	function onTriggerKey(event: KeyboardEvent) {
		if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
			event.preventDefault();
			openPanel();
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			openPanel('last');
		}
	}

	function onPanelKey(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				move(active + 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				move(active - 1);
				break;
			case 'Home':
				event.preventDefault();
				move(0);
				break;
			case 'End':
				event.preventDefault();
				move(visible.length - 1);
				break;
			case 'Enter':
				event.preventDefault();
				if (visible[active]) choose(visible[active]);
				break;
			case ' ':
				if (!searchable) {
					event.preventDefault();
					if (visible[active]) choose(visible[active]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				closePanel();
				break;
			case 'Tab':
				closePanel(false);
				break;
			default:
				if (!searchable && event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
					clearTimeout(typeaheadTimer);
					typeahead += event.key.toLocaleLowerCase();
					typeaheadTimer = setTimeout(() => (typeahead = ''), 600);
					const match = visible.findIndex((o) => o.label.toLocaleLowerCase().startsWith(typeahead));
					if (match >= 0) move(match);
				}
		}
	}

	$effect(() => {
		if (!open) return;
		const onPointer = (event: PointerEvent) => {
			if (!root.contains(event.target as Node)) closePanel(false);
		};
		window.addEventListener('pointerdown', onPointer);
		return () => window.removeEventListener('pointerdown', onPointer);
	});
</script>

<div class="relative" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="inline-flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-control)] px-3 font-mono text-[0.8125rem] transition-colors hover:bg-hover sm:w-auto {open
			? 'bg-hover'
			: 'bg-surface'}"
		class:text-muted={!selectedOptions.length}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-controls={listId}
		aria-label={selectedOptions.length
			? `${label}: ${selectedOptions.map((o) => o.label).join(', ')}`
			: label}
		onclick={() => (open ? closePanel() : openPanel())}
		onkeydown={onTriggerKey}
	>
		<span class="truncate">{summary}</span>
		<ChevronDown
			class="size-4 shrink-0 text-subtle transition-transform {open ? 'rotate-180' : ''}"
		/>
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={panel}
			class="glass absolute top-full z-30 mt-1.5 flex w-max max-w-[calc(100vw-2rem)] min-w-full flex-col overflow-hidden rounded-[var(--radius-panel)] bg-panel/85 font-mono text-[0.8125rem] sm:max-w-72 sm:min-w-56 {side ===
			'end'
				? 'right-0'
				: 'left-0'}"
			onkeydown={onPanelKey}
		>
			{#if searchable}
				<label class="relative block px-1 pt-1">
					<span class="sr-only">{searchPlaceholder || label}</span>
					<Search
						class="pointer-events-none absolute top-1/2 left-3.5 mt-0.5 size-4 -translate-y-1/2 text-subtle"
					/>
					<input
						bind:this={searchInput}
						bind:value={query}
						oninput={() => (active = 0)}
						type="text"
						role="combobox"
						aria-expanded="true"
						aria-controls={listId}
						aria-autocomplete="list"
						aria-activedescendant={visible[active] ? optionId(active) : undefined}
						placeholder={searchPlaceholder}
						autocomplete="off"
						spellcheck="false"
						class="h-9 w-full rounded-[var(--radius-control)] bg-surface pr-3 pl-9 outline-none placeholder:text-subtle"
					/>
				</label>
			{/if}

			<ul
				bind:this={listbox}
				id={listId}
				role="listbox"
				aria-label={label}
				aria-multiselectable={multiple || undefined}
				aria-activedescendant={!searchable && visible[active] ? optionId(active) : undefined}
				tabindex={searchable ? -1 : 0}
				class="flex max-h-64 scroll-py-1 flex-col gap-px overflow-y-auto overscroll-none p-1 outline-none"
			>
				{#each visible as option, i (option.value)}
					{@const isSelected = selected.includes(option.value)}
					<li
						id={optionId(i)}
						role="option"
						aria-selected={isSelected}
						class="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2 {i ===
						active
							? 'bg-hover'
							: ''}"
						onpointermove={() => (active = i)}
						onclick={() => choose(option)}
					>
						<span
							class="flex size-4 shrink-0 items-center justify-center {multiple
								? 'rounded border'
								: ''} {isSelected && multiple ? 'border-fg bg-fg text-bg' : 'border-subtle'}"
							aria-hidden="true"
						>
							{#if isSelected}<Check class="size-3.5" strokeWidth={multiple ? 3 : 2} />{/if}
						</span>
						<span class="flex-1 truncate">{option.label}</span>
						{#if option.count !== undefined}
							<span class="text-xs text-subtle tabular-nums">{option.count}</span>
						{/if}
					</li>
				{:else}
					<li class="px-2.5 py-2 text-muted" role="presentation">{noMatches}</li>
				{/each}
			</ul>

			{#if multiple && selected.length > 0 && clearLabel}
				<div class="border-t border-line p-1">
					<button
						type="button"
						class="w-full rounded-[var(--radius-control)] px-2.5 py-2 text-left text-muted transition-colors hover:bg-hover hover:text-fg"
						onclick={() => {
							selected = [];
							(searchable ? searchInput : listbox)?.focus();
						}}
					>
						{clearLabel}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
