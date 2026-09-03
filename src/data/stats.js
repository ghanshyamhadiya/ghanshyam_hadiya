// Headline impact numbers, shown directly under the hero.
//
// These are derived from your CV and are all defensible, but note what they
// are: they measure BREADTH (how many systems, platforms and layers you work
// across), not SCALE (how much data you move). That is the honest framing for
// your experience so far — an inflated "40M rows/day" would not survive the
// first follow-up question.
//
// Note: the previous "4 Oracle platforms in production" was dropped when the
// CV moved OCI and OAC out of the current role. Nothing in the CV now evidences
// production ownership of those, so claiming it would not hold up.
//
// STRONGLY RECOMMENDED: if you know the real production numbers from the
// Flytics pipelines — rows per run, Glue job runtime, number of jobs owned,
// validation checks running, SLA hit rate — swap them in. Volume and latency
// figures land much harder than counts of systems. Delete any entry you can't
// back up; the section renders whatever is left.

export const stats = [
    { value: '3+', label: 'Enterprise source systems integrated' },
    { value: '3', label: 'Medallion layers shipped, Bronze to Gold' },
    { value: '2', label: 'Cloud data platforms, AWS and Databricks' },
    { value: '4', label: 'Languages shipped in production' },
];

export default stats;
