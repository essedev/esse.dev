/**
 * Umami, loaded after the page and only on the production domain. An external script with
 * `defer` in the head held back the load event until the analytics domain answered: on a
 * slow network the page looked "loading" (and the E2E tests timed out). This way it does
 * not weigh on loading and does not start in development, preview and tests. The domain is
 * allowed by the CSP in `astro.config.mjs`.
 */
const PRODUCTION_HOST = 'esse.dev';

function load() {
	if (location.hostname !== PRODUCTION_HOST) return;
	const script = document.createElement('script');
	script.src = 'https://umami.essedev.it/script.js';
	script.defer = true;
	script.dataset.websiteId = 'fcbb5baf-7f04-4667-8289-8ffb42043012';
	document.head.append(script);
}

if (document.readyState === 'complete') load();
else addEventListener('load', load, { once: true });
