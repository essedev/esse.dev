import type { ProjectItem } from '$lib/types/content';

/**
 * Due densità per i progetti. Quelli in corso e conclusi sono la vetrina, a card con
 * immagine: sono le cose su cui un click ha senso. Archiviati e idee sono lo scaffale,
 * un indice a una riga: restano visibili senza pesare quanto il lavoro vivo.
 *
 * In vetrina gli in corso vengono prima dei conclusi; dentro ogni stato resta l'ordine
 * ricevuto (per le collezioni è created_date desc, in home è quello dei featured).
 * Funzione pura: la stessa divisione vale in home, nel listing e nei test.
 */
export const SHOWCASE_STATUSES = ['in-progress', 'completed'] as const;

export interface ProjectShelves {
	showcase: ProjectItem[];
	archived: ProjectItem[];
	ideas: ProjectItem[];
}

export function splitByDensity(projects: ProjectItem[]): ProjectShelves {
	const byStatus = (status: ProjectItem['meta']['status']) =>
		projects.filter((p) => p.meta.status === status);
	return {
		showcase: SHOWCASE_STATUSES.flatMap((s) => byStatus(s)),
		archived: byStatus('archived'),
		ideas: byStatus('idea')
	};
}
