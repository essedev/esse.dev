/**
 * Custom analytics events. Umami is loaded only on the production domain
 * (`analytics.ts`): elsewhere, and while it is still loading, `track` does nothing.
 *
 * Never the visitor's text: a message to the agent is counted, not read. The data carries
 * only what tells the interactions apart (where a message comes from, which link).
 */
type EventData = Record<string, string | number | boolean>;

declare global {
	interface Window {
		umami?: { track: (name: string, data?: EventData) => void };
	}
}

/** The event names, so a typo does not become a new event in the dashboard. */
export type TrackEvent =
	| 'agent-message'
	| 'agent-retry'
	| 'agent-reset'
	| 'agent-notice'
	| 'agent-error'
	| 'draft-sent'
	| 'draft-error'
	| 'copy'
	| 'outbound';

/** Sends an event to Umami, if it is there. */
export function track(name: TrackEvent, data?: EventData) {
	window.umami?.track(name, data);
}
