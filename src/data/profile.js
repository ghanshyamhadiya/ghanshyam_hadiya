// Identity, hero copy and contact details.
//
// Fill in every value marked TODO. Run `grep -rn "TODO:" src/data` to see the
// full outstanding list.

export const profile = {
    name: 'TODO: Your Name',
    role: 'Data Engineer',
    roleLong: 'Data Engineer — ETL, Warehouse Modelling & Orchestration',

    // TODO: e.g. 'Pune, India'
    location: 'TODO: City, Country',
    availability: 'Open to data engineering roles',

    // Renders as one serif sentence; `emphasis` is set in italic copper.
    headline: {
        lead: 'I build the data pipelines',
        emphasis: 'teams actually trust.',
    },

    intro:
        'I design and operate ETL workflows that turn scattered operational data into tested, documented, on-time datasets — the kind analysts and applications can depend on without asking whether the numbers are right.',

    // One animated paragraph per entry in the About section.
    about: [
        'I work at the ingestion and transformation layer of the data stack: modelling sources, building incremental loads, and shaping raw operational tables into warehouse models that answer real business questions.',
        'Most of my time goes into the parts nobody sees until they break — idempotent reloads, schema-drift handling, data quality assertions and alerting. A pipeline that silently produces wrong numbers is worse than one that fails loudly, so I build for the second.',
        'I also ship the applications that consume the data. Having built Django and React interfaces on top of my own models makes me a better data engineer: I design schemas knowing exactly how painful a bad one is to query.',
    ],

    currently: {
        label: 'Currently',
        text: 'TODO: e.g. Deepening Oracle ODI load plans and Airflow orchestration patterns.',
    },

    // TODO: your real address. Used by the mailto link and the copy button.
    email: 'TODO: you@example.com',

    resume: {
        // TODO: drop your CV at public/resume.pdf (a placeholder is committed).
        href: '/resume.pdf',
        label: 'Download CV',
        updated: 'TODO: Jan 2026',
    },

    cta: {
        label: 'View work',
        href: '#work',
    },
};

// `icon` must match a key in the ICONS map in src/components/Contact.jsx
export const socials = [
    { label: 'GitHub', icon: 'github', href: 'TODO: https://github.com/yourhandle' },
    { label: 'LinkedIn', icon: 'linkedin', href: 'TODO: https://linkedin.com/in/yourhandle' },
    { label: 'Email', icon: 'mail', href: `mailto:${profile.email}` },
];

export default profile;
