// Skills grouped by layer of the data stack, in the order data actually flows
// through it. That ordering is deliberate — it reads like a platform diagram
// rather than a keyword dump.
//
// There are no proficiency percentages here on purpose. Self-assigned numbers
// ("Python 84%") are unverifiable, tell a reviewer nothing, and advertise a gap
// they will probe in the interview. Depth is signalled instead by `primary`,
// and by what the projects actually demonstrate.
//
// Every entry below comes from your CV. Airflow and dbt were removed: they were
// placeholders from the earlier draft and appear nowhere in your experience —
// your orchestration is ODI load plans and AWS Glue. Django was removed for the
// same reason. Snowflake sits in `exploring` because your CV marks it as
// learning, which is the honest place for it.
//
// `primary: true` means "I have owned this in production".

export const skillLayers = [
    {
        layer: 'Languages',
        blurb: 'Day-to-day working languages.',
        items: [
            { name: 'SQL', primary: true },
            { name: 'PL/SQL', primary: true },
            { name: 'Python', primary: true },
            { name: 'Spark SQL', primary: true },
            { name: 'JavaScript (ES6+)' },
            { name: 'TypeScript' },
        ],
    },
    {
        layer: 'Ingestion & Integration',
        blurb: 'Getting data out of enterprise source systems reliably.',
        items: [
            { name: 'Oracle Data Integrator (ODI)', primary: true },
            { name: 'Oracle Fusion ERP (O2C)', primary: true },
            { name: 'ODI mappings & session flows', primary: true },
            { name: 'Databricks Data Loader' },
            { name: 'AWS Glue' },
        ],
    },
    {
        layer: 'Transformation & Modelling',
        blurb: 'Turning raw extracts into layers people can query with confidence.',
        items: [
            { name: 'PySpark', primary: true },
            { name: 'Apache Spark', primary: true },
            { name: 'Medallion architecture', primary: true },
            { name: 'ETL pipeline design', primary: true },
            { name: 'Pandas' },
        ],
    },
    {
        layer: 'Orchestration & Scheduling',
        blurb: 'Dependencies, reloads and pipeline execution.',
        items: [
            { name: 'ODI load plans', primary: true },
            { name: 'Databricks jobs' },
            { name: 'AWS Glue jobs' },
        ],
    },
    {
        layer: 'Storage & Warehouse',
        blurb: 'Where the data lands and how it is laid out.',
        items: [
            { name: 'Oracle Database', primary: true },
            { name: 'Delta Lake', primary: true },
            { name: 'Databricks', primary: true },
            { name: 'PostgreSQL' },
            { name: 'MongoDB' },
            { name: 'SQLite' },
        ],
    },
    {
        layer: 'Data Quality & Reconciliation',
        blurb: 'Failing loudly instead of quietly publishing wrong numbers.',
        items: [
            { name: 'Data reconciliation', primary: true },
            { name: 'Row-count & null audits', primary: true },
            { name: 'Schema mismatch handling', primary: true },
            { name: 'Structured pipeline logging', primary: true },
        ],
    },
    {
        layer: 'Analytics & Serving',
        blurb: 'The layer stakeholders actually read.',
        items: [
            { name: 'Oracle Analytics Cloud (OAC)', primary: true },
            { name: 'Spark SQL dashboards', primary: true },
            { name: 'Matplotlib / Seaborn' },
            { name: 'React.js' },
            { name: 'Node.js / Express' },
        ],
    },
    {
        layer: 'Cloud & Tooling',
        blurb: 'Everything around the pipeline.',
        items: [
            { name: 'Oracle Cloud Infrastructure (OCI)', primary: true },
            { name: 'Oracle SQL Developer', primary: true },
            { name: 'Git', primary: true },
            { name: 'Jupyter Notebook', primary: true },
            { name: 'AWS' },
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
