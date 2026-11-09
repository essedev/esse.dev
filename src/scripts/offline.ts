/**
 * The offline page's list (DECISIONS #47): the pages of this language that the service worker
 * kept on this device, newest build first, with the titles read from their cached HTML. The
 * retry button reloads the address the visitor asked for, which the page answers in place of.
 */

/** The title of a cached page without the site's suffix (`Relay · Simone Salerno`). */
const titleOf = (html: string): string =>
	new DOMParser()
		.parseFromString(html, 'text/html')
		.title.replace(/\s*·\s*Simone Salerno$/, '')
		.trim();

/** The kept pages of `lang`, by path, from every cache of the site. */
async function keptPages(lang: string): Promise<Map<string, string>> {
	const pages = new Map<string, string>();
	const names = (await caches.keys()).filter((name) => name.startsWith('esse-')).reverse();
	for (const name of names) {
		const cache = await caches.open(name);
		for (const request of await cache.keys()) {
			const { pathname } = new URL(request.url);
			const own = pathname === `/${lang}` || pathname.startsWith(`/${lang}/`);
			if (!own || pathname.endsWith('/offline') || pages.has(pathname)) continue;
			const response = await cache.match(request);
			const title = response && titleOf(await response.text());
			if (title) pages.set(pathname, title);
		}
	}
	return pages;
}

async function showKept(section: HTMLElement) {
	const list = section.querySelector('ul');
	const template = section.querySelector('template');
	if (!list || !template) return;
	const pages = await keptPages(document.documentElement.lang);
	for (const [path, title] of [...pages].sort(([a], [b]) => a.localeCompare(b))) {
		const item = template.content.cloneNode(true) as DocumentFragment;
		item.querySelector('a')?.setAttribute('href', path);
		item.querySelector('[data-title]')!.textContent = title;
		item.querySelector('[data-path]')!.textContent = path;
		list.append(item);
	}
	section.hidden = pages.size === 0;
}

const section = document.querySelector<HTMLElement>('[data-offline-pages]');
if (section && 'caches' in window) {
	showKept(section).catch((error) => console.error('offline: cannot read the cache', error));
}
document.querySelector('[data-offline-retry]')?.addEventListener('click', () => location.reload());
