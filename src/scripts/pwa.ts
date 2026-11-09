/**
 * Registers the service worker (DECISIONS #47) once the page has loaded, so it never competes
 * with the first paint. Only in a build: in `pnpm dev` a worker would serve stale modules.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
	addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js')
			.catch((error) => console.error('pwa: service worker not registered', error));
	});
}
