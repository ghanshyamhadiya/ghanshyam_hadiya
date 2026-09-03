// Identity, hero copy and contact details.
// Content tracks GhanshyamHadiya_DataEngineer.pdf.

export const profile = {
    name: 'Ghanshyam M. Hadiya',
    role: 'Data Engineer',
    roleLong: 'Data Engineer — AWS, Spark & End-to-End Pipeline Delivery',

    location: 'Ahmedabad, India',

    // Reads as job-seeking. Swap to something like 'Data Consultant at Flytics'
    // if you would rather not signal that publicly.
    availability: 'Open to data engineering roles',

    // Renders as one line each; the second renders in copper.
    headline: {
        lead: 'I build the data pipelines',
        emphasis: 'teams actually trust.',
    },

    intro:
        'Data consultant at Flytics building cloud pipelines with AWS Glue, PySpark and Python — owning delivery end to end, from raw ingestion through transformation to validated reporting output.',

    // One animated paragraph per entry in the About section.
    about: [
        'I build and maintain cloud data pipelines on AWS. Day to day that means AWS Glue for orchestration and scheduling across source systems, PySpark and Spark SQL for the transformation logic, and Python around the edges — owning the whole path from raw ingestion through to a validated reporting output rather than a single hop of it.',
        'On Databricks I shipped a medallion-architecture supply chain pipeline through Bronze, Silver and Gold layers, using Delta Lake for versioned storage with schema enforcement and ACID guarantees, and structured logging at every layer transition so a run can be traced rather than guessed at.',
        'The part I care most about is trust. A large share of my work is SQL-based validation and reconciliation between source and target — catching schema mismatches, null violations and business rule failures before anything reaches a downstream consumer. A pipeline that quietly produces wrong numbers is far worse than one that fails loudly.',
        'Before the cloud work I spent my consulting time in the Oracle stack, building ETL in Oracle Data Integrator across enterprise sources including Fusion ERP and writing the SQL and PL/SQL behind the reporting layers. That grounding in enterprise data models still shapes how I design schemas today.',
    ],

    currently: {
        label: 'Currently',
        text: 'Deepening cloud warehousing with Snowflake alongside the AWS Glue and Databricks pipeline work at Flytics.',
    },

    email: 'hadiyaghanshyam13@gmail.com',
    phone: '+91 76229 08854',

    resume: {
        // public/resume.pdf is your real CV. Overwrite that file when you
        // update it — no code change needed.
        href: '/resume.pdf',
        label: 'Download CV',
        updated: 'Sept 2026',
    },

    cta: {
        label: 'View work',
        href: '#work',
    },
};

// `icon` must match a key in the ICONS map in src/components/Contact.jsx
export const socials = [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/ghanshyamhadiya' },
    {
        label: 'LinkedIn',
        icon: 'linkedin',
        href: 'https://www.linkedin.com/in/ghanshyam-hadiya-13971b2bb/',
    },
    { label: 'Email', icon: 'mail', href: `mailto:${profile.email}` },
];

export default profile;
