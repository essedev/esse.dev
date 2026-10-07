/**
 * Workspace interaction. Pages are static and each has its own URL: this script adds only
 * what makes the site an app to use with the keyboard.
 *
 * - j/k (or arrows) move through the list rows, Enter opens, Esc goes up one level.
 * - h/l (or side arrows) open the previous and next entry, where there is a pager. Not `[`
 *   and `]`: on the Italian Mac keyboard they need Option.
 * - "/" and Cmd/Ctrl+K go to the search, the only one on the site: it filters the list and
 *   the page's registry, if there is one.
 * - `[data-copy]` buttons copy and confirm in the status line.
 * - the level up (Esc, breadcrumb, "‹") goes back through history if you came from there.
 * - the list remembers its scroll between pages.
 * - on mobile the list is a drawer that slides in from the left over the pane.
 */

import { track } from './track';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
const workspace = document.querySelector<HTMLElement>('[data-workspace]');

const isTyping = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// Status line (at the bottom of the list): a short message in place of the keys, then gone.
const statusLine = document.querySelector<HTMLElement>('[data-statusline]');
const statusText = document.querySelector<HTMLElement>('[data-status-text]');
let statusTimer: ReturnType<typeof setTimeout> | undefined;
/** Shows a short message in the status line for a moment. */
export function flashStatus(message: string) {
	if (!statusLine || !statusText || !message) return;
	statusText.textContent = message;
	statusLine.setAttribute('data-flash', '');
	clearTimeout(statusTimer);
	statusTimer = setTimeout(() => statusLine.removeAttribute('data-flash'), 1800);
}

// The level up (Esc, breadcrumb, "‹" on mobile). If you came from there, go back through
// history, so the registry finds its filters and scroll again; otherwise open the link.
function goUp(href: string) {
	const target = new URL(href, location.href);
	const ref = document.referrer ? new URL(document.referrer) : null;
	if (
		ref &&
		ref.origin === location.origin &&
		ref.pathname === target.pathname &&
		history.length > 1
	) {
		history.back();
	} else {
		location.href = target.href;
	}
}
document.addEventListener('click', (event) => {
	const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-up]');
	if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
	event.preventDefault();
	goUp(link.href);
});

// The right modifier key in the legends.
if (!isMac) {
	for (const el of document.querySelectorAll<HTMLElement>('[data-modkey]')) {
		el.textContent = el.textContent?.replace('⌘', 'Ctrl ') ?? '';
	}
}

// List: remembered scroll and the open row always visible.
const scrollBox = document.querySelector<HTMLElement>('[data-sidebar-scroll]');
const SCROLL_KEY = 'sidebar-scroll';
if (scrollBox) {
	try {
		const saved = sessionStorage.getItem(SCROLL_KEY);
		if (saved) scrollBox.scrollTop = Number(saved);
	} catch {
		// sessionStorage may be missing (private browsing): start from the top.
	}
	scrollBox
		.querySelector<HTMLElement>('[data-nav-item][aria-current="page"]')
		?.scrollIntoView({ block: 'nearest' });
	addEventListener('pagehide', () => {
		try {
			sessionStorage.setItem(SCROLL_KEY, String(scrollBox.scrollTop));
		} catch {
			// See above.
		}
	});
}

// On mobile the list is a drawer: it slides in from the left over the pane, which becomes
// inert meanwhile. It closes with Esc, a tap outside, the X, or by dragging it to the left.
// From `lg` up the list is always there and the drawer does not exist.
const wide = matchMedia('(min-width: 64rem)');
const drawer = document.querySelector<HTMLElement>('[data-drawer-panel]');
const content = document.querySelector<HTMLElement>('[data-content]');
const openers = [...document.querySelectorAll<HTMLElement>('[data-drawer-open]')];
let returnFocus: HTMLElement | null = null;
const drawerOpen = () => workspace?.dataset.drawer === 'open';

function openDrawer() {
	if (!workspace || !drawer || wide.matches || drawerOpen()) return;
	returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
	workspace.dataset.drawer = 'open';
	content?.setAttribute('inert', '');
	for (const el of openers) el.setAttribute('aria-expanded', 'true');
	drawer.focus({ preventScroll: true });
}

function closeDrawer() {
	if (!workspace || !drawerOpen()) return;
	delete workspace.dataset.drawer;
	content?.removeAttribute('inert');
	for (const el of openers) el.setAttribute('aria-expanded', 'false');
	const active = document.activeElement;
	if (!active || active === document.body || drawer?.contains(active)) {
		(returnFocus?.isConnected ? returnFocus : openers[0])?.focus({ preventScroll: true });
	}
}

for (const el of openers) {
	el.addEventListener('click', () => {
		openDrawer();
		if (el.dataset.drawerOpen === 'search') focusSearch();
	});
}
for (const el of document.querySelectorAll('[data-drawer-close]')) {
	el.addEventListener('click', closeDrawer);
}
wide.addEventListener('change', () => wide.matches && closeDrawer());

