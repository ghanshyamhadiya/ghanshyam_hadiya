// Identity, hero copy and contact details.

export const profile = {
    name: 'Ghanshyam M. Hadiya',
    role: 'Data Engineer',
    roleLong: 'Data Engineer — Oracle ODI, PySpark & Analytics Delivery',

    location: 'Ahmedabad, India',

    // Reads as job-seeking. Swap to something like 'Data Consultant at Flytics'
    // if you would rather not signal that publicly.
    availability: 'Open to data engineering roles',

    // Renders as one serif sentence; `emphasis` is set in italic copper.
    headline: {
        lead: 'I build the data pipelines',
        emphasis: 'teams actually trust.',
    },

    intro:
        'Data consultant at Flytics building Oracle ODI pipelines and Databricks medallion architectures — from Oracle Fusion ERP ingestion and PL/SQL transformation through to OAC analytics delivery.',

    // One animated paragraph per entry in the About section.
    about: [
        'I work across the Oracle data stack in production: designing and reviewing ODI mappings and session flows for Oracle Fusion ERP integrations, writing the SQL and PL/SQL that shapes those extracts into reporting layers, and building the analytics surfaces on OCI and OAC that business stakeholders actually read.',
        'Outside the Oracle world I build on Databricks. I shipped a medallion-architecture supply chain pipeline through Bronze, Silver and Gold layers using PySpark and Delta Lake, leaning on versioned storage, schema enforcement and ACID guarantees rather than hoping a reload behaves.',
        'The part I care most about is trust. Most of my time goes into reconciliation, row-count audits, null and schema-mismatch handling, and structured logging at every layer transition — because a pipeline that quietly produces wrong numbers is far worse than one that fails loudly.',
    ],

    currently: {
        label: 'Currently',
        text: 'Extending my warehouse work beyond Oracle and Delta Lake into Snowflake, while shipping ODI and PySpark pipelines at Flytics.',
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
