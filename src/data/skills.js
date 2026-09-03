// Skills grouped by layer of the data stack, in the order data actually flows
// through it. That ordering is deliberate — it reads like a platform diagram
// rather than a keyword dump.
//
// There are no proficiency percentages here on purpose. Self-assigned numbers
// ("Python 84%") are unverifiable, tell a reviewer nothing, and advertise a gap
// they will probe in the interview. Depth is signalled instead by `primary`,
// and by what the projects actually demonstrate.
//
// `primary: true` means "I have owned this in production".
//
// Kept in sync with the CV. Two notes on what is deliberately NOT primary:
//   - OCI and OAC remain listed because the CV lists them, but they were
//     dropped from the current role, so no experience bullet now evidences
//     production ownership. Marking them primary would be a claim the CV
//     cannot back.
//   - ODI and Fusion ERP stay primary: the trainee role explicitly describes
//     building ETL across 3+ enterprise sources with them. The CV frames that
//     as earlier consulting work, which is exactly how the About copy reads.
//
// Airflow, dbt and Django are absent on purpose — they appear nowhere in your
// experience. Snowflake sits in `exploring` because the CV marks it as
// learning, which is the honest place for it.

export const skillLayers = [
    {
        layer: 'Languages',
        blurb: 'Day-to-day working languages.',
        items: [
            { name: 'Python', primary: true },
            { name: 'SQL', primary: true },
            { name: 'Spark SQL', primary: true },
            { name: 'PL/SQL', primary: true },
            { name: 'JavaScript (ES6+)' },
            { name: 'TypeScript' },
        ],
    },
    {
        layer: 'Ingestion & Integration',
        blurb: 'Getting data out of source systems reliably and repeatably.',
        items: [
            { name: 'AWS Glue', primary: true },
            { name: 'Oracle Data Integrator (ODI)', primary: true },
            { name: 'Oracle Fusion ERP (O2C)', primary: true },
            { name: 'Databricks Data Loader' },
        ],
    },
    {
        layer: 'Transformation & Modelling',
        blurb: 'Turning raw extracts into layers people can query with confidence.',
        items: [
            { name: 'PySpark', primary: true },
            { name: 'Apache Spark', primary: true },
            { name: 'ETL pipeline design', primary: true },
            { name: 'Medallion architecture', primary: true },
            { name: 'Pandas' },
        ],
    },
    {
        layer: 'Orchestration & Scheduling',
        blurb: 'Dependencies, scheduling and pipeline execution.',
        items: [
            { name: 'AWS Glue jobs', primary: true },
            { name: 'ODI load plans', primary: true },
            { name: 'Databricks jobs' },
        ],
    },
    {
        layer: 'Storage & Warehouse',
        blurb: 'Where the data lands and how it is laid out.',
        items: [
            { name: 'Delta Lake', primary: true },
            { name: 'Databricks', primary: true },
            { name: 'Oracle Database', primary: true },
            { name: 'PostgreSQL' },
            { name: 'MongoDB' },
            { name: 'SQLite' },
        ],
    },
    {
        layer: 'Data Quality & Reconciliation',
        blurb: 'Failing loudly instead of quietly publishing wrong numbers.',
        items: [
            { name: 'SQL validation checks', primary: true },
            { name: 'Source-to-target reconciliation', primary: true },
            { name: 'Schema mismatch & null violations', primary: true },
            { name: 'Business rule validation', primary: true },
            { name: 'Structured pipeline logging', primary: true },
        ],
    },
    {
        layer: 'Analytics & Serving',
        blurb: 'The layer stakeholders actually read.',
        items: [
            { name: 'Spark SQL dashboards', primary: true },
            { name: 'Oracle Analytics Cloud (OAC)' },
            { name: 'Matplotlib / Seaborn' },
            { name: 'React.js' },
            { name: 'Node.js / Express' },
        ],
    },
    {
        layer: 'Cloud & Tooling',
        blurb: 'Everything around the pipeline.',
        items: [
            { name: 'AWS', primary: true },
            { name: 'Git', primary: true },
            { name: 'Jupyter Notebook', primary: true },
            { name: 'Oracle SQL Developer', primary: true },
            { name: 'Oracle Cloud Infrastructure (OCI)' },
        ],
    },
];

// Listed honestly as in progress rather than claimed above.
export const exploring = {
    layer: 'Currently exploring',
    blurb: 'Learning in progress — listed here rather than claimed above.',
    items: [{ name: 'Snowflake' }],
};

export default skillLayers;
