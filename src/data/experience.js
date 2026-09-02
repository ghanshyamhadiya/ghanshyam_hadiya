// Work history, newest first. Rendered as an animated vertical timeline.
// Use `end: 'Present'` for your current role.

export const experience = [
    {
        role: 'Data Engineer',
        company: 'Your Company',
        location: 'Remote',
        start: '2024',
        end: 'Present',
        description:
            'Designing and orchestrating ETL workflows with Oracle ODI, building reusable ingestion mappings and automating data quality checks across multiple source systems.',
        highlights: [
            'Built reusable ODI mappings that cut new pipeline setup time in half',
            'Automated data quality validation across critical warehouse tables',
        ],
        stack: ['Oracle ODI', 'SQL', 'Python'],
    },
    {
        role: 'Full Stack Developer',
        company: 'Previous Company',
        location: 'Hybrid',
        start: '2023',
        end: '2024',
        description:
            'Shipped production features across the MERN stack, owning everything from REST API design and MongoDB schema modelling to accessible, animated React interfaces.',
        highlights: [
            'Delivered a role-based admin dashboard used daily by internal teams',
            'Improved page load performance through code splitting and caching',
        ],
        stack: ['React', 'Node.js', 'Express', 'MongoDB'],
    },
    {
        role: 'Backend Developer Intern',
        company: 'First Company',
        location: 'On-site',
        start: '2022',
        end: '2023',
        description:
            'Built internal tooling with Python and Django, wrote integration tests and supported the migration of legacy reporting scripts into scheduled jobs.',
        highlights: [
            'Migrated legacy reporting scripts to scheduled Django management commands',
            'Raised backend test coverage on the services layer',
        ],
        stack: ['Python', 'Django', 'PostgreSQL'],
    },
];

export default experience;
