/**
 * The boot (concept O, DECISIONS #37). src/scripts/boot-init.js, inline before the first paint,
 * marks <html> with `data-boot` (`full` or `short`) and the desk-colored screen covers the
 * window already drawn under it; this script writes the lines, then sets `load`: the screen
 * goes off and the interface shows as a skeleton (texts as bars the shape of their lines, no
 * icons or images) whose pieces load in reading order, list and pane side by side. Then it
 * removes the mark. Any key, click, touch or wheel skips to the end. The lines come from the
 * data that Workspace.astro puts on the screen.
 */
import type { BootData } from '../lib/boot';

/** Scales every wait: the one knob for the boot's length. */
const PACE = 0.72;
/** How long a loaded piece glows, as `[data-loaded]` in global.css. */
const GLOW_MS = 700;
/** The systemd spinner: three stars bouncing in the status box. */
const SPIN = [
	'*     ',
	'**    ',
	'***   ',
	' ***  ',
	'  *** ',
	'   ***',
	'    **',
	'     *',
	'    **',
	'   ***',
	'  *** ',
	' ***  ',
	'***   ',
	'**    '
];

type Part = string | Node;

const root = document.documentElement;
const screen = document.querySelector<HTMLElement>('[data-boot-screen]');
const mode = root.dataset.boot;

if (screen && (mode === 'full' || mode === 'short')) start(screen, mode);

/** A span with a class: the parts of a line that stand out. */
function span(text: string, className: string) {
	const el = document.createElement('span');
	el.textContent = text;
	el.className = className;
	return el;
}

/** A template with `{name}` slots, filled with text or nodes. */
function fill(text: string, values: Record<string, Part | number>): Part[] {
	return text.split(/\{(\w+)\}/).map((piece, i) => {
		if (i % 2 === 0) return piece;
		const value = values[piece];
		return typeof value === 'number' ? String(value) : (value ?? `{${piece}}`);
	});
}