// Dragging the drawer: it follows the finger to the left and, released past a third of the
// width (or with a firm flick), it closes; otherwise it returns to its place. The list's
// vertical scroll stays with the browser through `touch-pan-y`, which must be set on the
// list too: it does not pass inside a scrolling container, and there the browser would take
// the gesture.
if (drawer) {
	let start: { x: number; y: number; t: number } | null = null;
	let dx = 0;
	let dragging = false;
	const release = () => {
		drawer.style.removeProperty('translate');
		drawer.style.removeProperty('transition');
		start = null;
		dragging = false;
	};
	drawer.addEventListener('pointerdown', (event) => {
		if (event.pointerType !== 'touch' || !drawerOpen()) return;
		start = { x: event.clientX, y: event.clientY, t: event.timeStamp };
		dx = 0;
	});
	drawer.addEventListener('pointermove', (event) => {
		if (!start) return;
		dx = event.clientX - start.x;
		const dy = event.clientY - start.y;
		if (!dragging) {
			if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) return release();
			if (Math.abs(dx) < 10) return;
			dragging = true;
			drawer.setPointerCapture(event.pointerId);
			drawer.style.transition = 'none';
		}
		drawer.style.translate = `${Math.min(0, dx)}px 0`;
	});
	drawer.addEventListener('pointerup', (event) => {
		if (!start) return;
		const fast = dx / Math.max(1, event.timeStamp - start.t) < -0.5;
		const close = dragging && (dx < -drawer.offsetWidth / 3 || fast);
		release();
		if (close) closeDrawer();
	});
	drawer.addEventListener('pointercancel', release);
}

// Rows reachable by keyboard: only the visible ones (the filter hides some).
const navItems = () =>
	[...document.querySelectorAll<HTMLAnchorElement>('[data-sidebar] [data-nav-item]')].filter(
		(el) => el.offsetParent !== null
	);

// The chosen row is the focused one, and shows through the `:focus-visible` background: if
// focus leaves the list, no second highlighted row is left next to the current page.
function select(el: HTMLAnchorElement | undefined) {
	if (!el) return;
	el.focus({ preventScroll: true });
	el.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
}

function move(delta: number) {
	const items = navItems();
	if (!items.length) return;
	const active = document.activeElement as HTMLAnchorElement | null;
	const from = active && items.includes(active) ? items.indexOf(active) : -1;
	const startAt =
		from >= 0 ? from : items.findIndex((el) => el.getAttribute('aria-current') === 'page');
	const next = startAt < 0 ? (delta > 0 ? 0 : items.length - 1) : startAt + delta;
	select(items[Math.max(0, Math.min(items.length - 1, next))]);
}

// List filter. Without a query the showcase shows: `data-rest` rows (projects outside the
// showcase) stay hidden except the open one, and the "all N" row is there. With a query
// everything that matches shows, showcase or not, and the "all" row disappears.
const filter = document.querySelector<HTMLInputElement>('[data-filter]');
const emptyNote = document.querySelector<HTMLElement>('[data-filter-empty]');
function applyFilter() {
	if (!filter) return;
	const q = filter.value.trim().toLowerCase();
	let anyVisible = false;
	for (const group of document.querySelectorAll<HTMLElement>('[data-sidebar] [data-group]')) {
		let groupVisible = 0;
		for (const row of group.querySelectorAll<HTMLElement>('[data-row]')) {
			const item = row.querySelector<HTMLElement>('[data-nav-item]');
			if (row.hasAttribute('data-more')) {
				row.hidden = !!q;
				continue;
			}
			const isCurrent = item?.getAttribute('aria-current') === 'page';
			const visible = q
				? (item?.dataset.search ?? '').includes(q)
				: !row.hasAttribute('data-rest') || isCurrent;
			row.hidden = !visible;
			if (visible) groupVisible++;
		}
		const header = group.querySelector<HTMLElement>(':scope > [data-nav-item]');
		const headerMatch = !!header && (header.dataset.search ?? '').includes(q);
		group.hidden = !!q && groupVisible === 0 && !headerMatch;
		if (!group.hidden) anyVisible = true;
	}
	if (emptyNote) emptyNote.hidden = anyVisible;
}
function focusSearch() {
	openDrawer();
	filter?.focus();
	filter?.select();
}

// A single search: it filters the list and, on pages with a registry (projects, writing),
// the registry too, which listens for the `workspace:search` event.
function onSearch() {
	applyFilter();
	dispatchEvent(new CustomEvent('workspace:search', { detail: filter?.value ?? '' }));
}
filter?.addEventListener('input', onSearch);

// The search restarts from the one in the URL (?q=) and opens from #search.
const initialQuery = new URLSearchParams(location.search).get('q');
if (filter && initialQuery) {
	filter.value = initialQuery;
	applyFilter();
}
if (location.hash === '#search') focusSearch();

