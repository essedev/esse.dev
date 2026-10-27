/**
 * A tool call as the visitor reads it in the chat (concept Q, D2): its family, which picks the
 * icon, the values for its sentence and, when the result says it, how much came back.
 * AgentChat.svelte fills the sentence from the page's texts (`agentStep*`); the tool name
 * and the raw call stay one click away.
 */

/** What kind of work a tool does. */
export type StepFamily = 'site' | 'code' | 'agents' | 'other';

/** What a result counts, when it counts something. */
export type StepCount = 'results' | 'lines' | 'files' | 'commits' | 'projects';

/** A tool call, readable. */
export interface Step {
	family: StepFamily;
	/** The values of the tool's sentence, by name (`{query}`, `{repo}`...). */
	values: Record<string, string>;
	count?: { kind: StepCount; n: number };
}

const FAMILY: Record<string, StepFamily> = {
	search_site: 'site',
	read_page: 'site',
	list_projects: 'site',
	show_page: 'site',
	repo_overview: 'code',
	list_files: 'code',
	read_file: 'code',
	search_code: 'code',
	recent_commits: 'code',
	run_code: 'code',
	delegate: 'agents'
};

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const base = (path: string) => path.replace(/\/+$/, '').split('/').pop() ?? path;

/** The first line of `run_code` that says something: not the function signature. */
function codeLine(code: string) {
	return (
		code
			.split('\n')
			.map((l) => l.trim())
			.find((l) => l && !/^async\s*\(.*\)\s*=>\s*\{$/.test(l)) ?? ''
	);
}

/** How much a result holds, from its text; nothing when it cannot be read. */
function counted(name: string, text: string): Step['count'] {
	if (name === 'read_file') {
		const n = text.split('\n').filter((l) => /^\s*\d+ {2}/.test(l)).length;
		return n ? { kind: 'lines', n } : undefined;
	}
	let value: unknown;
	try {
		value = JSON.parse(text);
	} catch {
		return undefined;
	}
	const list = (v: unknown, key?: string): unknown[] | undefined => {
		const found = key && v && typeof v === 'object' ? (v as Record<string, unknown>)[key] : v;
		return Array.isArray(found) ? found : undefined;
	};
	const rows: [string, StepCount, string?][] = [
		['search_site', 'results'],
		['list_projects', 'projects'],
		['recent_commits', 'commits'],
		['list_files', 'files', 'entries'],
		['search_code', 'results', 'matches']
	];
	const row = rows.find(([tool]) => tool === name);
	if (!row) return undefined;
	const items = list(value, row[2]);
	return items ? { kind: row[1], n: items.length } : undefined;
}

/**
 * A tool call made readable: `args` are the call's arguments, `result` its text once it came
 * back. An error leaves the count out; the sentence stays.
 */
export function describeStep(
	name: string,
	args: unknown,
	result?: { text: string; error: boolean }
): Step {
	const a = (args && typeof args === 'object' ? args : {}) as Record<string, unknown>;
	const values: Record<string, string> = { name };
	for (const key of ['query', 'repo', 'tag', 'status']) values[key] = str(a[key]);
	values.path = str(a.path).replace(/^\/+/, '');
	values.file = base(values.path);
	values.line = codeLine(str(a.code));
	return {
		family: FAMILY[name] ?? 'other',
		values,
		count: result && !result.error ? counted(name, result.text) : undefined
	};
}

/** A sentence with its `{name}` slots filled; an unknown slot stays empty. */
export function fillStep(template: string, values: Record<string, string>): string {
	return template
		.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** The call as its detail shows it: the code of `run_code` as code, any other call as JSON. */
export function callText(args: unknown): string {
	const code = (args as { code?: unknown } | null)?.code;
	return typeof code === 'string' ? code : JSON.stringify(args, null, 2);
}
