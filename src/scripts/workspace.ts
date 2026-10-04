/**
 * Interazione dello spazio di lavoro. Le pagine sono statiche e ognuna ha il suo URL:
 * questo script aggiunge solo quello che rende il sito un'app da usare con la tastiera.
 *
 * - j/k (o frecce) scorrono le voci della lista, Invio apre, Esc torna al livello sopra.
 * - h/l (o frecce laterali) aprono la voce precedente e successiva, dove c'è il pager.
 *   Non `[` e `]`: sulla tastiera italiana del Mac richiedono Option.
 * - "/" e Cmd/Ctrl+K portano alla ricerca, l'unica del sito: filtra la lista e il
 *   registro della pagina, se c'è.
 * - i pulsanti `[data-copy]` copiano e confermano nella riga di stato.
 * - il livello sopra (Esc, breadcrumb, "‹") torna con la history se si arriva da lì.
 * - la lista ricorda il proprio scroll fra una pagina e l'altra.
 * - su mobile la lista è un cassetto che entra da sinistra sopra il riquadro.
 */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
const workspace = document.querySelector<HTMLElement>('[data-workspace]');

const isTyping = (target: EventTarget | null) =>
	target instanceof HTMLElement &&
	(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// Riga di stato (in fondo alla lista): un messaggio breve al posto dei tasti, poi via.
const statusLine = document.querySelector<HTMLElement>('[data-statusline]');
const statusText = document.querySelector<HTMLElement>('[data-status-text]');
let statusTimer: ReturnType<typeof setTimeout> | undefined;
export function flashStatus(message: string) {
	if (!statusLine || !statusText || !message) return;
	statusText.textContent = message;
	statusLine.setAttribute('data-flash', '');
	clearTimeout(statusTimer);
	statusTimer = setTimeout(() => statusLine.removeAttribute('data-flash'), 1800);
}

// Il livello sopra (Esc, breadcrumb, "‹" su mobile). Se si arriva proprio da lì, si torna
// con la history, così il registro ritrova filtri e scroll; altrimenti si apre il link.
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

// Su mobile la lista è un cassetto: entra da sinistra sopra il riquadro, che intanto
// diventa inerte. Si chiude con Esc, con un tocco fuori, con la X o trascinandola verso
// sinistra. Da `lg` in su la lista è sempre lì e il cassetto non esiste.
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

// Trascinare il cassetto: segue il dito verso sinistra e, rilasciato oltre un terzo della
// larghezza (o con un colpo deciso), si chiude; altrimenti torna al suo posto. Lo scroll
// verticale della lista resta al browser con `touch-pan-y`, che va messo anche sulla lista:
// non passa dentro un contenitore che scorre, e lì il browser si prenderebbe il gesto.
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

// Filtro della lista. Senza query si vede la vetrina: le voci `data-rest` (progetti fuori
// vetrina) restano nascoste tranne quella aperta, e c'è la riga "tutti i N". Con una
// query si vede tutto quello che corrisponde, vetrina o no, e la riga "tutti" sparisce.
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

// Una sola ricerca: filtra la lista e, sulle pagine con un registro (progetti, scritti),
// anche il registro, che ascolta l'evento `workspace:search`.
function onSearch() {
	applyFilter();
	dispatchEvent(new CustomEvent('workspace:search', { detail: filter?.value ?? '' }));
}
filter?.addEventListener('input', onSearch);

// La ricerca riparte da quella nell'URL (?q=) e si apre da #search.
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
		// A campo vuoto, nel cassetto, Esc lo chiude invece di non fare nulla.
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

// Copia con conferma: nel pulsante e nella riga di stato.
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

// Etichette che si decodificano una volta entrando e una uscendo: 280 ms, poi il testo vero.
// Il bersaglio è il link o il bottone che le contiene (la riga intera nella lista), così
// muoversi dentro la riga non le fa ripartire; un testo fuori da un link fa da sé.
const GLYPHS = '01<>/_-=+*#';
const SCRAMBLE_MS = 280;
const scrambling = new WeakMap<HTMLElement, number>();

function scramble(el: HTMLElement) {
	// Il testo vero si legge una volta sola: a metà animazione `textContent` è fatto di glifi.
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

// pointerenter e pointerleave non risalgono: si ascoltano in cattura sul documento.
for (const type of ['pointerenter', 'pointerleave'] as const) {
	document.addEventListener(
		type,
		(event) => {
			if (reduceMotion) return;
			for (const el of scrambleTargets(event.target)) scramble(el);
		},
		true
	);
}
