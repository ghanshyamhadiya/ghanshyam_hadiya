// Featured work. Content taken from GhanshyamHadiya_DataEngineer.pdf.
//
// The card renders in the order a data-engineering reviewer actually scans:
// problem -> architecture -> metrics -> stack -> repository.
//
// REPO LINKS: only the migration tool could be matched to a public repo
// (github.com/ghanshyamhadiya/MigrationTool). The supply chain pipeline and the
// churn analysis have no matching public repository on your account — if they
// are private, make them public and fill in `links.repo`. A project card with
// no reachable code is the single most common reason a portfolio project gets
// skipped, so this is worth doing before you share the site.

export const projects = [
    {
        slug: 'supply-chain-data-pipeline',
        title: 'Supply Chain Data Pipeline',
        tagline: 'PySpark · Databricks · Delta Lake',
        year: '2026',
        featured: true,

        problem:
            'Raw supply chain files arrived with no versioning, no schema guarantees and no way to tell whether a load had half-finished. Any reprocessing risked silently double-counting or dropping rows, and nothing recorded what had actually been processed.',
        solution:
            'Built a medallion architecture on Databricks that promotes data through Bronze, Silver and Gold layers, using Delta tables for versioned storage with schema enforcement and ACID guarantees, and structured logging at every layer transition to track file status, row counts and transformation errors.',

        architecture: {
            orchestrator: 'Databricks jobs',
            nodes: [
                { id: 'files', label: 'Raw supply chain files', kind: 'source', note: 'batch drops' },
                { id: 'loader', label: 'Data Loader', kind: 'ingest', note: 'raw file ingest' },
                { id: 'bronze', label: 'Bronze', kind: 'store', note: 'Delta, immutable' },
                { id: 'silver', label: 'Silver', kind: 'transform', note: 'PySpark cleansing' },
                { id: 'gold', label: 'Gold', kind: 'store', note: 'business-ready' },
                { id: 'bi', label: 'Spark SQL dashboards', kind: 'serve', note: 'final analytics' },
            ],
            note: 'Structured logging at each layer transition records file status, row counts and transformation errors.',
        },

        metrics: [
            { value: '3', label: 'layers, Bronze to Gold' },
            { value: 'ACID', label: 'guarantees via Delta' },
        ],

        stack: [
            'PySpark',
            'Databricks',
            'Delta Lake',
            'Spark SQL',
            'Data Loader',
            'Jupyter Notebook',
        ],

        links: {
            // TODO: no matching public repo found — publish it and paste the URL.
            repo: null,
            demo: null,
            writeup: null,
        },
    },

    {
        slug: 'ai-etl-migration-tool',
        title: 'AI-Powered ETL Migration Tool',
        tagline: 'Python · React · Anthropic, Gemini & OpenAI',
        year: '2026',
        featured: true,

        problem:
            'Migrating Oracle SQL logic to Spark is slow, repetitive manual work, and the hard part is not syntax but semantics — Oracle-specific constructs like NVL, DECODE, ROWNUM and cursor logic have no one-to-one Spark equivalent, so a naive translation quietly changes results.',
        solution:
            'Built a tool that reads SQL straight from Oracle SQL Developer session logs or uploaded .sql files and converts it to PySpark or Spark SQL. Conversion rules live in instruction files on GitHub and are fetched at runtime, so the mapping logic can be updated without redeploying, and the user picks source type, target dialect and AI model.',

        architecture: {
            orchestrator: 'Runtime-fetched instruction files',
            nodes: [
                { id: 'src', label: 'SQL Developer logs / .sql', kind: 'source', note: 'session capture' },
                { id: 'parse', label: 'Parser & rule loader', kind: 'ingest', note: 'rules from GitHub' },
                { id: 'ai', label: 'LLM conversion', kind: 'transform', note: 'Anthropic · Gemini · OpenAI' },
                { id: 'db', label: 'PostgreSQL', kind: 'store', note: 'jobs & history' },
                { id: 'out', label: 'PySpark / Spark SQL', kind: 'serve', note: 'production-ready code' },
            ],
            note: 'Handles Oracle-specific constructs including NVL, DECODE, ROWNUM and cursor logic.',
        },

        metrics: [
            { value: '3', label: 'AI providers integrated' },
            { value: '2', label: 'target dialects' },
            { value: '4+', label: 'Oracle construct families mapped' },
        ],

        stack: [
            'Python',
            'Node.js',
            'Express.js',
            'React.js',
            'PostgreSQL',
            'Anthropic API',
            'Gemini API',
            'OpenAI API',
            'PySpark',
        ],

        links: {
            repo: 'https://github.com/ghanshyamhadiya/MigrationTool',
            demo: null,
            writeup: null,
        },
    },

    {
        slug: 'customer-churn-analysis',
        title: 'Customer Churn Analysis',
        tagline: 'Python · Pandas · Seaborn',
        year: '2025',
        featured: true,

        problem:
            'Telecom churn was known to be high but not attributed — there was no segment-level view of which contract types, tenures or demographics were actually driving it, so retention effort had nowhere specific to go.',
        solution:
            'Analysed 7,000+ customer records across contract type, tenure and demographic segments in Pandas, then used segment-level comparison to isolate the cohorts with materially higher churn rather than reporting a single blended number.',

        architecture: {
            orchestrator: null,
            nodes: [
                { id: 'raw', label: 'Telecom records', kind: 'source', note: '7,000+ rows' },
                { id: 'clean', label: 'Pandas cleaning', kind: 'transform', note: 'typing, nulls' },
                { id: 'seg', label: 'Segment analysis', kind: 'transform', note: 'contract, tenure, demo' },
                { id: 'viz', label: 'Matplotlib / Seaborn', kind: 'serve', note: 'cohort findings' },
            ],
            note: 'Exploratory validation in Jupyter Notebook at each stage before drawing conclusions.',
        },

        metrics: [
            { value: '7,000+', label: 'records analysed' },
            { value: '3x', label: 'churn, monthly vs yearly plans' },
            { value: '41%', label: 'senior citizen churn vs 26% overall' },
        ],

        stack: ['Python', 'Pandas', 'Matplotlib', 'Seaborn', 'Jupyter Notebook'],

        links: {
            // TODO: no matching public repo found — publish it and paste the URL.
            repo: null,
            demo: null,
            writeup: null,
        },
    },
];

export const featuredProjects = projects.filter((project) => project.featured !== false);

export default projects;
