// Headline impact numbers, shown directly under the hero.
//
// These are derived from your CV and are all defensible, but note what they
// are: they measure BREADTH (how many systems and platforms you work across),
// not SCALE (how much data you move). That is the honest framing for ~8 months
// of production experience — an inflated "40M rows/day" would not survive the
// first follow-up question.
//
// STRONGLY RECOMMENDED: if you know the real production numbers from the
// Flytics pipelines — rows per run, nightly runtime, number of ODI mappings,
// SLA hit rate — swap them in. Volume and latency figures land much harder
// than counts of systems. Delete any entry you can't back up; the section
// renders whatever is left.

export const stats = [
    { value: '3+', label: 'Enterprise source systems integrated' },
    { value: '4', label: 'Oracle platforms in production' },
    { value: '3', label: 'Medallion layers shipped, Bronze to Gold' },
    { value: '2', label: 'Clouds worked across, OCI and AWS' },
];

export default stats;
