// Inlined in the head by Layout.astro, hashed for the CSP by astro.config.mjs.
(() => {
	let theme;
	try {
		theme = localStorage.getItem('theme');
	} catch {
		// No storage: the system decides.
	}
	if (theme !== 'light' && theme !== 'dark')
		theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
	document.documentElement.dataset.theme = theme;
})();
