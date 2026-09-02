// Featured work.
//
// The card renders in the order a data-engineering reviewer actually scans:
// problem -> architecture -> metrics -> stack -> repository. Keep that order in
// mind when editing; a card without a problem statement or a repo link is the
// most common reason a portfolio project gets skipped.
//
// The prose below is a realistic template built around your stated stack.
// REWRITE it to describe what you genuinely built, and replace every TODO
// metric with a real, defensible number (or delete the metric).
//
// `architecture` drives the SVG diagram — no image assets required.
//   node.kind: source | ingest | transform | store | serve
//   architecture.orchestrator: optional label drawn as the control bar on top
//
// Set `featured: false` to keep a project in this file but hide it from the site.

export const projects = [
    {
        slug: 'etl-modernisation',
        title: 'Enterprise ETL Modernisation',
        tagline: 'Oracle ODI · Python · Airflow',
        year: '2025',
        featured: true,

        problem:
            'Nightly reporting depended on a chain of hand-maintained SQL scripts with no dependency tracking. A single failure mid-chain left the warehouse half-loaded, and nobody found out until analysts reported broken dashboards the next morning.',
        solution:
            'Rebuilt the chain as declarative ODI mappings driven by reusable load plans, with incremental change capture on the source tables, row-count reconciliation between each hop, and alerting on assertion failure so a bad run stops instead of publishing.',

        architecture: {
            orchestrator: 'Airflow · ODI load plans',
            nodes: [
                { id: 'oltp', label: 'Oracle OLTP', kind: 'source', note: 'TODO: n tables' },
                { id: 'odi', label: 'ODI mappings', kind: 'ingest', note: 'incremental / CDC' },
                { id: 'stg', label: 'Staging schema', kind: 'store', note: 'raw, immutable' },
                { id: 'dq', label: 'Quality checks', kind: 'transform', note: 'reconciliation' },
                { id: 'dwh', label: 'Warehouse', kind: 'store', note: 'star schema' },
                { id: 'bi', label: 'Reporting', kind: 'serve', note: 'analyst dashboards' },
            ],
            note: 'Failed assertions halt the load plan before anything reaches the warehouse.',
        },

        metrics: [
            { value: 'TODO: 12M', label: 'rows per run' },
            { value: 'TODO: 8 min', label: 'end-to-end runtime' },
            { value: 'TODO: 50%', label: 'fewer failed loads' },
        ],

        stack: ['Oracle ODI', 'Python', 'SQL', 'Airflow', 'Oracle Database'],

        links: {
            repo: 'TODO: https://github.com/yourhandle/repo',
            demo: null,
            writeup: null,
        },
    },

    {
        slug: 'analytics-warehouse',
        title: 'Analytics Warehouse & Semantic Layer',
        tagline: 'dbt · SQL · Dimensional modelling',
        year: '2024',
        featured: true,

        problem:
            'Every team calculated core metrics differently, so the same question produced different answers depending on who ran the query. Definitions lived in individual analysts\u2019 SQL rather than anywhere shared or testable.',
        solution:
            'Modelled the domain as conformed dimensions and fact tables, moved metric definitions into version-controlled dbt models with tests on grain and referential integrity, and exposed a documented semantic layer as the single place a metric is defined.',

        architecture: {
            orchestrator: 'Scheduled dbt runs',
            nodes: [
                { id: 'raw', label: 'Raw sources', kind: 'source', note: 'ingested tables' },
                { id: 'stage', label: 'Staging models', kind: 'transform', note: 'typed, renamed' },
                { id: 'core', label: 'Dimensions & facts', kind: 'transform', note: 'conformed' },
                { id: 'marts', label: 'Marts', kind: 'store', note: 'per business domain' },
                { id: 'bi', label: 'BI & self-serve', kind: 'serve', note: 'one metric, one definition' },
            ],
            note: 'Tests run on every model build; a failing grain or relationship test blocks promotion.',
        },

        metrics: [
            { value: 'TODO: 40+', label: 'tested models' },
            { value: 'TODO: 1', label: 'definition per metric' },
            { value: 'TODO: 3 days', label: 'saved per reporting cycle' },
        ],

        stack: ['dbt', 'SQL', 'PostgreSQL', 'Git'],

        links: {
            repo: 'TODO: https://github.com/yourhandle/repo',
            demo: null,
            writeup: null,
        },
    },

    {
        slug: 'operational-data-api',
        title: 'Operational Data API & Dashboard',
        tagline: 'Django · React · MongoDB',
        year: '2024',
        featured: true,

        problem:
            'Warehouse models were only reachable through BI tooling, so internal teams filed ticket requests for numbers that already existed. The data was modelled but not actually serveable to the applications that needed it.',
        solution:
            'Built a documented Django REST layer over the curated models with cursor pagination, response caching and role-scoped access, plus a React dashboard so non-technical users could answer their own questions without a ticket.',

        architecture: {
            orchestrator: null,
            nodes: [
                { id: 'dwh', label: 'Curated models', kind: 'source', note: 'warehouse marts' },
                { id: 'api', label: 'Django REST API', kind: 'transform', note: 'cached, paginated' },
                { id: 'cache', label: 'Query cache', kind: 'store', note: 'hot aggregates' },
                { id: 'ui', label: 'React dashboard', kind: 'serve', note: 'self-serve access' },
            ],
            note: 'The serving layer that closes the loop between modelled data and the people who need it.',
        },

        metrics: [
            { value: 'TODO: 200ms', label: 'p95 response' },
            { value: 'TODO: 15', label: 'internal consumers' },
        ],

        stack: ['Django', 'React', 'MongoDB', 'REST'],

        links: {
            repo: 'TODO: https://github.com/yourhandle/repo',
            demo: null,
            writeup: null,
        },
    },
];

export const featuredProjects = projects.filter((project) => project.featured !== false);

export default projects;
