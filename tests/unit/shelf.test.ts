import { describe, expect, it } from 'vitest';
import type { ProjectItem } from '$lib/types/content';
import { splitByDensity } from '$lib/utils/shelf';

const item = (id: string, status: ProjectItem['meta']['status']) =>
	({ meta: { id, status } }) as ProjectItem;
const ids = (items: ProjectItem[]) => items.map((p) => p.meta.id);

describe('splitByDensity', () => {
	const projects = [
		item('a', 'completed'),
		item('b', 'idea'),
		item('c', 'in-progress'),
		item('d', 'archived'),
		item('e', 'completed'),
		item('f', 'in-progress')
	];

	it('puts in-progress before completed, keeping the received order inside each', () => {
		expect(ids(splitByDensity(projects).showcase)).toEqual(['c', 'f', 'a', 'e']);
	});

	it('moves archived and ideas to their own shelves', () => {
		const { archived, ideas } = splitByDensity(projects);
		expect(ids(archived)).toEqual(['d']);
		expect(ids(ideas)).toEqual(['b']);
	});

	it('loses nothing and duplicates nothing', () => {
		const { showcase, archived, ideas } = splitByDensity(projects);
		expect([...showcase, ...archived, ...ideas]).toHaveLength(projects.length);
	});
});
