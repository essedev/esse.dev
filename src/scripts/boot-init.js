// Inlined at the top of Workspace.astro, hashed for the CSP by astro.config.mjs. Before the
// first paint it decides whether the boot runs (DECISIONS #37) and marks <html> for
// src/scripts/boot.ts, which plays it: `full` on the first visit, `short` on a new release
// or after a week, nothing otherwise.
(() => {
	const WEEK = 7 * 24 * 60 * 60 * 1000;
	const releases = document.currentScript?.dataset.releases?.split(' ') ?? [];
	// Automated browsers (tests, crawlers) and tabs opened in the background see the page.
	if (!releases.length || navigator.webdriver || document.visibilityState !== 'visible') return;
	let last;
	try {
		localStorage.setItem('boot-probe', '1');
		localStorage.removeItem('boot-probe');
		last = JSON.parse(localStorage.getItem('boot') ?? 'null');
	} catch {
		// No storage, or a value it cannot read: no boot, or it would run on every page.
		return;
	}
	const root = document.documentElement;
	const seen = Array.isArray(last?.seen) ? last.seen : null;
	if (!seen) root.dataset.boot = 'full';
	else if (releases.some((id) => !seen.includes(id)) || !(Date.now() - last.at < WEEK))
		root.dataset.boot = 'short';
})();
