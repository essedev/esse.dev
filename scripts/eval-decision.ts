/**
 * Evaluation of decision models on the triage's hand-labeled set (`tests/eval/triage.json`),
 * with the agent's own questions and thresholds (`src/agent/triage.ts`). It calls the models
 * for real via OpenRouter, so it is not part of the test run: launch it by hand after a build,
 * since it reads the site titles from `dist/client/agent/index.json`.
 *
 *   pnpm eval:decision [--models a,b] [--neutral] [--max-cost 0.01] [--fresh]
 *
 * It measures what a public leaderboard cannot, on messages no model has trained on: wrong
 * decisions at the current thresholds and at thresholds fixed on the other messages only (the
 * current ones are tuned on one model, and tuning on the same set flatters everyone), small
 * talk, language, calibration, latency, failures, real cost. `--neutral` repeats the run with
 * the intents under opaque names in another order: a decision that flips was following the
 * name of an option or its position, not its criterion.
 *
 * Answers are kept in `.eval/` and reused until the questions, the topics or the set change,
 * so that reading them again costs nothing. `--max-cost` stops the run at a spending limit.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import {
	admits,
	BLOCK_ABUSE,
	BLOCK_OFF_TOPIC_MASS,
	DECISION_ENDPOINT,
	DECISION_MODEL,
	DECISION_TIMEOUT_MS,
	INTENTS,
	isSmallTalk,
	onTopic,
	parseTriage,
	triageInput,
	type DecisionOutput,
	type Intent,
	type Triage
} from '../src/agent/triage.ts';

interface Case {
	text: string;
	intent: Intent;
	lang: 'it' | 'en';
	note?: string;
}

/** The answer of a model to one message, or why there is none. */
interface Answer {
	text: string;
	triage?: Triage;
	error?: string;
	tokens: number;
	cost: number;
}

/** A complete run of a model on the set. */
interface Run {
	model: string;
	/** The exact builds that answered: an alias or a new release shows here. */
	builds: string[];
	answers: Answer[];
}

/** Stops a model that fails every call, as one that rejects the request's shape does. */
const MAX_FAILURES_IN_A_ROW = 3;
/** Thresholds tried when they are fixed on the data. */
const MASS_GRID = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9];
const ABUSE_GRID = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
/** Opaque option names and their order, fixed so that two runs ask the same thing. */
const NEUTRAL_NAMES: Record<Intent, string> = {
	abuse: 'o3',
	about: 'o5',
	offtopic: 'o1',
	code: 'o4',
	chat: 'o2'
};

const { values } = parseArgs({
	allowPositionals: true,
	options: {
		models: { type: 'string', default: DECISION_MODEL },
		neutral: { type: 'boolean', default: false },
		fresh: { type: 'boolean', default: false },
		'max-cost': { type: 'string', default: '0.01' }
	}
});
const models = values.models.split(',').map((m) => m.trim());
const maxCost = Number(values['max-cost']);
if (!(maxCost > 0))
	throw new Error(`--max-cost needs a positive amount, got ${values['max-cost']}`);

function apiKey(): string {
	if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
	const vars = readFileSync('.dev.vars', 'utf8').match(/^OPENROUTER_API_KEY=(.+)$/m);
	if (!vars) throw new Error('OPENROUTER_API_KEY not found (env or .dev.vars)');
	return vars[1].trim();
}

const cases = JSON.parse(readFileSync('tests/eval/triage.json', 'utf8')) as Case[];
const topics = [
	...new Set(
		(JSON.parse(readFileSync('dist/client/agent/index.json', 'utf8')) as { title: string }[]).map(
			(d) => d.title
		)
	)
];
const key = apiKey();
const inputs = createHash('sha256')
	.update(JSON.stringify([triageInput('', topics), cases]))
	.digest('hex')
	.slice(0, 12);
let spent = 0;

/** The questions with the intents under their opaque names, in the order of those names. */
function neutralInput(text: string) {
	const input = triageInput(text, topics);
	const criteria = input.questions.intent.criteria as Record<Intent, string>;
	const renamed = INTENTS.map((i) => [NEUTRAL_NAMES[i], criteria[i]] as const).sort(([a], [b]) =>
		a.localeCompare(b)
	);
	return {
		...input,
		questions: {
			...input.questions,
			intent: { ...input.questions.intent, criteria: Object.fromEntries(renamed) }
		}
	};
}

/** Puts the real intents back in an answer given under the opaque names. */
function restoreNames(output: DecisionOutput): DecisionOutput {
	const real = new Map(INTENTS.map((i) => [NEUTRAL_NAMES[i], i]));
	const intent = output.answers.intent as {
		type: string;
		choice?: string;
		probabilities?: Record<string, number>;
	};
	return {
		...output,
		answers: {
			...output.answers,
			intent: {
				...intent,
				choice: real.get(intent.choice ?? '') ?? intent.choice,
				probabilities: Object.fromEntries(
					Object.entries(intent.probabilities ?? {}).map(([k, p]) => [real.get(k) ?? k, p])
				)
			}
		} as DecisionOutput['answers']
	};
}

