/**
 * Light and dark theme. The theme is `data-theme` on <html>: `theme-init.js`, inline in the
 * head, sets it before the first paint, from the visitor's choice saved here or else from
 * the system. The toolbar's button flips it; a choice equal to the system's is not
 * saved, so the site goes back to following the system. Without storage (private window,
 * blocked site data) the choice lasts for the page.
 */
export type Theme = 'light' | 'dark';

/** The storage key, shared with src/scripts/theme-init.js. */
const KEY = 'theme';

const system = matchMedia('(prefers-color-scheme: light)');
const systemTheme = (): Theme => (system.matches ? 'light' : 'dark');

function saved(): Theme | null {
	try {
		const value = localStorage.getItem(KEY);
		return value === 'light' || value === 'dark' ? value : null;
	} catch {
		return null;
	}
}

function save(theme: Theme) {
	try {
		if (theme === systemTheme()) localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, theme);
	} catch {
		// No storage: the choice holds until the next page.
	}
}

function current(): Theme {
	return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Applies the theme to the page, its address bar and the toggle's label. */
function apply(theme: Theme) {
	const root = document.documentElement;
	root.setAttribute('data-theme-switching', '');
	root.dataset.theme = theme;
	// For the browsers that still read `theme-color` (Chrome, Safari before 26): the top bar's
	// color, from global.css, read after the theme is applied.
	const bar = getComputedStyle(root).getPropertyValue('--color-bar-top').trim();
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bar);
	for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
		const label = theme === 'light' ? button.dataset.labelDark : button.dataset.labelLight;
		if (label) {
			button.setAttribute('aria-label', label);
			button.title = label;
		}
	}
	// One frame without transitions, then the hovers are back.
	requestAnimationFrame(() =>
		requestAnimationFrame(() => root.removeAttribute('data-theme-switching'))
	);
}

apply(current());

document.addEventListener('click', (event) => {
	if (!(event.target as Element).closest('[data-theme-toggle]')) return;
	const next: Theme = current() === 'light' ? 'dark' : 'light';
	save(next);
	apply(next);
});

// The system changes (sunset, macOS on auto): followed only without a choice of one's own.
system.addEventListener('change', () => {
	if (!saved()) apply(systemTheme());
});
