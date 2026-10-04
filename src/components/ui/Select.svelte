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
	 * Select custom con il pattern ARIA listbox: trigger a pulsante, pannello con ricerca
	 * opzionale, selezione singola o multipla. Il focus resta sul campo di ricerca (o
	 * sulla lista) e l'opzione attiva passa con aria-activedescendant. Tastiera: frecce,
	 * Home/End, Invio (e Spazio senza ricerca) per scegliere, Esc per chiudere, digitare
	 * per saltare a un'opzione quando non c'è la ricerca.
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
		/** Nome del controllo: etichetta accessibile e testo del trigger senza selezione. */
		label: string;
		options: SelectOption[];
		/** Valori scelti. In modalità singola contiene sempre un solo valore. */
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
	// Lato a cui si aggancia il pannello: quello richiesto, salvo che esca dallo schermo.
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

	/** Se il pannello esce dallo schermo, lo aggancia all'altro bordo del trigger. */
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
		class="inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 text-sm transition-colors hover:border-subtle sm:w-auto"
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
			class="glass absolute top-full z-30 mt-1.5 flex w-max max-w-[calc(100vw-2rem)] min-w-full flex-col overflow-hidden rounded-md bg-panel/85 sm:max-w-72 sm:min-w-56 {side ===
			'end'
				? 'right-0'
				: 'left-0'}"
			onkeydown={onPanelKey}
		>
			{#if searchable}
				<label class="relative block border-b border-line">
					<span class="sr-only">{searchPlaceholder || label}</span>
					<Search
						class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
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
						class="h-10 w-full bg-transparent pr-3 pl-9 text-sm outline-none placeholder:text-subtle"
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
				class="max-h-64 overflow-y-auto overscroll-none py-1 outline-none"
			>
				{#each visible as option, i (option.value)}
					{@const isSelected = selected.includes(option.value)}
					<li
						id={optionId(i)}
						role="option"
						aria-selected={isSelected}
						class="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm {i === active
							? 'bg-line/60'
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
							<span class="font-mono text-xs text-subtle tabular-nums">{option.count}</span>
						{/if}
					</li>
				{:else}
					<li class="px-3 py-2 text-sm text-muted" role="presentation">{noMatches}</li>
				{/each}
			</ul>

			{#if multiple && selected.length > 0 && clearLabel}
				<button
					type="button"
					class="border-t border-line px-3 py-2 text-left text-sm text-muted transition-colors hover:text-fg"
					onclick={() => {
						selected = [];
						(searchable ? searchInput : listbox)?.focus();
					}}
				>
					{clearLabel}
				</button>
			{/if}
		</div>
	{/if}
</div>
