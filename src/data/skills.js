// Skills grouped by category. Add, remove or reorder freely — the Skills
// section renders whatever is here. `level` (0-100) drives the meter bar.

export const skillGroups = [
    {
        category: 'Frontend',
        items: [
            { name: 'React.js', level: 92 },
            { name: 'Tailwind CSS', level: 90 },
            { name: 'Framer Motion', level: 82 },
            { name: 'JavaScript', level: 90 },
        ],
    },
    {
        category: 'Backend',
        items: [
            { name: 'Node.js', level: 88 },
            { name: 'Express.js', level: 86 },
            { name: 'Django', level: 78 },
            { name: 'Python', level: 84 },
        ],
    },
    {
        category: 'Data',
        items: [
            { name: 'MongoDB', level: 85 },
            { name: 'SQL', level: 80 },
            { name: 'Oracle ODI', level: 70 },
            { name: 'Git', level: 88 },
        ],
    },
];

// Flat list used by the marquee / tag cloud.
export const skillTags = skillGroups.flatMap((group) => group.items.map((item) => item.name));

export default skillGroups;
