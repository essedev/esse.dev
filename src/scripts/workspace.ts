/**
 * Interazione dello spazio di lavoro. Le pagine sono statiche e ognuna ha il suo URL:
 * questo script aggiunge solo quello che rende il sito un'app da usare con la tastiera.
 *
 * - j/k (o frecce) scorrono le voci della lista, Invio apre, Esc torna al livello sopra.
 * - "/" e Cmd/Ctrl+K portano alla ricerca, l'unica del sito: filtra la lista e il
 *   registro della pagina, se c'è.
 * - i pulsanti `[data-copy]` copiano e confermano nella barra di stato.
 * - la lista ricorda il proprio scroll fra una pagina e l'altra.
 */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
const workspace = document.querySelector<HTMLElement>('[data-workspace]');

const isTyping = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// Barra di stato: un messaggio breve, poi torna al testo di riposo.
const statusText = document.querySelector<HTMLElement>('[data-status-text]');
let statusTimer: ReturnType<typeof setTimeout> | undefined;
export function flashStatus(message: string) {
	if (!statusText) return;
	statusText.textContent = message;
	clearTimeout(statusTimer);
	statusTimer = setTimeout(() => (statusText.textContent = statusText.dataset.default ?? ''), 1800);
}

// Il tasto modificatore giusto nelle legende.
if (!isMac) {
	for (const el of document.querySelectorAll<HTMLElement>('[data-modkey]')) {
		el.textContent = el.textContent?.replace('⌘', 'Ctrl ') ?? '';
	}
}

// Lista: scroll ricordato e voce aperta sempre visibile.
const scrollBox = document.querySelector<HTMLElement>('[data-sidebar-scroll]');
const SCROLL_KEY = 'sidebar-scroll';
if (scrollBox) {
	try {
		const saved = sessionStorage.getItem(SCROLL_KEY);
		if (saved) scrollBox.scrollTop = Number(saved);
	} catch {
		// sessionStorage può non esserci (navigazione privata): si parte dall'alto.
	}
	scrollBox
		.querySelector<HTMLElement>('[data-nav-item][aria-current="page"]')
		?.scrollIntoView({ block: 'nearest' });
	addEventListener('pagehide', () => {
		try {
			sessionStorage.setItem(SCROLL_KEY, String(scrollBox.scrollTop));
		} catch {
			// vedi sopra
		}
	});
}

// Voci navigabili da tastiera: solo quelle visibili (il filtro ne nasconde alcune).
const navItems = () =>
	[...document.querySelectorAll<HTMLAnchorElement>('[data-sidebar] [data-nav-item]')].filter(
		(el) => el.offsetParent !== null
	);

function select(el: HTMLAnchorElement | undefined) {
	if (!el) return;
	for (const item of document.querySelectorAll('[data-nav-item][data-selected]')) {
		item.removeAttribute('data-selected');
	}
	el.setAttribute('data-selected', '');
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

// Filtro della lista.
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
			const match = !q || (item?.dataset.search ?? '').includes(q);
			row.hidden = !match;
			const divider = row.querySelector<HTMLElement>('[data-divider]');
			if (divider) divider.hidden = !!q;
			if (match) groupVisible++;
		}
		const header = group.querySelector<HTMLElement>(':scope > [data-nav-item]');
		const headerMatch = !q || (header?.dataset.search ?? '').toLowerCase().includes(q);
		group.hidden = !!q && groupVisible === 0 && !headerMatch;
		if (!group.hidden) anyVisible = true;
	}
	if (emptyNote) emptyNote.hidden = anyVisible;
}
function focusSearch() {
	filter?.focus();
	filter?.select();
}

// Una sola ricerca: filtra la lista e, sulle pagine con un registro (progetti, scritti),
// anche il registro, che ascolta l'evento `workspace:search`.
function onSearch() {
	applyFilter();
	dispatchEvent(new CustomEvent('workspace:search', { detail: filter?.value ?? '' }));
}
filter?.addEventListener('input', onSearch);

// La ricerca riparte da quella nell'URL (?q=) e si apre da #search (icona su mobile).
const initialQuery = new URLSearchParams(location.search).get('q');
if (filter && initialQuery) {
	filter.value = initialQuery;
	applyFilter();
}
if (location.hash === '#search') focusSearch();

// Il registro può azzerare la ricerca ("Azzera filtri"): il campo si allinea.
addEventListener('workspace:set-search', (event) => {
	if (!filter) return;
	filter.value = (event as CustomEvent<string>).detail;
	applyFilter();
});
filter?.addEventListener('keydown', (event) => {
	if (event.key === 'Escape') {
		event.preventDefault();
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

// Copia con conferma: nel pulsante e nella barra di stato.
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
});

// Tastiera globale.
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
		case '/':
			event.preventDefault();
			focusSearch();
			break;
		case 'Escape': {
			const parent = workspace?.dataset.parent;
			if (parent && parent !== location.pathname) location.href = parent;
			break;
		}
	}
});

// Etichette che si decodificano al passaggio: 280 ms, poi il testo vero.
const GLYPHS = '01<>/_-=+*#';
document.addEventListener('pointerover', (event) => {
	const el = (event.target as HTMLElement).closest<HTMLElement>('[data-scramble]');
	if (!el || reduceMotion || el.dataset.busy) return;
	const final = el.textContent ?? '';
	el.dataset.busy = '1';
	const start = performance.now();
	const tick = (now: number) => {
		const p = Math.min(1, (now - start) / 280);
		const keep = Math.floor(final.length * p);
		el.textContent =
			final.slice(0, keep) +
			[...final.slice(keep)]
				.map((c) => (c === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
				.join('');
		if (p < 1) requestAnimationFrame(tick);
		else {
			el.textContent = final;
			delete el.dataset.busy;
		}
	};
	requestAnimationFrame(tick);
});
