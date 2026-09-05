// "How I work" — the four steps of how a pipeline actually gets delivered.
//
// This is the most reusable structural idea from the reference site's
// "How it works" section, and for a data engineer it doubles as evidence: it
// shows a reviewer that you think in terms of a repeatable process rather than
// one-off scripts.
//
// Keep it to four. Five reads as padding.

export const process = [
    {
        title: 'Understand the source',
        body: 'Before a line of transformation code exists I map what the source system actually emits — grain, keys, update pattern, how it lies. Most pipeline failures are really source misunderstandings found late.',
        aside: 'grain, keys, refresh',
    },
    {
        title: 'Model the target',
        body: 'Decide what the data needs to look like on the other side and design the layers that get it there. Naming, typing and conformance are settled here, not argued about later in a dashboard.',
        aside: 'layers, naming, types',
    },
    {
        title: 'Build and validate',
        body: 'Write the transformation, then write the checks that prove it: row-count reconciliation against source, null and schema assertions, business rules. A load that cannot be reconciled is not finished.',
        aside: 'reconcile, assert',
    },
    {
        title: 'Hand over monitored',
        body: 'Ship it with structured logging at every layer transition and alerting on assertion failure, so a bad run stops loudly instead of quietly publishing wrong numbers to people who trust them.',
        aside: 'logging, alerting',
    },
];

export default process;