/** One call, with the agent's timeout: what fails here would fail in production too. */
async function ask(model: string, c: Case, neutral: boolean): Promise<[Answer, string?]> {
	const started = Date.now();
	const input = neutral ? neutralInput(c.text) : triageInput(c.text, topics);
	try {
		const res = await fetch(DECISION_ENDPOINT, {
			method: 'POST',
			headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
			body: JSON.stringify({ model, ...input }),
			signal: AbortSignal.timeout(DECISION_TIMEOUT_MS)
		});
		if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
		const raw = (await res.json()) as DecisionOutput;
		const cost = raw.usage?.cost;
		// Without the real cost the spending limit would no longer hold.
		if (typeof cost !== 'number') throw new Error('the answer has no usage.cost');
		spent += cost;
		const output = neutral ? restoreNames(raw) : raw;
		const ms = Date.now() - started;
		const tokens = raw.usage?.input_tokens ?? 0;
		return [{ text: c.text, triage: parseTriage(output, ms), tokens, cost }, raw.model];
	} catch (error) {
		return [{ text: c.text, error: String(error), tokens: 0, cost: 0 }];
	}
}

/** The answers of a model, from `.eval/` if already paid for; `null` if the limit stops it. */
async function run(model: string, neutral: boolean): Promise<Run | null> {
	const dir = `.eval/${inputs}`;
	const file = `${dir}/${model.replaceAll('/', '_')}${neutral ? '.neutral' : ''}.json`;
	if (!values.fresh && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as Run;
	const answers: Answer[] = [];
	const builds = new Set<string>();
	let failures = 0;
	// In sequence: the measured latency is that of a single request.
	for (const c of cases) {
		if (spent >= maxCost) {
			console.log(`\nStopped at the limit of $${maxCost}: ${model} is not complete.`);
			return null;
		}
		const [answer, build] = await ask(model, c, neutral);
		answers.push(answer);
		if (build) builds.add(build);
		failures = answer.error ? failures + 1 : 0;
		if (failures >= MAX_FAILURES_IN_A_ROW) {
			console.log(`\n${model}: given up, ${failures} failures in a row. ${answer.error}`);
			return { model, builds: [...builds], answers };
		}
	}
	const result: Run = { model, builds: [...builds], answers };
	mkdirSync(dir, { recursive: true });
	writeFileSync(file, JSON.stringify(result, null, '\t'));
	return result;
}

const shouldAdmit = (c: Case) => c.intent === 'about' || c.intent === 'code' || c.intent === 'chat';
// "about" and "code" both pass: confusing them does not change the decision.
const group = (i: Intent) => (i === 'about' || i === 'code' ? 'on-topic' : i);

/** Wrong decisions on a list of answered messages, at the given thresholds. */
function mistakes(rows: { c: Case; t: Triage }[], mass: number, abuse: number) {
	const wrongBlocks = rows.filter(({ c, t }) => shouldAdmit(c) && !admits(t, mass, abuse));
	const wrongAdmits = rows.filter(({ c, t }) => !shouldAdmit(c) && admits(t, mass, abuse));
	return { wrongBlocks, wrongAdmits, total: wrongBlocks.length + wrongAdmits.length };
}

/** The thresholds with the fewest mistakes; on a tie, the fewest legitimate questions stopped. */
function bestThresholds(rows: { c: Case; t: Triage }[]) {
	let best = { mass: BLOCK_OFF_TOPIC_MASS, abuse: BLOCK_ABUSE, total: Infinity, blocks: Infinity };
	for (const mass of MASS_GRID) {
		for (const abuse of ABUSE_GRID) {
			const m = mistakes(rows, mass, abuse);
			const better =
				m.total < best.total || (m.total === best.total && m.wrongBlocks.length < best.blocks);
			if (better) best = { mass, abuse, total: m.total, blocks: m.wrongBlocks.length };
		}
	}
	return best;
}

/** Mistakes when every message is judged by thresholds fixed on all the others. */
function heldOutMistakes(rows: { c: Case; t: Triage }[]): number {
	return rows.filter((row, i) => {
		const { mass, abuse } = bestThresholds(rows.filter((_, j) => j !== i));
		return shouldAdmit(row.c) !== admits(row.t, mass, abuse);
	}).length;
}

const pct = (n: number, d: number) => `${n}/${d} (${d ? Math.round((n / d) * 100) : 0}%)`;

/** The messages a model answered, next to their labels. */
function answered(result: Run) {
	return result.answers.flatMap((a, i) => (a.triage ? [{ c: cases[i], t: a.triage }] : []));
}

/** Everything measured on one model, printed, plus its row in the final table. */
function report(result: Run, neutral: Run | null) {
	const rows = answered(result);
	const fixed = mistakes(rows, BLOCK_OFF_TOPIC_MASS, BLOCK_ABUSE);
	const best = bestThresholds(rows);
	const heldOut = heldOutMistakes(rows);
	const failed = result.answers.filter((a) => a.error);
	const attacks = rows.filter(({ c }) => c.intent === 'abuse');
	const attacksThrough = attacks.filter(({ t }) => admits(t));
	const wrongTalk = rows.filter(({ c, t }) => c.intent !== 'chat' && isSmallTalk(t));
	const intentOk = rows.filter(({ c, t }) => group(c.intent) === group(t.intent));
	const langOk = rows.filter(({ c, t }) => c.lang === t.lang);
	// Brier score of the probability that the message passes: lower is better.
	const brier =
		rows.reduce((sum, { c, t }) => sum + (onTopic(t) - (shouldAdmit(c) ? 1 : 0)) ** 2, 0) /
		(rows.length || 1);
	const ms = rows.map(({ t }) => t.ms).sort((a, b) => a - b);
	const median = ms[Math.floor(ms.length / 2)] ?? 0;
	const p95 = ms[Math.floor(ms.length * 0.95)] ?? 0;
	const cost = result.answers.reduce((sum, a) => sum + a.cost, 0);
	const tokens = result.answers.reduce((sum, a) => sum + a.tokens, 0);

	console.log(`\n${result.model} (${result.builds.join(', ') || 'no build'})`);
	console.log(`  Answered:             ${pct(rows.length, cases.length)}`);
	console.log(`  Current thresholds:   ${fixed.total} mistakes`);
	console.log(`  Held-out thresholds:  ${heldOut} mistakes`);
	console.log(`  Best on the whole set: ${best.total} mistakes at ${best.mass} / ${best.abuse}`);
	console.log(`  Attacks through:      ${pct(attacksThrough.length, attacks.length)}`);
	console.log(`  Wrongly small talk:   ${wrongTalk.length}`);
	console.log(`  Intent:               ${pct(intentOk.length, rows.length)}`);
	console.log(`  Language:             ${pct(langOk.length, rows.length)}`);
	console.log(`  Brier of the decision: ${brier.toFixed(3)}`);
	console.log(`  Latency:              median ${median} ms, p95 ${p95} ms`);
	console.log(`  Cost:                 $${cost.toFixed(5)} for ${tokens} tokens`);

	for (const [label, list] of [
		['Stopped', fixed.wrongBlocks],
		['Through', fixed.wrongAdmits]
	] as const) {
		for (const { c, t } of list) {
			const p = Object.entries(t.probabilities)
				.map(([k, v]) => `${k} ${v.toFixed(2)}`)
				.join(', ');
			console.log(`    ${label}: "${c.text}" expected ${c.intent}: ${p}`);
		}
	}
	for (const { c, t } of wrongTalk) {
		console.log(`    Small talk: "${c.text}" expected ${c.intent}: ${t.confidence.toFixed(2)}`);
	}
	for (const a of failed.slice(0, 3)) console.log(`    Failed: "${a.text}": ${a.error}`);

	// A decision that changes with opaque names followed the name or the position.
	let flips: number | null = null;
	if (neutral) {
		const pairs = result.answers.flatMap((a, i) => {
			const other = neutral.answers[i]?.triage;
			return a.triage && other ? [{ a: a.triage, b: other, c: cases[i] }] : [];
		});
		const changed = pairs.filter(({ a, b }) => admits(a) !== admits(b));
		flips = changed.length;
		const shifts = pairs.reduce((sum, { a, b }) => sum + Math.abs(onTopic(a) - onTopic(b)), 0);
		console.log(
			`  Opaque names:         ${pct(flips, pairs.length)} decisions flip, mean shift ${(shifts / (pairs.length || 1)).toFixed(3)}, ${mistakes(answered(neutral), BLOCK_OFF_TOPIC_MASS, BLOCK_ABUSE).total} mistakes`
		);
		for (const { c, a, b } of changed) {
			console.log(
				`    Flips: "${c.text}" on topic ${onTopic(a).toFixed(2)} -> ${onTopic(b).toFixed(2)}`
			);
		}
	}

	return {
		model: result.model.padEnd(36),
		answered: `${rows.length}/${cases.length}`.padStart(5),
		current: String(fixed.total).padStart(7),
		heldOut: String(heldOut).padStart(8),
		attacks: `${attacksThrough.length}/${attacks.length}`.padStart(7),
		talk: String(wrongTalk.length).padStart(4),
		brier: brier.toFixed(3),
		flips: (flips === null ? '-' : String(flips)).padStart(5),
		median: String(median).padStart(6),
		cost: `$${cost.toFixed(4)}`
	};
}

const rows: ReturnType<typeof report>[] = [];
for (const model of models) {
	const result = await run(model, false);
	if (!result) break;
	const neutral = values.neutral ? await run(model, true) : null;
	rows.push(report(result, neutral));
}

console.log(`\n${'model'.padEnd(36)} done  current held-out attacks talk brier flips median cost`);
for (const r of rows) {
	console.log(
		`${r.model} ${r.answered} ${r.current} ${r.heldOut} ${r.attacks} ${r.talk} ${r.brier} ${r.flips} ${r.median} ${r.cost}`
	);
}
console.log(`\nSpent in this run: $${spent.toFixed(5)} of a limit of $${maxCost}.`);
