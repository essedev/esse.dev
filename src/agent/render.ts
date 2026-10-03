/**
 * Le viste che l'agente può disegnare con `render`: barre, tabella, linea del tempo. Il
 * modello manda dati, mai HTML (la CSP bloccherebbe stili e script, e un HTML del
 * modello sarebbe da sanificare); la pagina le disegna con i token del sito. La stessa
 * validazione gira nel Durable Object, che risponde al modello con l'errore preciso, e
 * nel browser, che disegna solo una vista valida.
 */

export const RENDER_LIMITS = { items: 30, columns: 6, rows: 30, text: 120 } as const;

export type RenderView =
	| {
			type: 'bars';
			title: string;
			unit?: string;
			items: { label: string; value: number }[];
	  }
	| {
			type: 'table';
			title: string;
			columns: string[];
			rows: string[][];
	  }
	| {
			type: 'timeline';
			title: string;
			items: { date: string; label: string; detail?: string }[];
	  };

export class RenderError extends Error {}

const text = (value: unknown, field: string, optional = false): string | undefined => {
	if (value === undefined || value === null || value === '') {
		if (optional) return undefined;
		throw new RenderError(`${field} is required.`);
	}
	if (typeof value !== 'string' && typeof value !== 'number') {
		throw new RenderError(`${field} must be text.`);
	}
	const s = String(value).trim();
	if (s.length > RENDER_LIMITS.text) {
		throw new RenderError(`${field} is longer than ${RENDER_LIMITS.text} characters.`);
	}
	return s;
};

const list = (value: unknown, field: string, max: number): unknown[] => {
	if (!Array.isArray(value) || value.length === 0) {
		throw new RenderError(`${field} must be a non-empty list.`);
	}
	if (value.length > max) throw new RenderError(`${field} has more than ${max} entries.`);
	return value;
};

const record = (value: unknown, field: string): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new RenderError(`${field} must be an object.`);
	}
	return value as Record<string, unknown>;
};

/** Valida e normalizza gli argomenti di `render`; lancia `RenderError` con il campo sbagliato. */
export function parseRender(args: unknown): RenderView {
	const a = record(args, 'arguments');
	const title = text(a.title, 'title')!;
	switch (a.type) {
		case 'bars': {
			const items = list(a.items, 'items', RENDER_LIMITS.items).map((raw, i) => {
				const item = record(raw, `items[${i}]`);
				const value = Number(item.value);
				if (!Number.isFinite(value) || value < 0) {
					throw new RenderError(`items[${i}].value must be a number of 0 or more.`);
				}
				return { label: text(item.label, `items[${i}].label`)!, value };
			});
			return { type: 'bars', title, unit: text(a.unit, 'unit', true), items };
		}
		case 'table': {
			const columns = list(a.columns, 'columns', RENDER_LIMITS.columns).map((c, i) =>
				text(c, `columns[${i}]`)!
			);
			const rows = list(a.rows, 'rows', RENDER_LIMITS.rows).map((raw, r) => {
				const cells = list(raw, `rows[${r}]`, columns.length);
				if (cells.length !== columns.length) {
					throw new RenderError(`rows[${r}] has ${cells.length} cells, not ${columns.length}.`);
				}
				return cells.map((c, i) => text(c, `rows[${r}][${i}]`, true) ?? '');
			});
			return { type: 'table', title, columns, rows };
		}
		case 'timeline': {
			const items = list(a.items, 'items', RENDER_LIMITS.items).map((raw, i) => {
				const item = record(raw, `items[${i}]`);
				return {
					date: text(item.date, `items[${i}].date`)!,
					label: text(item.label, `items[${i}].label`)!,
					detail: text(item.detail, `items[${i}].detail`, true)
				};
			});
			return { type: 'timeline', title, items };
		}
		default:
			throw new RenderError('type must be "bars", "table" or "timeline".');
	}
}

/** Una cella che è un numero si allinea a destra. */
export const isNumeric = (cell: string) => /^[-+]?[\d.,]+\s*%?$/.test(cell.trim());
