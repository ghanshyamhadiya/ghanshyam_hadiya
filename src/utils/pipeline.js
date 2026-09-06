// Shared pipeline-run constants and derivations.
//
// Kept out of the components so fast refresh stays happy, and so
// scripts/audit-cards.mjs can import buildLines directly to prove the run log
// contains nothing that is not in projects.js.

// Fraction of a stage's scroll progress spent assembling the architecture. The
// remainder is dwell, so the finished pipeline sits on screen for a beat before
// the stage scrolls away.
export const BUILD_END = 0.6;

// Builds the run-log lines for a project.
//
// HONESTY CONSTRAINT: every value here comes from the project data — node
// labels, node notes, the architecture note, the real metrics. Nothing is
// invented.
//
// Note the STEP COUNTERS rather than timestamps. `[3/6]` is derived; a
// timestamp like `[00:00:04]` would be fabricated telemetry, which on a data
// engineer's portfolio is the same credibility problem as the self-assigned
// skill percentages removed elsewhere. Do not "improve" this by adding times,
// durations or row counts.
export const buildLines = (project) => {
    const { architecture, metrics } = project;
    const nodes = architecture?.nodes ?? [];
    const total = Math.max(nodes.length - 1, 1);
    const lines = [];

    if (architecture?.orchestrator) {
        lines.push({
            step: `[0/${total}]`,
            text: `orchestrated by ${architecture.orchestrator}`,
        });
    }

    for (let i = 0; i < nodes.length - 1; i += 1) {
        lines.push({
            step: `[${i + 1}/${total}]`,
            text: `${nodes[i].label} → ${nodes[i + 1].label}`,
            note: nodes[i + 1].note,
            ok: true,
        });
    }

    for (const metric of metrics ?? []) {
        lines.push({ step: '[✓]', text: `${metric.label}: ${metric.value}`, done: true });
    }

    return lines;
};
