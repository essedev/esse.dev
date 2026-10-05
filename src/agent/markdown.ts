import { Marked } from 'marked';

/**
 * Markdown of the agent's answers rendered to safe HTML. The text comes from a model, so
 * HTML written inside it is shown as text, images become links, and links accept only site
 * paths and https: no `javascript:`. No inline styles (the CSP blocks them anyway).
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

/** The HTML for a Markdown answer. */
export function renderMarkdown(text: string): string {
	return marked.parse(text, { async: false });
}