// The registry can clear the search ("Azzera filtri"): the field follows.
addEventListener('workspace:set-search', (event) => {
	if (!filter) return;
	filter.value = (event as CustomEvent<string>).detail;
	applyFilter();
});
filter?.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		event.preventDefault();
		// With an empty field, in the drawer, Esc closes it instead of doing nothing.
		if (!filter.value && drawerOpen()) return closeDrawer();
		filter.value = '';
		onSearch();
		filter.blur();
	} else if (event.key === 'ArrowDown') {
		event.preventDefault();
		select(navItems().find((el) => el.closest('[data-row]')) ?? navItems()[0]);
	} else if (event.key === 'Enter') {
		event.preventDefault();
		const first = navItems().find((el) => el.closest('[data-row]'));
		if (first) location.href = first.href;
	}
});

// Copy with confirmation: in the button and in the status line.
async function copy(text: string, message: string, button: HTMLElement) {
	try {
		await navigator.clipboard.writeText(text);
	} catch {
		return;
	}
	flashStatus(message);
	button.setAttribute('data-copied', '');
	setTimeout(() => button.removeAttribute('data-copied'), 1400);
}
document.addEventListener('click', (event) => {
	const button = (event.target as HTMLElement).closest<HTMLElement>('[data-copy]');
	if (!button) return;
	event.preventDefault();
	const text = button.dataset.copy === 'url' ? location.href : (button.dataset.copy ?? '');
	copy(text, button.dataset.copyMessage ?? '', button);
	track('copy', { what: button.dataset.copy === 'url' ? 'link' : 'command' });
});

// Links that leave the site: only the destination host, the path stays out.
document.addEventListener('click', (event) => {
	const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
	if (!link || link.host === location.host || !link.protocol.startsWith('http')) return;
	track('outbound', { host: link.host });
});

// Global keyboard.
document.addEventListener('keydown', (event) => {
	if (event.defaultPrevented) return;
	if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
		event.preventDefault();
		focusSearch();
		return;
	}
	if (isTyping(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

	switch (event.key) {
		case 'j':
		case 'ArrowDown':
			if (event.key === 'ArrowDown' && !document.activeElement?.closest('[data-sidebar]')) return;
			event.preventDefault();
			move(1);
			break;
		case 'k':
		case 'ArrowUp':
			if (event.key === 'ArrowUp' && !document.activeElement?.closest('[data-sidebar]')) return;
			event.preventDefault();
			move(-1);
			break;
		case 'h':
		case 'l':
		case 'ArrowLeft':
		case 'ArrowRight': {
			const which = event.key === 'h' || event.key === 'ArrowLeft' ? 'prev' : 'next';
			const link = document.querySelector<HTMLAnchorElement>(`[data-pager="${which}"]`);
			if (!link) return;
			event.preventDefault();
			location.href = link.href;
			break;
		}
		case '/':
			event.preventDefault();
			focusSearch();
			break;
		case 'Escape': {
			if (drawerOpen()) {
				closeDrawer();
				break;
			}
			const parent = workspace?.dataset.parent;
			if (parent && parent !== location.pathname) goUp(parent);
			break;
		}
	}
});

// Labels that decode once on entering and once on leaving: 280 ms, then the real text. The
// target is the link or button that contains them (the whole row in the list), so moving
// inside the row does not restart them; text outside a link is its own target.
const GLYPHS = '01<>/_-=+*#';
const SCRAMBLE_MS = 280;
const scrambling = new WeakMap<HTMLElement, number>();

function scramble(el: HTMLElement) {
	// The real text is read once: mid-animation `textContent` is made of glyphs.
	const final = (el.dataset.text ??= el.textContent ?? '');
	cancelAnimationFrame(scrambling.get(el) ?? 0);
	const start = performance.now();
	const tick = (now: number) => {
		const p = Math.min(1, (now - start) / SCRAMBLE_MS);
		const keep = Math.floor(final.length * p);
		el.textContent =
			final.slice(0, keep) +
			[...final.slice(keep)]
				.map((c) => (c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
				.join('');
		if (p < 1) scrambling.set(el, requestAnimationFrame(tick));
		else {
			el.textContent = final;
			scrambling.delete(el);
		}
	};
	scrambling.set(el, requestAnimationFrame(tick));
}

function scrambleTargets(target: EventTarget | null): HTMLElement[] {
	if (!(target instanceof HTMLElement)) return [];
	if (target.matches('a, button')) {
		return [
			...(target.matches('[data-scramble]') ? [target] : []),
			...target.querySelectorAll<HTMLElement>('[data-scramble]')
		];
	}
	return target.matches('[data-scramble]') && !target.closest('a, button') ? [target] : [];
}

// pointerenter and pointerleave do not bubble: listen in the capture phase on the document.
for (const type of ['pointerenter', 'pointerleave'] as const) {
	document.addEventListener(
		type,
		// Text that changes in place, no displacement: it stays with reduced motion (DECISIONS #25).
		(event) => {
			for (const el of scrambleTargets(event.target)) scramble(el);
		},
		true
	);
}
