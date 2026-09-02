// Skills grouped by layer of the data stack, in the order data actually flows
// through it. That ordering is deliberate — it reads like a platform diagram
// rather than a keyword dump.
//
// There are no proficiency percentages here on purpose. Self-assigned numbers
// ("Python 84%") are unverifiable, tell a reviewer nothing, and advertise a gap
// they will probe in the interview. Depth is signalled instead by `primary`,
// and by what the projects below actually demonstrate.
//
// VERIFY BEFORE SHIPPING:
//   1. Delete anything you could not discuss for five minutes under questioning.
//   2. `primary: true` should mean "I have used this in production and own it".
//      Everything else renders as supporting familiarity.
//   3. Anything self-taught or in progress belongs in the `exploring` layer at
//      the bottom, not in the main layers. Being explicit about that boundary
//      is a credibility asset, not a weakness.

export const skillLayers = [
    {
        layer: 'Languages',
        blurb: 'Day-to-day working languages.',
        items: [
            { name: 'SQL', primary: true },
            { name: 'Python', primary: true },
            { name: 'JavaScript', primary: true },
        ],
    },
    {
        layer: 'Ingestion & Integration',
        blurb: 'Getting data out of source systems reliably and repeatably.',
        items: [
            { name: 'Oracle Data Integrator', primary: true },
            { name: 'REST API extraction', primary: true },
            { name: 'Incremental / CDC loads', primary: true },
            { name: 'Flat file & batch ingest' },
        ],
    },
    {
        layer: 'Transformation & Modelling',
        blurb: 'Turning raw tables into models people can query with confidence.',
        items: [
            { name: 'Dimensional modelling', primary: true },
            { name: 'dbt' },
            { name: 'Apache Spark' },
            { name: 'pandas' },
        ],
    },
    {
        layer: 'Orchestration & Scheduling',
        blurb: 'Dependencies, retries, backfills and SLAs.',
        items: [
            { name: 'ODI load plans', primary: true },
            { name: 'Apache Airflow' },
            { name: 'Cron / shell automation' },
        ],
    },
    {
        layer: 'Storage & Warehouse',
        blurb: 'Where the data lands and how it is laid out.',
        items: [
            { name: 'Oracle Database', primary: true },
            { name: 'PostgreSQL' },
            { name: 'MongoDB' },
            // TODO: pick the ONE cloud warehouse you actually use and delete
            // the rest — Snowflake | BigQuery | Redshift | Databricks.
            { name: 'TODO: Snowflake | BigQuery | Redshift' },
        ],
    },
    {
        layer: 'Data Quality & Observability',
        blurb: 'Failing loudly instead of quietly producing wrong numbers.',
        items: [
            { name: 'Assertion-based DQ checks', primary: true },
            { name: 'Reconciliation & row-count audits', primary: true },
            { name: 'Pipeline alerting' },
        ],
    },
    {
        layer: 'Application & Serving',
        blurb: 'The layer that consumes the data — my full-stack background.',
        items: [
            { name: 'Django', primary: true },
            { name: 'Node.js / Express' },
            { name: 'React' },
            { name: 'REST API design' },
        ],
    },
    {
        layer: 'Tooling & Ops',
        blurb: 'Everything around the pipeline.',
        items: [
            { name: 'Git', primary: true },
            { name: 'Linux / shell', primary: true },
            { name: 'Docker' },
        ],
    },
];

// Rendered separately and labelled honestly as in-progress. Move anything here
// that you are still learning rather than inflating the layers above.
export const exploring = {
    layer: 'Currently exploring',
    blurb: 'Learning in progress — listed here rather than claimed above.',
    items: [
        { name: 'TODO: e.g. Kafka' },
        { name: 'TODO: e.g. Terraform' },
    ],
};

export default skillLayers;
