/**
 * The views the agent can draw with `render`: bars, table, timeline. The model sends data,
 * never HTML (the CSP would block styles and scripts, and model HTML would need
 * sanitizing); the page draws the views with the site's tokens. The same validation runs in
 * the Durable Object, which answers the model with the precise error, and in the browser,
 * which draws only a valid view.
 */

/** Size limits of a view. */
export const RENDER_LIMITS = { items: 30, columns: 6, rows: 30, text: 120 } as const;

/** A view the agent asks the page to draw. */
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

/** A validation failure of `render` arguments; the message names the wrong field. */
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

/** Validates and normalizes the `render` arguments; throws `RenderError` naming the bad field. */
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

/** A cell that is a number is aligned to the right. */
export const isNumeric = (cell: string) => /^[-+]?[\d.,]+\s*%?$/.test(cell.trim());
