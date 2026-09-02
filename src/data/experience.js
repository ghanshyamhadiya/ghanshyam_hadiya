// Work history, newest first. Rendered as a scroll-driven vertical timeline.
//
// Write `achievements` metric-first — lead with the number or the outcome, then
// the mechanism. "Cut nightly load from 4h to 40min by partitioning the fact
// table" lands; "Responsible for pipeline performance" does not.
//
// Set `current: true` on your present role; it renders a live badge and the
// `end` value is ignored in favour of "Present".

export const experience = [
    {
        role: 'TODO: Data Engineer',
        company: 'TODO: Company Name',
        companyNote: 'TODO: one line on what the company does',
        location: 'TODO: City / Remote',
        start: 'TODO: 2024',
        end: 'Present',
        current: true,

        summary:
            'TODO: two sentences on the scope you own — which systems, which domains, and who depends on your output.',

        achievements: [
            'TODO: metric-first achievement, e.g. "Cut nightly warehouse load from 4h to 40min by partitioning the largest fact table and switching to incremental merges."',
            'TODO: second achievement covering reliability or data quality.',
            'TODO: third achievement covering collaboration or ownership.',
        ],

        stack: ['Oracle ODI', 'SQL', 'Python', 'Airflow'],
    },

    {
        role: 'TODO: Previous Role',
        company: 'TODO: Company Name',
        companyNote: 'TODO: one line on what the company does',
        location: 'TODO: City / Hybrid',
        start: 'TODO: 2023',
        end: 'TODO: 2024',
        current: false,

        summary:
            'TODO: two sentences on what you built and the engineering context.',

        achievements: [
            'TODO: metric-first achievement.',
            'TODO: second achievement.',
        ],

        stack: ['Python', 'SQL', 'Django'],
    },

    {
        role: 'TODO: First Role',
        company: 'TODO: Company Name',
        companyNote: 'TODO: one line on what the company does',
        location: 'TODO: City / On-site',
        start: 'TODO: 2022',
        end: 'TODO: 2023',
        current: false,

        summary: 'TODO: two sentences.',

        achievements: ['TODO: metric-first achievement.'],

        stack: ['Python', 'SQL'],
    },
];

export default experience;
