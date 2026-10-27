/**
 * The typography of the agent's answers, shared by the main transcript and a sub-agent's
 * sheet so the two never drift: headings scaled down to the text, lavender list markers,
 * code on a light veil. The size is set where it is used.
 */
export const ANSWER_PROSE =
	'prose max-w-none leading-relaxed prose-invert prose-headings:mt-6 prose-headings:mb-2 prose-headings:font-medium prose-headings:text-fg prose-h1:text-[1.2em] prose-h2:text-[1.1em] prose-h3:text-[1em] prose-p:my-3 prose-p:text-text prose-a:text-fg prose-a:decoration-subtle prose-a:underline-offset-4 prose-strong:font-medium prose-strong:text-fg prose-code:rounded prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:font-normal prose-code:text-fg prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-[var(--radius-control)] prose-pre:bg-surface/60 prose-pre:text-xs prose-ol:my-3 prose-ul:my-3 prose-li:my-1 prose-li:text-text prose-li:marker:text-accent [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&>:first-child]:mt-0 [&>:last-child]:mb-0';
