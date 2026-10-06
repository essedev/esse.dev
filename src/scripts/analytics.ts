/**
 * Umami, self-hosted on `analytics.esse.dev` (server-ops, D20): no cookies and no storage on
 * the device, so no consent banner. Loaded after the page and only on the production domain. An external script with
 * `defer` in the head held back the load event until the analytics domain answered: on a
 * slow network the page looked "loading" (and the E2E tests timed out). This way it does
 * not weigh on loading and does not start in development, preview and tests. The domain is
 * allowed by the CSP in `astro.config.mjs`.
 */
const PRODUCTION_HOST = 'esse.dev';
// Neutral names for the script and the collect endpoint (TRACKER_SCRIPT_NAME and
// COLLECT_API_ENDPOINT on the server): Umami's defaults are in the ad blockers' lists.
const ORIGIN = 'https://analytics.esse.dev';

function load() {
	if (location.hostname !== PRODUCTION_HOST) return;
	const script = document.createElement('script');
	script.src = `${ORIGIN}/stats.js`;
	script.defer = true;
	script.dataset.websiteId = '24fc81b5-6f49-4d7c-a6a5-3733c3b5ccab';
	document.head.append(script);
}

if (document.readyState === 'complete') load();
else addEventListener('load', load, { once: true });
