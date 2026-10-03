/**
 * Umami, caricato dopo la pagina e solo sul dominio di produzione. Uno script esterno
 * con `defer` nel head tratteneva l'evento di load finché il dominio delle statistiche
 * non rispondeva: con la rete lenta la pagina risultava "in caricamento" (e gli E2E
 * andavano in timeout). Così non pesa sul caricamento e non parte in sviluppo,
 * anteprima e test. Il dominio è ammesso dalla CSP in astro.config.mjs.
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
