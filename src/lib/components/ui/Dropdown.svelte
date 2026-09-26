<script lang="ts">
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		width?: string;
		maxHeight?: string;
		zIndex?: number;
		children: Snippet;
		triggerElement?: HTMLElement;
		dropdownId?: string; // For ARIA
		triggerId?: string; // For ARIA
		role?: 'menu' | 'listbox' | 'dialog';
		enableFocusTrap?: boolean;
		autoFocus?: boolean;
	}

	let {
		isOpen,
		onClose,
		width = '22rem',
		maxHeight = '16rem',
		zIndex = 100,
		children,
		triggerElement,
		dropdownId = 'dropdown',
		triggerId = 'trigger',
		role = 'listbox',
		enableFocusTrap = false,
		autoFocus = true
	}: Props = $props();

	let dropdownElement = $state<HTMLDivElement>();
	let position = $state({ top: 'auto', left: 'auto', right: 'auto', bottom: 'auto' });
	let isAnimating = $state(false);
	let focusableElements = $state<HTMLElement[] | null>(null);
	let lastFocusedElement = $state<HTMLElement | null>(null);
	let isMobile = $state(false);

	$effect(() => {
		if (!browser) return;
		const checkMobile = () => (isMobile = window.innerWidth <= 480);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	// Calculate optimal position relative to viewport
	const calculatePosition = async () => {
		if (!dropdownElement || !triggerElement || !browser) return;

		await tick(); // Ensure DOM is updated

		const dropdownRect = dropdownElement.getBoundingClientRect();
		const spaceBelow = window.innerHeight - triggerElement.getBoundingClientRect().bottom;
		const spaceAbove = triggerElement.getBoundingClientRect().top;
		const spaceRight = window.innerWidth - triggerElement.getBoundingClientRect().left;

		// Vertical positioning - same logic for both mobile and desktop
		let top = '100%';
		if (spaceBelow < dropdownRect.height && spaceAbove > spaceBelow) {
			top = `-${dropdownRect.height + 8}px`;
		}

		// Horizontal positioning - different for mobile vs desktop
		let left = '0';
		let right = 'auto';

		if (isMobile) {
			// On mobile, make dropdown fill width with padding
			left = '0';
			right = '0';
		} else {
			// On desktop, position relative to trigger
			if (spaceRight < dropdownRect.width) {
				left = 'auto';
				right = '0';
			}
		}

		position = { top, left, right, bottom: 'auto' };
	};

	// Handle focus trap
	const trapFocus = (e: KeyboardEvent) => {
		if (!enableFocusTrap || !focusableElements || focusableElements.length === 0) return;

		if (e.key === 'Tab') {
			const first = focusableElements[0];
			const last = focusableElements[focusableElements.length - 1];

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	};

	// Enhanced keyboard navigation
	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			onClose();
			// Use lastFocusedElement instead of triggerElement to ensure correct focus return
			if (lastFocusedElement) {
				lastFocusedElement.focus();
			} else if (triggerElement) {
				triggerElement.focus();
			}
			return;
		}

		// Navigate with arrow keys
		if (focusableElements && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
			e.preventDefault();
			const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
			let nextIndex: number;

			if (e.key === 'ArrowDown') {
				nextIndex = currentIndex + 1 >= focusableElements.length ? 0 : currentIndex + 1;
			} else {
				nextIndex = currentIndex - 1 < 0 ? focusableElements.length - 1 : currentIndex - 1;
			}

			focusableElements[nextIndex]?.focus();
		}

		trapFocus(e);
	};

	const handleOutsideClick = (e: MouseEvent) => {
		if (
			dropdownElement &&
			!dropdownElement.contains(e.target as Node) &&
			triggerElement &&
			!triggerElement.contains(e.target as Node)
		) {
			onClose();
		}
	};

	// Manage focus and animations
	$effect(() => {
		if (isOpen && browser) {
			// Store last focused element
			lastFocusedElement = document.activeElement as HTMLElement;

			const setupDropdown = async () => {
				// Calculate position before starting animation
				await calculatePosition();

				// Now that position is set, start the animation
				isAnimating = true;

				// Setup focus management. `calculatePosition` has a `tick`, so DOM is ready.
				if (dropdownElement) {
					const elements = dropdownElement.querySelectorAll(
						'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
					);
					focusableElements = Array.from(elements) as HTMLElement[];

					// Focus first focusable element
					if (autoFocus && focusableElements.length > 0) {
						focusableElements[0].focus();
					}
				}
			};

			setupDropdown();
		} else if (!isOpen && lastFocusedElement) {
			// Return focus when closing and reset animation state
			isAnimating = false;
			lastFocusedElement.focus();
			lastFocusedElement = null;
		}
	});

	// Recalculate position on scroll/resize
	$effect(() => {
		if (isOpen && browser) {
			const handlePositionUpdate = () => calculatePosition();
			window.addEventListener('scroll', handlePositionUpdate, true);
			window.addEventListener('resize', handlePositionUpdate);

			return () => {
				window.removeEventListener('scroll', handlePositionUpdate, true);
				window.removeEventListener('resize', handlePositionUpdate);
			};
		}
	});
</script>

<svelte:window on:click={handleOutsideClick} on:keydown={handleKeydown} />

{#if isOpen && browser}
	<div
		bind:this={dropdownElement}
		id={dropdownId}
		{role}
		aria-labelledby={triggerId}
		class="dropdown absolute mt-2 overflow-hidden rounded-xl border border-white/10 bg-white/5"
		class:animate={isAnimating}
		style="
		top: {position.top}; 
		left: {position.left}; 
		right: {position.right};
		width: {isMobile ? 'auto' : width}; 
		max-height: {maxHeight}; 
		z-index: {zIndex};
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		background-color: rgba(17, 17, 17, 0.6);
		"
	>
		{@render children()}
	</div>
{/if}

<style>
	.dropdown {
		transform-origin: top center;
		transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform, opacity;
		isolation: isolate;
	}

	.animate {
		animation: dropdownEnter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes dropdownEnter {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