function start(screen: HTMLElement, mode: 'full' | 'short') {
	const log = screen.querySelector<HTMLElement>('[data-boot-log]')!;
	const data = JSON.parse(screen.dataset.bootData!) as BootData;
	const t = data.text;
	const timers = new Set<number>();
	let done = false;

	// What the visitor had seen, then the visit recorded at the start: a reload during the boot
	// does not play it again.
	let seen: string[] = [];
	try {
		const last = JSON.parse(localStorage.getItem('boot') ?? 'null');
		if (Array.isArray(last?.seen)) seen = last.seen;
		localStorage.setItem('boot', JSON.stringify({ at: Date.now(), seen: data.ids }));
	} catch {
		// boot-init.js checked the storage before marking the page: nothing to recover here.
	}

	const sleep = (ms: number) =>
		new Promise<void>((resolve) => {
			const id = window.setTimeout(() => {
				timers.delete(id);
				resolve();
			}, ms * PACE);
			timers.add(id);
		});

	const SKIPS = ['pointerdown', 'touchstart', 'wheel'] as const;
	const finish = () => {
		if (done) return;
		done = true;
		timers.forEach(clearTimeout);
		removeEventListener('keydown', onKey, true);
		SKIPS.forEach((type) => removeEventListener(type, finish, true));
		document.querySelectorAll('[data-skel]').forEach((el) => el.removeAttribute('data-skel'));
		delete root.dataset.boot;
	};
	// A key only skips: it does not also move the list or open the search.
	const onKey = (event: KeyboardEvent) => {
		event.preventDefault();
		event.stopImmediatePropagation();
		finish();
	};
	addEventListener('keydown', onKey, true);
	SKIPS.forEach((type) => addEventListener(type, finish, { capture: true, passive: true }));

	const line = (...parts: Part[]) => {
		const p = document.createElement('p');
		p.append(...parts);
		log.append(p);
		log.scrollTop = log.scrollHeight;
		return p;
	};
	/** A `[  OK  ]` line; the box is returned so a spinner can run in it first. */
	const ok = (...parts: Part[]) => {
		const box = span('  OK  ', 'boot-ok');
		line('[', box, '] ', ...parts);
		return box;
	};
	const spin = async (box: HTMLElement, until: Promise<unknown>, min: number) => {
		let ready = false;
		until.finally(() => (ready = true));
		const from = performance.now();
		box.className = 'boot-wait';
		for (let i = 0; !ready || performance.now() - from < min * PACE; i++) {
			box.textContent = SPIN[i % SPIN.length];
			await sleep(80);
		}
		box.className = 'boot-ok';
		box.textContent = '  OK  ';
	};
	const count = async (cells: HTMLElement[], targets: number[], ms: number) => {
		const steps = Math.round(ms / 40);
		for (let i = 1; i <= steps; i++) {
			cells.forEach((c, j) => (c.textContent = String(Math.round((targets[j] * i) / steps))));
			await sleep(40);
		}
	};
	// The text, typed with an uneven hand, before the only caret on screen.
	const type = async (p: HTMLElement, text: string, ms: number) => {
		const out = span('', 'boot-typed');
		p.append(out, span('', 'caret'));
		await sleep(260);
		for (const ch of text) {
			out.textContent += ch;
			await sleep(ms * (0.6 + Math.random() * 0.8));
		}
	};

	const bios = () => {
		const day = new Date(`${data.date}T12:00:00`).toLocaleDateString(root.lang, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
		const version = data.date.slice(0, 7).replace('-', '.');
		line(
			...fill(t.bios, { version, commit: span(data.commit, 'boot-accent'), date: day })
		).className = 'boot-head';
	};

	const full = async () => {
		const css = getComputedStyle(root);
		// The built CSS is minified (`.07`): through a number, then in the page's notation.
		const decimal = (v: string) => Number(v).toLocaleString(root.lang);
		let saved = false;
		try {
			saved = localStorage.getItem('theme') !== null;
		} catch {
			// Unreachable: boot-init.js read the storage a moment ago.
		}
		const { projects, method, articles, releases } = data.counts;

		bios();
		await sleep(180);
		line(t.cpu);
		await sleep(90);
		line(t.cores, '   ', span(t.coresNote, 'boot-dim'));
		await sleep(160);
		const cells = [0, 1, 2, 3].map(() => span('0', 'boot-count'));
		const memory = line(
			...fill(t.memory, {
				projects: cells[0],
				method: cells[1],
				articles: cells[2],
				releases: cells[3]
			})
		);
		await count(cells, [projects, method, articles, releases], 520);
		memory.append('  ', span('OK', 'boot-ok'));
		await sleep(160);
		const theme = root.dataset.theme === 'light' ? t.light : t.dark;
		line(...fill(t.theme, { theme }), ' ', span(saved ? t.saved : t.system, 'boot-dim'));
		await sleep(110);
		line(
			...fill(t.language, { language: navigator.language }),
			' ',
			span(t.languageNote, 'boot-dim')
		);
		await sleep(240);
		line(' ');
		line(t.start);
		await sleep(220);
		const mounts: [string, number][] = [
			['/content/projects', projects],
			['/content/method', method],
			['/content/articles', articles]
		];
		for (const [path, n] of mounts) {
			ok(...fill(t.mounted, { path, n }));
			await sleep(80 + Math.random() * 100);
		}
		ok(t.csp);
		await sleep(80 + Math.random() * 100);
		await spin(ok(...fill(t.fonts, { fonts: data.fonts.join(', ') })), document.fonts.ready, 520);
		await sleep(90);
		const crt = fill(t.crt, {
			gap: css.getPropertyValue('--crt-scan-gap').trim(),
			vignette: decimal(css.getPropertyValue('--crt-vignette'))
		});
		for (const parts of [crt, fill(t.agent, { model: data.model }), [t.target]]) {
			ok(...parts);
			await sleep(90 + Math.random() * 110);
		}
	};

	const short = async () => {
		const unseen = data.ids.filter((id) => !seen.includes(id)).length;
		const news = data.news.filter((n) => !seen.includes(n.id));
		bios();
		await sleep(200);
		if (!unseen) {
			line(t.quickNone);
			return;
		}
		line(...fill(t.quick, { n: unseen }));
		await sleep(160);
		for (const item of news.slice(0, 5)) {
			ok(...fill(t.news, { title: span(item.title, 'boot-accent') }));
			await sleep(110 + Math.random() * 80);
		}
	};

	const reveal = (el: Element) => {
		el.removeAttribute('data-skel');
		// A text glows as it lands, unless it already runs an animation of its own.
		if (!hasText(el) || getComputedStyle(el).animationName !== 'none') return;
		el.setAttribute('data-loaded', '');
		window.setTimeout(() => el.removeAttribute('data-loaded'), GLOW_MS);
	};
	// One stream per column, in reading order: a few pieces at a time, now and then a stall,
	// as a page that arrives over the network.
	const stream = async (pieces: Element[], speed: number) => {
		for (let i = 0; i < pieces.length;) {
			const batch = 1 + Math.floor(Math.random() * 3);
			pieces.slice(i, i + batch).forEach(reveal);
			i += batch;
			await sleep((Math.random() < 0.06 ? 140 : 18 + Math.random() * 22) * speed);
		}
	};
	const load = async () => {
		const workspace = document.querySelector('[data-workspace]');
		if (!workspace) return;
		const list = workspace.querySelector('#sidebar');
		const all = pieces(workspace);
		all.forEach((el) => el.setAttribute('data-skel', ''));
		root.dataset.boot = 'load';
		await sleep(mode === 'full' ? 320 : 180);
		const speed = mode === 'full' ? 1 : 0.6;
		await Promise.all([
			stream(
				all.filter((el) => list?.contains(el)),
				speed
			),
			stream(
				all.filter((el) => !list?.contains(el)),
				speed
			)
		]);
	};

	(async () => {
		try {
			await (mode === 'full' ? full() : short());
			line(' ');
			await type(line(t.login, ' '), t.user, mode === 'full' ? 80 : 70);
			await sleep(300);
			if (!done) await load();
		} finally {
			finish();
		}
	})();
}

/** Whether an element has text of its own, not only in its children. */
function hasText(el: Element) {
	return [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim());
}

/**
 * The pieces of the interface on screen, in reading order: an image, an icon, a LED, a field,
 * or the outermost element with text of its own, which carries the text inside it (a second
 * bar under its own would show darker). The rest (frames, glass, cards, chips) is the skeleton.
 */
function pieces(scope: Element) {
	const out: Element[] = [];
	const visit = (el: Element, inText: boolean) => {
		const box = el.getBoundingClientRect();
		if (!el.getClientRects().length || box.top > innerHeight || box.bottom < 0) return;
		if (el.matches('img, svg, input, .led, .caret')) {
			out.push(el);
			return;
		}
		const text = !inText && hasText(el);
		if (text) out.push(el);
		for (const child of el.children) visit(child, inText || text);
	};
	visit(scope, false);
	return out;
}
