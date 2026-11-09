// The service worker (DECISIONS #47), served at /sw.js by src/pages/sw.js.ts, which writes
// the line below with the build's commit and the languages. One cache per build: a release
// changes this file, the new worker takes over and drops the caches of the older builds,
// keeping the previous one for the pages still open on it.
//
// - Pages: network first, so a release shows at once (and the boot sees it, #37); the copy
//   kept from the last visit answers when the network fails or takes too long.
// - /_astro/*: cache first, the files carry a content hash and never change.
// - Offline and never visited: the offline page of the language, precached at install.
// - Never touched: the agent (/agents/*), other origins, anything that is not a GET.
const CONFIG = { version: 'dev', languages: ['en'], defaultLang: 'en' };

const CACHE = `esse-${CONFIG.version}`;
// After this long a page with a copy in the cache shows the copy; without one it waits.
const NETWORK_TIMEOUT = 4000;
const offlineUrl = (/** @type {string} */ lang) => `/${lang}/offline`;

/** The language of a path (`/it/progetti` -> `it`), or null. */
const langOf = (/** @type {string} */ pathname) => {
	const first = pathname.split('/')[1];
	return CONFIG.languages.includes(first) ? first : null;
};

/** The visitor's language among the site's, as the root does with Accept-Language. */
const preferredLang = () => {
	for (const tag of self.navigator.languages ?? [self.navigator.language]) {
		const lang = langOf(`/${tag.toLowerCase().split('-')[0]}`);
		if (lang) return lang;
	}
	return CONFIG.defaultLang;
};

/** The offline pages, with the stylesheets, scripts and fonts they name. */
async function precache() {
	const cache = await caches.open(CACHE);
	const assets = new Set();
	for (const lang of CONFIG.languages) {
		const response = await fetch(offlineUrl(lang), { cache: 'no-cache' });
		if (!response.ok) throw new Error(`sw: ${offlineUrl(lang)} answered ${response.status}`);
		const html = await response.clone().text();
		for (const [url] of html.matchAll(/\/_astro\/[^"'()\s]+/g)) assets.add(url);
		await cache.put(offlineUrl(lang), response);
	}
	await cache.addAll([...assets]);
}

self.addEventListener('install', (/** @type {any} */ event) => {
	event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (/** @type {any} */ event) => {
	event.waitUntil(
		(async () => {
			// Keys come in creation order: the last two are this build and the one before.
			const ours = (await caches.keys()).filter((key) => key.startsWith('esse-'));
			const keep = new Set([CACHE, ...ours.filter((key) => key !== CACHE).slice(-1)]);
			await Promise.all(ours.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
			await self.registration.navigationPreload?.enable();
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (/** @type {any} */ event) => {
	const { request } = event;
	if (request.method !== 'GET') return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin || url.pathname.startsWith('/agents/')) return;

	if (request.mode === 'navigate') {
		event.respondWith(page(event, url));
	} else if (url.pathname.startsWith('/_astro/')) {
		event.respondWith(asset(event));
	}
});

/** A file with a content hash: from any of our caches, else from the network and kept. */
async function asset(/** @type {any} */ event) {
	const cached = await caches.match(event.request);
	if (cached) return cached;
	const response = await fetch(event.request);
	if (response.ok) {
		const copy = response.clone();
		event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
	}
	return response;
}

/** A page: the network, the copy of the last visit, or the offline page. */
async function page(/** @type {any} */ event, /** @type {URL} */ url) {
	let saved = Promise.resolve();
	const network = (async () => {
		const response = (await event.preloadResponse) ?? (await fetch(event.request));
		// A redirect cannot answer a later navigation from the cache; an error is not kept.
		if (response.ok && !response.redirected && url.pathname !== '/') {
			const copy = response.clone();
			saved = caches.open(CACHE).then((cache) => cache.put(url.pathname, copy));
		}
		return response;
	})();
	// The worker stays alive until the copy is stored, also when the cache answered first. A
	// failed network is handled below, where it picks the copy or the offline page.
	event.waitUntil(network.then(() => saved).catch(() => {}));

	const key = url.pathname === '/' ? `/${preferredLang()}` : url.pathname;
	const cached = await caches.match(key);
	try {
		if (!cached) return await network;
		const timeout = new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT));
		return /** @type {Response} */ (await Promise.race([network, timeout]));
	} catch {
		if (cached) return cached;
		const lang = langOf(url.pathname) ?? preferredLang();
		return (await caches.match(offlineUrl(lang))) ?? Response.error();
	}
}
