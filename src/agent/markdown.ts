import { Marked } from 'marked';

/**
 * Markdown delle risposte dell'agente in HTML sicuro. Il testo viene da un modello, quindi
 * l'HTML scritto dentro si mostra come testo, le immagini diventano link, e i link
 * accettano solo path del sito e https: niente `javascript:`. Nessuno stile inline (la
 * CSP li blocca comunque).
 */

const escape = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const marked = new Marked({
	gfm: true,
	breaks: false,
	renderer: {
		html({ text }) {
			return escape(text);
		},
		image({ href, text }) {
			return /^https:\/\//.test(href)
				? `<a href="${escape(href)}">${escape(text)}</a>`
				: escape(text);
		},
		link({ href, tokens }) {
			const label = this.parser.parseInline(tokens);
			if (href.startsWith('/') && !href.startsWith('//')) {
				return `<a href="${escape(href)}" class="ulink text-fg">${label}</a>`;
			}
			if (/^https:\/\//.test(href)) {
				return `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer" class="ulink text-fg">${label}</a>`;
			}
			return label;
		}
	}
});

export function renderMarkdown(text: string): string {
	return marked.parse(text, { async: false });
}
