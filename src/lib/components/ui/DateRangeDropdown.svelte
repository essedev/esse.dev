<script lang="ts">
	import type { GlobalContent } from '$lib/types';
	import { getTranslations, type TranslationKey } from '$lib/utils/translations';
	import { Calendar, ChevronDown } from '@lucide/svelte';
	import Dropdown from './Dropdown.svelte';

	interface Props {
		dateRange: { from?: string; to?: string };
		onDateChange: (type: 'from' | 'to', value: string) => void;
		onClearDates?: () => void;
		global?: GlobalContent;
	}

	let { dateRange, onDateChange, onClearDates, global }: Props = $props();

	const translationKeys: TranslationKey[] = ['dateRange', 'from', 'to', 'clearDates'];
	let t = $derived(getTranslations(global, translationKeys));

	let isOpen = $state(false);
	let triggerElement = $state<HTMLButtonElement>();
	let dropdownContentElement = $state<HTMLElement>();

	// Generate unique IDs for ARIA
	const dropdownId = `date-dropdown-${Math.random().toString(36).substring(7)}`;
	const triggerId = `date-trigger-${Math.random().toString(36).substring(7)}`;

	const toggleDropdown = () => {
		if (!isOpen) {
			// Calculate position before opening
			if (triggerElement) {
				triggerElement.focus();
			}
		}
		isOpen = !isOpen;
	};

	const closeDropdown = () => {
		isOpen = false;
	};

	const hasDateRange = $derived(dateRange.from || dateRange.to);
	const formatDateRange = $derived(() => {
		if (dateRange.from && dateRange.to) {
			return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
		} else if (dateRange.from) {
			return `${t.from} ${formatDate(dateRange.from)}`;
		} else if (dateRange.to) {
			return `${t.to} ${formatDate(dateRange.to)}`;
		}
		return '';
	});

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('it-IT', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	};
</script>

<div class="relative">
	<button
		bind:this={triggerElement}
		id={triggerId}
		aria-expanded={isOpen}
		aria-haspopup="dialog"
		aria-controls={dropdownId}
		onclick={toggleDropdown}
		class="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-md transition-colors hover:bg-white/10"
		style="touch-action: manipulation;"
	>
		<Calendar class="h-4 w-4" />
		<span class="truncate">
			{hasDateRange ? formatDateRange() : t.dateRange}
		</span>
		<ChevronDown class="ml-auto h-4 w-4" />
	</button>

	<Dropdown
		{isOpen}
		{triggerElement}
		{dropdownId}
		{triggerId}
		onClose={closeDropdown}
		role="dialog"
		enableFocusTrap={true}
		autoFocus={false}
	>
		<div class="space-y-4 p-4" bind:this={dropdownContentElement} tabindex="-1">
			<div class="space-y-2">
				<label for="date-from" class="block text-sm text-white/70">{t.from}</label>
				<input
					id="date-from"
					type="date"
					value={dateRange.from || ''}
					onchange={(e) => onDateChange('from', e.currentTarget.value)}
					class="date-input w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-white backdrop-blur-sm focus:border-white/20 focus:outline-none"
				/>
			</div>
			<div class="space-y-2">
				<label for="date-to" class="block text-sm text-white/70">{t.to}</label>
				<input
					id="date-to"
					type="date"
					value={dateRange.to || ''}
					onchange={(e) => onDateChange('to', e.currentTarget.value)}
					class="date-input w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-white backdrop-blur-sm focus:border-white/20 focus:outline-none"
				/>
			</div>
			{#if hasDateRange && onClearDates}
				<div class="border-t border-white/5 pt-3">
					<button
						onclick={onClearDates}
						class="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
					>
						{t.clearDates}
					</button>
				</div>
			{/if}
		</div>
	</Dropdown>
</div>

<style>
	.date-input {
		box-sizing: border-box;
		min-width: 0;
		max-width: 100%;
	}

	/* Mobile-specific styles to ensure proper containment */
	@media (max-width: 480px) {
		.date-input {
			width: 100% !important;
			max-width: 100% !important;
			min-width: 0 !important;
			appearance: none;
			-webkit-appearance: none;
			-moz-appearance: textfield;
		}
	}

	.date-input::-webkit-calendar-picker-indicator {
		filter: invert(1) brightness(0.8);
		cursor: pointer;
	}

	.date-input::-webkit-inner-spin-button,
	.date-input::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
